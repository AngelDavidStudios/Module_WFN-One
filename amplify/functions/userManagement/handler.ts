import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminSetUserPasswordCommand,
  type UserType,
  type AttributeType,
  type GroupType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  DynamoDBClient,
  PutItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import type { Handler } from 'aws-lambda';

const cognitoClient = new CognitoIdentityProviderClient({});
const dynamoClient = new DynamoDBClient({});
const USER_POOL_ID = process.env.USER_POOL_ID!;
const AUDIT_TABLE_NAME = process.env.AUDIT_TABLE_NAME;

interface RequestBody {
  action: 'listUsers' | 'createUser' | 'deleteUser' | 'addToGroup' | 'removeFromGroup' | 'getUserGroups' | 'resetPassword';
  username?: string;
  email?: string;
  temporaryPassword?: string;
  newPassword?: string;
  groupName?: string;
}

interface LambdaEvent {
  body?: string;
  requestContext?: {
    http?: {
      method: string;
    };
  };
  headers?: Record<string, string>;
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export const handler: Handler<LambdaEvent, LambdaResponse> = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json',
  };

  const httpMethod = event.requestContext?.http?.method || 'POST';

  // Handle OPTIONS request for CORS
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  try {
    const body: RequestBody = JSON.parse(event.body || '{}');

    switch (body.action) {
      case 'listUsers':
        return await listUsers(corsHeaders);

      case 'createUser':
        if (!body.email || !body.username) {
          return errorResponse(400, 'Email and username are required', corsHeaders);
        }
        return await createUser(body.email, body.username, body.temporaryPassword, corsHeaders);

      case 'deleteUser':
        if (!body.username) {
          return errorResponse(400, 'Username is required', corsHeaders);
        }
        return await deleteUser(body.username, corsHeaders);

      case 'addToGroup':
        if (!body.username || !body.groupName) {
          return errorResponse(400, 'Username and groupName are required', corsHeaders);
        }
        return await addUserToGroup(body.username, body.groupName, corsHeaders);

      case 'removeFromGroup':
        if (!body.username || !body.groupName) {
          return errorResponse(400, 'Username and groupName are required', corsHeaders);
        }
        return await removeUserFromGroup(body.username, body.groupName, corsHeaders);

      case 'getUserGroups':
        if (!body.username) {
          return errorResponse(400, 'Username is required', corsHeaders);
        }
        return await getUserGroups(body.username, corsHeaders);

      case 'resetPassword':
        if (!body.username || !body.newPassword) {
          return errorResponse(400, 'Username and newPassword are required', corsHeaders);
        }
        return await resetUserPassword(body.username, body.newPassword, corsHeaders);

      default:
        return errorResponse(400, 'Invalid action', corsHeaders);
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, (error as Error).message, corsHeaders);
  }
};

async function listUsers(headers: Record<string, string>): Promise<LambdaResponse> {
  const command = new ListUsersCommand({
    UserPoolId: USER_POOL_ID,
    Limit: 60,
  });

  const response = await cognitoClient.send(command);

  // Obtener grupos para cada usuario
  const usersWithGroups = await Promise.all(
    (response.Users || []).map(async (user: UserType) => {
      const groupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: user.Username!,
      });
      const groupsResponse = await cognitoClient.send(groupsCommand);

      return {
        username: user.Username,
        email: user.Attributes?.find((attr: AttributeType) => attr.Name === 'email')?.Value,
        preferredUsername: user.Attributes?.find((attr: AttributeType) => attr.Name === 'preferred_username')?.Value,
        name: user.Attributes?.find((attr: AttributeType) => attr.Name === 'name')?.Value,
        status: user.UserStatus,
        enabled: user.Enabled,
        createdAt: user.UserCreateDate?.toISOString(),
        groups: groupsResponse.Groups?.map((g: GroupType) => g.GroupName) || [],
      };
    })
  );

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ users: usersWithGroups }),
  };
}

async function createUser(
  email: string,
  username: string,
  temporaryPassword?: string,
  headers?: Record<string, string>
): Promise<LambdaResponse> {
  // Generar contraseña temporal si no se proporciona
  const generatedPassword = temporaryPassword || generateTemporaryPassword();

  // En Cognito configurado con email, el Username debe ser el email
  // Guardamos el nombre de usuario deseado en preferred_username
  const command = new AdminCreateUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: email, // Cognito requiere email como username
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
      { Name: 'preferred_username', Value: username }, // Nombre de usuario visible
      { Name: 'name', Value: username }, // Nombre completo
    ],
    TemporaryPassword: generatedPassword,
    // Suprimir email ya que en sandbox no funciona - el admin compartirá las credenciales
    MessageAction: 'SUPPRESS',
  });

  const response = await cognitoClient.send(command);

  // Agregar al grupo 'user' por defecto - usar email como identificador
  await addUserToGroupInternal(email, 'user');

  // Registrar en auditoría
  await createAuditLog({
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: email,
    userId: 'system',
    userEmail: email,
    details: { username, email, createdBy: 'admin' },
  });

  return {
    statusCode: 200,
    headers: headers || {},
    body: JSON.stringify({
      message: 'User created successfully',
      user: {
        username: response.User?.Username,
        preferredUsername: username,
        email: email,
        status: response.User?.UserStatus,
        // Devolver la contraseña temporal al admin para que la comparta
        temporaryPassword: generatedPassword,
      },
    }),
  };
}

// Función para generar contraseña temporal segura
function generateTemporaryPassword(): string {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const special = '!@#$%^&*';

  let password = '';

  // Asegurar al menos uno de cada tipo
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Completar hasta 12 caracteres
  const allChars = lowercase + uppercase + numbers + special;
  for (let i = 0; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Mezclar los caracteres
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function deleteUser(
  username: string,
  headers: Record<string, string>
): Promise<LambdaResponse> {
  const command = new AdminDeleteUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  await cognitoClient.send(command);

  // Registrar en auditoría
  await createAuditLog({
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: username,
    userId: 'system',
    userEmail: username,
    details: { deletedUser: username },
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'User deleted successfully' }),
  };
}

async function addUserToGroupInternal(username: string, groupName: string): Promise<void> {
  const command = new AdminAddUserToGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  });
  await cognitoClient.send(command);
}

async function addUserToGroup(
  username: string,
  groupName: string,
  headers: Record<string, string>
): Promise<LambdaResponse> {
  await addUserToGroupInternal(username, groupName);

  // Registrar en auditoría
  await createAuditLog({
    action: 'ROLE_ASSIGNED',
    entityType: 'User',
    entityId: username,
    userId: 'system',
    userEmail: username,
    details: { user: username, role: groupName, action: 'added' },
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: `User added to group ${groupName}` }),
  };
}

async function removeUserFromGroup(
  username: string,
  groupName: string,
  headers: Record<string, string>
): Promise<LambdaResponse> {
  const command = new AdminRemoveUserFromGroupCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    GroupName: groupName,
  });

  await cognitoClient.send(command);

  // Registrar en auditoría
  await createAuditLog({
    action: 'ROLE_REMOVED',
    entityType: 'User',
    entityId: username,
    userId: 'system',
    userEmail: username,
    details: { user: username, role: groupName, action: 'removed' },
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: `User removed from group ${groupName}` }),
  };
}

async function getUserGroups(
  username: string,
  headers: Record<string, string>
): Promise<LambdaResponse> {
  const command = new AdminListGroupsForUserCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
  });

  const response = await cognitoClient.send(command);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      groups: response.Groups?.map((g: GroupType) => g.GroupName) || [],
    }),
  };
}

async function resetUserPassword(
  username: string,
  newPassword: string,
  headers: Record<string, string>
): Promise<LambdaResponse> {
  const command = new AdminSetUserPasswordCommand({
    UserPoolId: USER_POOL_ID,
    Username: username,
    Password: newPassword,
    Permanent: true, // La contraseña es permanente, no requiere cambio
  });

  await cognitoClient.send(command);

  // Registrar en auditoría
  await createAuditLog({
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: username,
    userId: 'system',
    userEmail: username,
    details: { user: username },
  });

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Password reset successfully' }),
  };
}

function errorResponse(
  statusCode: number,
  message: string,
  headers: Record<string, string>
): LambdaResponse {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ error: message }),
  };
}

// Función para crear log de auditoría
async function createAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  details: Record<string, unknown>;
}): Promise<void> {
  if (!AUDIT_TABLE_NAME) {
    console.log('AUDIT_TABLE_NAME not configured, skipping audit log');
    return;
  }

  try {
    const log = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      details: data.details,
      createdAt: new Date().toISOString(),
    };

    await dynamoClient.send(new PutItemCommand({
      TableName: AUDIT_TABLE_NAME,
      Item: marshall(log, { removeUndefinedValues: true }),
    }));
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

