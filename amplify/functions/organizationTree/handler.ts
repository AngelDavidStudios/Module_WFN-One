import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { Handler } from 'aws-lambda';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});
const TABLE_NAME = process.env.ORGANIZATION_TABLE_NAME!;

interface OrganizationNode {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  supervisorId: string; // 'ROOT' para nodos raíz, ID del supervisor para otros
  position: string;
  department: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

interface RequestBody {
  action:
    | 'createNode'
    | 'updateNode'
    | 'deleteNode'
    | 'getNode'
    | 'getTree'
    | 'getNodeByUserId'
    | 'getSubordinates'
    | 'assignSupervisor';
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  supervisorId?: string;
  position?: string;
  department?: string;
}

interface LambdaEvent {
  body?: string;
  requestContext?: {
    http?: {
      method: string;
    };
  };
}

interface LambdaResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Content-Type': 'application/json',
};

export const handler: Handler<LambdaEvent, LambdaResponse> = async (event) => {
  const httpMethod = event.requestContext?.http?.method || 'POST';

  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body: RequestBody = JSON.parse(event.body || '{}');

    switch (body.action) {
      case 'createNode':
        return await createNode(body);
      case 'updateNode':
        return await updateNode(body);
      case 'deleteNode':
        return await deleteNode(body.id!);
      case 'getNode':
        return await getNode(body.id!);
      case 'getTree':
        return await getTree();
      case 'getNodeByUserId':
        return await getNodeByUserId(body.userId!);
      case 'getSubordinates':
        return await getSubordinates(body.id!);
      case 'assignSupervisor':
        return await assignSupervisor(body.id!, body.supervisorId!);
      default:
        return errorResponse(400, 'Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, (error as Error).message);
  }
};

async function createNode(data: RequestBody): Promise<LambdaResponse> {
  if (!data.userId || !data.userEmail || !data.userName || !data.position || !data.department) {
    return errorResponse(400, 'Missing required fields');
  }

  // Verificar si ya existe un nodo para este usuario
  const existingNode = await getNodeByUserIdInternal(data.userId);
  if (existingNode) {
    return errorResponse(400, 'User already has an organization node');
  }

  // Calcular nivel basado en el supervisor
  let level = 0;
  if (data.supervisorId) {
    const supervisor = await getNodeInternal(data.supervisorId);
    if (!supervisor) {
      return errorResponse(400, 'Supervisor not found');
    }
    level = supervisor.level + 1;
  }

  const now = new Date().toISOString();
  const node: OrganizationNode = {
    id: generateId(),
    userId: data.userId,
    userEmail: data.userEmail,
    userName: data.userName,
    supervisorId: data.supervisorId || 'ROOT', // Usar 'ROOT' en lugar de null para índice DynamoDB
    position: data.position,
    department: data.department,
    level,
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutItemCommand({
    TableName: TABLE_NAME,
    Item: marshall(node),
  }));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Node created successfully', node }),
  };
}

async function updateNode(data: RequestBody): Promise<LambdaResponse> {
  if (!data.id) {
    return errorResponse(400, 'Node ID is required');
  }

  const existingNode = await getNodeInternal(data.id);
  if (!existingNode) {
    return errorResponse(404, 'Node not found');
  }

  const updates: string[] = [];
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};

  if (data.position) {
    updates.push('#position = :position');
    expressionValues[':position'] = data.position;
    expressionNames['#position'] = 'position';
  }

  if (data.department) {
    updates.push('#department = :department');
    expressionValues[':department'] = data.department;
    expressionNames['#department'] = 'department';
  }

  updates.push('#updatedAt = :updatedAt');
  expressionValues[':updatedAt'] = new Date().toISOString();
  expressionNames['#updatedAt'] = 'updatedAt';

  await client.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ id: data.id }),
    UpdateExpression: `SET ${updates.join(', ')}`,
    ExpressionAttributeValues: marshall(expressionValues),
    ExpressionAttributeNames: expressionNames,
  }));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Node updated successfully' }),
  };
}

async function deleteNode(id: string): Promise<LambdaResponse> {
  // Verificar si tiene subordinados
  const subordinates = await getSubordinatesInternal(id);
  if (subordinates.length > 0) {
    return errorResponse(400, 'Cannot delete node with subordinates. Reassign them first.');
  }

  await client.send(new DeleteItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ id }),
  }));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Node deleted successfully' }),
  };
}

async function getNode(id: string): Promise<LambdaResponse> {
  const node = await getNodeInternal(id);
  if (!node) {
    return errorResponse(404, 'Node not found');
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ node }),
  };
}

async function getTree(): Promise<LambdaResponse> {
  const result = await client.send(new ScanCommand({
    TableName: TABLE_NAME,
  }));

  const nodes = (result.Items || []).map((item: Record<string, AttributeValue>) => unmarshall(item)) as OrganizationNode[];

  // Construir árbol
  const tree = buildTree(nodes);

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ nodes, tree }),
  };
}

async function getNodeByUserId(userId: string): Promise<LambdaResponse> {
  const node = await getNodeByUserIdInternal(userId);
  if (!node) {
    return errorResponse(404, 'Node not found for user');
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ node }),
  };
}

async function getSubordinates(nodeId: string): Promise<LambdaResponse> {
  const subordinates = await getSubordinatesInternal(nodeId);

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ subordinates }),
  };
}

async function assignSupervisor(nodeId: string, supervisorId: string): Promise<LambdaResponse> {
  // Verificar que no se cree un ciclo
  if (nodeId === supervisorId) {
    return errorResponse(400, 'Cannot assign self as supervisor');
  }

  const supervisor = await getNodeInternal(supervisorId);
  if (!supervisor) {
    return errorResponse(404, 'Supervisor not found');
  }

  // Verificar ciclos - el supervisor no puede ser descendiente del nodo
  const isDescendant = await checkIfDescendant(supervisorId, nodeId);
  if (isDescendant) {
    return errorResponse(400, 'Cannot create circular hierarchy');
  }

  const newLevel = supervisor.level + 1;

  await client.send(new UpdateItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ id: nodeId }),
    UpdateExpression: 'SET supervisorId = :supervisorId, #level = :level, updatedAt = :updatedAt',
    ExpressionAttributeValues: marshall({
      ':supervisorId': supervisorId,
      ':level': newLevel,
      ':updatedAt': new Date().toISOString(),
    }),
    ExpressionAttributeNames: {
      '#level': 'level',
    },
  }));

  // Actualizar niveles de subordinados recursivamente
  await updateSubordinateLevels(nodeId, newLevel);

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Supervisor assigned successfully' }),
  };
}

// Funciones auxiliares internas
async function getNodeInternal(id: string): Promise<OrganizationNode | null> {
  const result = await client.send(new GetItemCommand({
    TableName: TABLE_NAME,
    Key: marshall({ id }),
  }));

  return result.Item ? unmarshall(result.Item) as OrganizationNode : null;
}

async function getNodeByUserIdInternal(userId: string): Promise<OrganizationNode | null> {
  const result = await client.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: marshall({ ':userId': userId }),
  }));

  return result.Items && result.Items.length > 0
    ? unmarshall(result.Items[0]) as OrganizationNode
    : null;
}

async function getSubordinatesInternal(supervisorId: string): Promise<OrganizationNode[]> {
  const result = await client.send(new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: 'supervisorId = :supervisorId',
    ExpressionAttributeValues: marshall({ ':supervisorId': supervisorId }),
  }));

  return (result.Items || []).map((item: Record<string, AttributeValue>) => unmarshall(item)) as OrganizationNode[];
}

async function checkIfDescendant(nodeId: string, potentialAncestorId: string): Promise<boolean> {
  const subordinates = await getSubordinatesInternal(potentialAncestorId);

  for (const sub of subordinates) {
    if (sub.id === nodeId) return true;
    const isDescendant = await checkIfDescendant(nodeId, sub.id);
    if (isDescendant) return true;
  }

  return false;
}

async function updateSubordinateLevels(parentId: string, parentLevel: number): Promise<void> {
  const subordinates = await getSubordinatesInternal(parentId);

  for (const sub of subordinates) {
    const newLevel = parentLevel + 1;
    await client.send(new UpdateItemCommand({
      TableName: TABLE_NAME,
      Key: marshall({ id: sub.id }),
      UpdateExpression: 'SET #level = :level, updatedAt = :updatedAt',
      ExpressionAttributeValues: marshall({
        ':level': newLevel,
        ':updatedAt': new Date().toISOString(),
      }),
      ExpressionAttributeNames: {
        '#level': 'level',
      },
    }));

    // Recursivamente actualizar subordinados
    await updateSubordinateLevels(sub.id, newLevel);
  }
}

function buildTree(nodes: OrganizationNode[]): OrganizationNode[] {
  const nodeMap = new Map<string, OrganizationNode & { children: OrganizationNode[] }>();
  const roots: (OrganizationNode & { children: OrganizationNode[] })[] = [];

  // Crear mapa con children vacíos
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Construir relaciones - 'ROOT' indica nodo raíz
  nodes.forEach(node => {
    const nodeWithChildren = nodeMap.get(node.id)!;
    if (node.supervisorId && node.supervisorId !== 'ROOT' && nodeMap.has(node.supervisorId)) {
      nodeMap.get(node.supervisorId)!.children.push(nodeWithChildren);
    } else {
      roots.push(nodeWithChildren);
    }
  });

  return roots;
}

function generateId(): string {
  return `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function errorResponse(statusCode: number, message: string): LambdaResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error: message }),
  };
}
