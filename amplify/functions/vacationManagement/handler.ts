import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  UpdateItemCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import type { Handler } from 'aws-lambda';
import type { AttributeValue } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({});
const VACATION_TABLE_NAME = process.env.VACATION_TABLE_NAME!;
const ORGANIZATION_TABLE_NAME = process.env.ORGANIZATION_TABLE_NAME!;
const AUDIT_TABLE_NAME = process.env.AUDIT_TABLE_NAME!;

type VacationType = 'VACATION' | 'PERSONAL_LEAVE' | 'SICK_LEAVE' | 'MATERNITY' | 'OTHER';
type VacationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface VacationRequest {
  id: string;
  requesterId: string;
  requesterEmail: string;
  requesterName: string;
  supervisorId: string;
  supervisorEmail: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  type: VacationType;
  reason?: string;
  status: VacationStatus;
  supervisorComment?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

interface OrganizationNode {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  supervisorId: string | null;
}

interface RequestBody {
  action:
    | 'createRequest'
    | 'approveRequest'
    | 'rejectRequest'
    | 'cancelRequest'
    | 'getRequest'
    | 'getMyRequests'
    | 'getPendingApprovals'
    | 'getAllRequests'
    | 'getAuditLogs';
  id?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  startDate?: string;
  endDate?: string;
  type?: VacationType;
  reason?: string;
  comment?: string;
  // Filtros para auditoría
  actionFilter?: string;
  entityType?: string;
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
      case 'createRequest':
        return await createRequest(body);
      case 'approveRequest':
        return await updateRequestStatus(body.id!, 'APPROVED', body.userId!, body.userEmail!, body.comment);
      case 'rejectRequest':
        return await updateRequestStatus(body.id!, 'REJECTED', body.userId!, body.userEmail!, body.comment);
      case 'cancelRequest':
        return await cancelRequest(body.id!, body.userId!);
      case 'getRequest':
        return await getRequest(body.id!);
      case 'getMyRequests':
        return await getMyRequests(body.userId!);
      case 'getPendingApprovals':
        return await getPendingApprovals(body.userId!);
      case 'getAllRequests':
        return await getAllRequests();
      case 'getAuditLogs':
        return await getAuditLogs(body.actionFilter, body.entityType);
      default:
        return errorResponse(400, 'Invalid action');
    }
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(500, (error as Error).message);
  }
};

async function createRequest(data: RequestBody): Promise<LambdaResponse> {
  if (!data.userId || !data.userEmail || !data.userName || !data.startDate || !data.endDate || !data.type) {
    return errorResponse(400, 'Missing required fields');
  }

  // Obtener el nodo de organización del usuario para saber su supervisor
  const userNode = await getOrganizationNodeByUserId(data.userId);
  if (!userNode) {
    return errorResponse(400, 'User is not part of the organization hierarchy. Contact your administrator.');
  }

  if (!userNode.supervisorId) {
    return errorResponse(400, 'User does not have a supervisor assigned. Contact your administrator.');
  }

  // Obtener info del supervisor
  const supervisorNode = await getOrganizationNode(userNode.supervisorId);
  if (!supervisorNode) {
    return errorResponse(400, 'Supervisor not found in organization');
  }

  // Calcular días
  const totalDays = calculateDays(data.startDate, data.endDate);

  const now = new Date().toISOString();
  const request: VacationRequest = {
    id: generateId(),
    requesterId: data.userId,
    requesterEmail: data.userEmail,
    requesterName: data.userName,
    supervisorId: supervisorNode.userId,
    supervisorEmail: supervisorNode.userEmail,
    startDate: data.startDate,
    endDate: data.endDate,
    totalDays,
    type: data.type,
    reason: data.reason,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  };

  await client.send(new PutItemCommand({
    TableName: VACATION_TABLE_NAME,
    Item: marshall(request, { removeUndefinedValues: true }),
  }));

  // Registrar en auditoría
  await createAuditLog({
    action: 'REQUEST_CREATED',
    entityType: 'VacationRequest',
    entityId: request.id,
    userId: data.userId,
    userEmail: data.userEmail,
    details: { type: data.type, totalDays, startDate: data.startDate, endDate: data.endDate },
  });

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Request created successfully', request }),
  };
}

async function updateRequestStatus(
  requestId: string,
  status: VacationStatus,
  approverId: string,
  approverEmail: string,
  comment?: string
): Promise<LambdaResponse> {
  const request = await getRequestInternal(requestId);
  if (!request) {
    return errorResponse(404, 'Request not found');
  }

  if (request.status !== 'PENDING') {
    return errorResponse(400, 'Request is not pending');
  }

  // Verificar que el que aprueba es el supervisor asignado
  if (request.supervisorId !== approverId) {
    return errorResponse(403, 'You are not authorized to approve/reject this request');
  }

  const now = new Date().toISOString();

  await client.send(new UpdateItemCommand({
    TableName: VACATION_TABLE_NAME,
    Key: marshall({ id: requestId }),
    UpdateExpression: 'SET #status = :status, supervisorComment = :comment, resolvedAt = :resolvedAt, updatedAt = :updatedAt',
    ExpressionAttributeValues: marshall({
      ':status': status,
      ':comment': comment || null,
      ':resolvedAt': now,
      ':updatedAt': now,
    }, { removeUndefinedValues: true }),
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  }));

  // Registrar en auditoría
  await createAuditLog({
    action: status === 'APPROVED' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
    entityType: 'VacationRequest',
    entityId: requestId,
    userId: approverId,
    userEmail: approverEmail,
    details: { requesterId: request.requesterId, comment },
  });

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: `Request ${status.toLowerCase()} successfully` }),
  };
}

async function cancelRequest(requestId: string, userId: string): Promise<LambdaResponse> {
  const request = await getRequestInternal(requestId);
  if (!request) {
    return errorResponse(404, 'Request not found');
  }

  if (request.requesterId !== userId) {
    return errorResponse(403, 'You can only cancel your own requests');
  }

  if (request.status !== 'PENDING') {
    return errorResponse(400, 'Only pending requests can be cancelled');
  }

  const now = new Date().toISOString();

  await client.send(new UpdateItemCommand({
    TableName: VACATION_TABLE_NAME,
    Key: marshall({ id: requestId }),
    UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
    ExpressionAttributeValues: marshall({
      ':status': 'CANCELLED',
      ':updatedAt': now,
    }),
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  }));

  // Registrar en auditoría
  await createAuditLog({
    action: 'REQUEST_CANCELLED',
    entityType: 'VacationRequest',
    entityId: requestId,
    userId: userId,
    userEmail: request.requesterEmail,
    details: {},
  });

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Request cancelled successfully' }),
  };
}

async function getRequest(requestId: string): Promise<LambdaResponse> {
  const request = await getRequestInternal(requestId);
  if (!request) {
    return errorResponse(404, 'Request not found');
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ request }),
  };
}

async function getMyRequests(userId: string): Promise<LambdaResponse> {
  const result = await client.send(new ScanCommand({
    TableName: VACATION_TABLE_NAME,
    FilterExpression: 'requesterId = :userId',
    ExpressionAttributeValues: marshall({ ':userId': userId }),
  }));

  const requests = (result.Items || [])
    .map((item: Record<string, AttributeValue>) => unmarshall(item) as VacationRequest)
    .sort((a: VacationRequest, b: VacationRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ requests }),
  };
}

async function getPendingApprovals(supervisorId: string): Promise<LambdaResponse> {
  const result = await client.send(new ScanCommand({
    TableName: VACATION_TABLE_NAME,
    FilterExpression: 'supervisorId = :supervisorId AND #status = :status',
    ExpressionAttributeValues: marshall({
      ':supervisorId': supervisorId,
      ':status': 'PENDING',
    }),
    ExpressionAttributeNames: {
      '#status': 'status',
    },
  }));

  const requests = (result.Items || [])
    .map((item: Record<string, AttributeValue>) => unmarshall(item) as VacationRequest)
    .sort((a: VacationRequest, b: VacationRequest) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ requests }),
  };
}

async function getAllRequests(): Promise<LambdaResponse> {
  const result = await client.send(new ScanCommand({
    TableName: VACATION_TABLE_NAME,
  }));

  const requests = (result.Items || [])
    .map((item: Record<string, AttributeValue>) => unmarshall(item) as VacationRequest)
    .sort((a: VacationRequest, b: VacationRequest) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ requests }),
  };
}

async function getAuditLogs(
  actionFilter?: string,
  entityType?: string
): Promise<LambdaResponse> {
  let filterExpression: string | undefined;
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};
  const filters: string[] = [];

  if (actionFilter) {
    filters.push('#action = :actionFilter');
    expressionValues[':actionFilter'] = actionFilter;
    expressionNames['#action'] = 'action';
  }

  if (entityType) {
    filters.push('entityType = :entityType');
    expressionValues[':entityType'] = entityType;
  }

  if (filters.length > 0) {
    filterExpression = filters.join(' AND ');
  }

  const scanParams: {
    TableName: string;
    FilterExpression?: string;
    ExpressionAttributeValues?: Record<string, AttributeValue>;
    ExpressionAttributeNames?: Record<string, string>;
  } = {
    TableName: AUDIT_TABLE_NAME,
  };

  if (filterExpression) {
    scanParams.FilterExpression = filterExpression;
    scanParams.ExpressionAttributeValues = marshall(expressionValues);
    if (Object.keys(expressionNames).length > 0) {
      scanParams.ExpressionAttributeNames = expressionNames;
    }
  }

  const result = await client.send(new ScanCommand(scanParams));

  interface AuditLogItem {
    createdAt: string;
  }

  const logs = (result.Items || [])
    .map((item: Record<string, AttributeValue>) => unmarshall(item) as AuditLogItem)
    .sort((a: AuditLogItem, b: AuditLogItem) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ logs }),
  };
}

// Funciones auxiliares
async function getRequestInternal(id: string): Promise<VacationRequest | null> {
  const result = await client.send(new GetItemCommand({
    TableName: VACATION_TABLE_NAME,
    Key: marshall({ id }),
  }));

  return result.Item ? unmarshall(result.Item) as VacationRequest : null;
}

async function getOrganizationNodeByUserId(userId: string): Promise<OrganizationNode | null> {
  const result = await client.send(new ScanCommand({
    TableName: ORGANIZATION_TABLE_NAME,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: marshall({ ':userId': userId }),
  }));

  return result.Items && result.Items.length > 0
    ? unmarshall(result.Items[0]) as OrganizationNode
    : null;
}

async function getOrganizationNode(id: string): Promise<OrganizationNode | null> {
  const result = await client.send(new GetItemCommand({
    TableName: ORGANIZATION_TABLE_NAME,
    Key: marshall({ id }),
  }));

  return result.Item ? unmarshall(result.Item) as OrganizationNode : null;
}

async function createAuditLog(data: {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  details: Record<string, unknown>;
}): Promise<void> {
  const log = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...data,
    createdAt: new Date().toISOString(),
  };

  await client.send(new PutItemCommand({
    TableName: AUDIT_TABLE_NAME,
    Item: marshall(log, { removeUndefinedValues: true }),
  }));
}

function calculateDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function generateId(): string {
  return `vac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function errorResponse(statusCode: number, message: string): LambdaResponse {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify({ error: message }),
  };
}
