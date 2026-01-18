import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { userManagement } from './functions/userManagement/resource';
import { organizationTree } from './functions/organizationTree/resource';
import { vacationManagement } from './functions/vacationManagement/resource';
import { Policy, PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { FunctionUrlAuthType } from 'aws-cdk-lib/aws-lambda';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  storage,
  userManagement,
  organizationTree,
  vacationManagement,
});


// ========== Cognito Managed Login Domain ==========
// El dominio 'ad-studios' ya fue creado manualmente en la consola de AWS Cognito
const cognitoDomainUrl = 'https://ad-studios.auth.us-east-1.amazoncognito.com';

// Configurar el cliente para OAuth con Managed Login
const cfnUserPoolClient = backend.auth.resources.cfnResources.cfnUserPoolClient;

// Configurar las URLs de callback y logout para el Managed Login
cfnUserPoolClient.callbackUrLs = [
  'http://localhost:5173/',
  'http://localhost:5173/dashboard',
];

cfnUserPoolClient.logoutUrLs = [
  'http://localhost:5173/',
];

// Habilitar OAuth para el cliente
cfnUserPoolClient.allowedOAuthFlows = ['code'];
cfnUserPoolClient.allowedOAuthScopes = ['email', 'openid', 'profile'];
cfnUserPoolClient.allowedOAuthFlowsUserPoolClient = true;
cfnUserPoolClient.supportedIdentityProviders = ['COGNITO'];

// Modificar el output de auth para incluir el dominio OAuth
// Esto se hace a través de un override en los cfnResources
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;

// Agregar dominio al output manualmente (se agregará en custom)
// El dominio ya existe en Cognito, solo lo referenciamos

// Obtener el User Pool ID
const userPoolId = backend.auth.resources.userPool.userPoolId;

// Obtener nombres de las tablas de DynamoDB
const organizationTableName = backend.data.resources.tables['OrganizationNode'].tableName;
const vacationTableName = backend.data.resources.tables['VacationRequest'].tableName;
const auditTableName = backend.data.resources.tables['AuditLog'].tableName;

// ========== Configurar userManagement ==========
backend.userManagement.addEnvironment('USER_POOL_ID', userPoolId);
backend.userManagement.addEnvironment('AUDIT_TABLE_NAME', auditTableName);

const cognitoPolicy = new Policy(
  backend.userManagement.resources.lambda.stack,
  'CognitoAdminPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'cognito-idp:ListUsers',
          'cognito-idp:AdminCreateUser',
          'cognito-idp:AdminDeleteUser',
          'cognito-idp:AdminAddUserToGroup',
          'cognito-idp:AdminRemoveUserFromGroup',
          'cognito-idp:AdminGetUser',
          'cognito-idp:AdminListGroupsForUser',
          'cognito-idp:AdminSetUserPassword',
        ],
        resources: [backend.auth.resources.userPool.userPoolArn],
      }),
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
        ],
        resources: [
          backend.data.resources.tables['AuditLog'].tableArn,
        ],
      }),
    ],
  }
);

backend.userManagement.resources.lambda.role?.attachInlinePolicy(cognitoPolicy);

const userManagementUrl = backend.userManagement.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: false,
  },
});

// ========== Configurar organizationTree ==========
backend.organizationTree.addEnvironment('ORGANIZATION_TABLE_NAME', organizationTableName);

// Permisos de DynamoDB para organizationTree
const organizationDynamoPolicy = new Policy(
  backend.organizationTree.resources.lambda.stack,
  'OrganizationDynamoPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query',
        ],
        resources: [
          backend.data.resources.tables['OrganizationNode'].tableArn,
          `${backend.data.resources.tables['OrganizationNode'].tableArn}/index/*`,
        ],
      }),
    ],
  }
);

backend.organizationTree.resources.lambda.role?.attachInlinePolicy(organizationDynamoPolicy);

const organizationTreeUrl = backend.organizationTree.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: false,
  },
});

// ========== Configurar vacationManagement ==========
backend.vacationManagement.addEnvironment('VACATION_TABLE_NAME', vacationTableName);
backend.vacationManagement.addEnvironment('ORGANIZATION_TABLE_NAME', organizationTableName);
backend.vacationManagement.addEnvironment('AUDIT_TABLE_NAME', auditTableName);

// Permisos de DynamoDB para vacationManagement
const vacationDynamoPolicy = new Policy(
  backend.vacationManagement.resources.lambda.stack,
  'VacationDynamoPolicy',
  {
    statements: [
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'dynamodb:GetItem',
          'dynamodb:PutItem',
          'dynamodb:UpdateItem',
          'dynamodb:DeleteItem',
          'dynamodb:Scan',
          'dynamodb:Query',
        ],
        resources: [
          backend.data.resources.tables['VacationRequest'].tableArn,
          `${backend.data.resources.tables['VacationRequest'].tableArn}/index/*`,
          backend.data.resources.tables['OrganizationNode'].tableArn,
          `${backend.data.resources.tables['OrganizationNode'].tableArn}/index/*`,
          backend.data.resources.tables['AuditLog'].tableArn,
          `${backend.data.resources.tables['AuditLog'].tableArn}/index/*`,
        ],
      }),
    ],
  }
);

backend.vacationManagement.resources.lambda.role?.attachInlinePolicy(vacationDynamoPolicy);

const vacationManagementUrl = backend.vacationManagement.resources.lambda.addFunctionUrl({
  authType: FunctionUrlAuthType.NONE,
  cors: {
    allowedOrigins: ['*'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    allowCredentials: false,
  },
});

// ========== Exportar URLs como outputs ==========
backend.addOutput({
  custom: {
    userManagementApiUrl: userManagementUrl.url,
    organizationTreeApiUrl: organizationTreeUrl.url,
    vacationManagementApiUrl: vacationManagementUrl.url,
    cognitoDomain: cognitoDomainUrl,
  },
});

