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
const BALANCE_TABLE_NAME = process.env.BALANCE_TABLE_NAME!;

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

interface VacationBalance {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  availableDays: number;
  year: number;
  lastUpdated: string;
  updatedBy: string;
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
      | 'getAuditLogs'
      | 'getBalance'
      | 'setBalance'
      | 'getAllBalances';
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
  // Balance
  totalDays?: number;
  adminUserId?: string;
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
      case 'getBalance':
        return await getBalance(body.userId!);
      case 'setBalance':
        return await setBalance(body);
      case 'getAllBalances':
        return await getAllBalances();
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

  // Verificar balance de vacaciones
  const currentYear = new Date().getFullYear();
  const balance = await getBalanceInternal(data.userId, currentYear);

  if (!balance) {
    return errorResponse(400, 'No tiene días de vacaciones asignados. Contacte al administrador.');
  }

  if (balance.availableDays < totalDays) {
    return errorResponse(400, `No tiene suficientes días disponibles. Disponibles: ${balance.availableDays}, Solicitados: ${totalDays}`);
  }

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

  // Actualizar balance - agregar días pendientes
  await updateBalancePendingDays(data.userId, currentYear, totalDays);

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
  const currentYear = new Date().getFullYear();

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

  // Actualizar balance según el resultado
  if (status === 'APPROVED') {
    // Mover de pendientes a usados
    await updateBalanceOnApproval(request.requesterId, currentYear, request.totalDays);
  } else if (status === 'REJECTED') {
    // Devolver días pendientes a disponibles
    await updateBalanceOnRejection(request.requesterId, currentYear, request.totalDays);
  }

  // Registrar en auditoría
  await createAuditLog({
    action: status === 'APPROVED' ? 'REQUEST_APPROVED' : 'REQUEST_REJECTED',
    entityType: 'VacationRequest',
    entityId: requestId,
    userId: approverId,
    userEmail: approverEmail,
    details: { requesterId: request.requesterId, comment, totalDays: request.totalDays },
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
  const currentYear = new Date().getFullYear();

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

  // Devolver días pendientes a disponibles
  await updateBalanceOnRejection(userId, currentYear, request.totalDays);

  // Registrar en auditoría
  await createAuditLog({
    action: 'REQUEST_CANCELLED',
    entityType: 'VacationRequest',
    entityId: requestId,
    userId: userId,
    userEmail: request.requesterEmail,
    details: { totalDays: request.totalDays },
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

// ==================== FUNCIONES DE BALANCE ====================

async function getBalance(userId: string): Promise<LambdaResponse> {
  const currentYear = new Date().getFullYear();
  const balance = await getBalanceInternal(userId, currentYear);

  if (!balance) {
    // Retornar un balance vacío si no existe
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        balance: {
          userId,
          totalDays: 0,
          usedDays: 0,
          pendingDays: 0,
          availableDays: 0,
          year: currentYear,
        },
      }),
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ balance }),
  };
}

async function setBalance(data: RequestBody): Promise<LambdaResponse> {
  if (!data.userId || !data.userEmail || !data.userName || data.totalDays === undefined || !data.adminUserId) {
    return errorResponse(400, 'Missing required fields: userId, userEmail, userName, totalDays, adminUserId');
  }

  const currentYear = new Date().getFullYear();
  const now = new Date().toISOString();

  // Verificar si ya existe un balance para este usuario y año
  const existingBalance = await getBalanceInternal(data.userId, currentYear);

  if (existingBalance) {
    // Actualizar balance existente
    const newAvailableDays = data.totalDays - existingBalance.usedDays - existingBalance.pendingDays;

    if (newAvailableDays < 0) {
      return errorResponse(400, `No se puede asignar ${data.totalDays} días. El usuario ya tiene ${existingBalance.usedDays} días usados y ${existingBalance.pendingDays} días pendientes.`);
    }

    await client.send(new UpdateItemCommand({
      TableName: BALANCE_TABLE_NAME,
      Key: marshall({ id: existingBalance.id }),
      UpdateExpression: 'SET totalDays = :totalDays, availableDays = :availableDays, lastUpdated = :lastUpdated, updatedBy = :updatedBy',
      ExpressionAttributeValues: marshall({
        ':totalDays': data.totalDays,
        ':availableDays': newAvailableDays,
        ':lastUpdated': now,
        ':updatedBy': data.adminUserId,
      }),
    }));

    // Auditoría
    await createAuditLog({
      action: 'BALANCE_UPDATED',
      entityType: 'VacationBalance',
      entityId: existingBalance.id,
      userId: data.adminUserId,
      userEmail: 'admin',
      details: {
        targetUserId: data.userId,
        previousTotal: existingBalance.totalDays,
        newTotal: data.totalDays,
      },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Balance updated successfully',
        balance: {
          ...existingBalance,
          totalDays: data.totalDays,
          availableDays: newAvailableDays,
          lastUpdated: now,
          updatedBy: data.adminUserId,
        },
      }),
    };
  } else {
    // Crear nuevo balance
    const balance: VacationBalance = {
      id: `bal_${data.userId}_${currentYear}`,
      userId: data.userId,
      userEmail: data.userEmail,
      userName: data.userName,
      totalDays: data.totalDays,
      usedDays: 0,
      pendingDays: 0,
      availableDays: data.totalDays,
      year: currentYear,
      lastUpdated: now,
      updatedBy: data.adminUserId,
    };

    await client.send(new PutItemCommand({
      TableName: BALANCE_TABLE_NAME,
      Item: marshall(balance),
    }));

    // Auditoría
    await createAuditLog({
      action: 'BALANCE_CREATED',
      entityType: 'VacationBalance',
      entityId: balance.id,
      userId: data.adminUserId,
      userEmail: 'admin',
      details: { targetUserId: data.userId, totalDays: data.totalDays },
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Balance created successfully', balance }),
    };
  }
}

async function getAllBalances(): Promise<LambdaResponse> {
  const currentYear = new Date().getFullYear();

  const result = await client.send(new ScanCommand({
    TableName: BALANCE_TABLE_NAME,
    FilterExpression: '#year = :year',
    ExpressionAttributeNames: { '#year': 'year' },
    ExpressionAttributeValues: marshall({ ':year': currentYear }),
  }));

  const balances = (result.Items || [])
      .map((item: Record<string, AttributeValue>) => unmarshall(item) as VacationBalance)
      .sort((a: VacationBalance, b: VacationBalance) => a.userName.localeCompare(b.userName));

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ balances }),
  };
}

// Función auxiliar para obtener balance interno
async function getBalanceInternal(userId: string, year: number): Promise<VacationBalance | null> {
  const result = await client.send(new ScanCommand({
    TableName: BALANCE_TABLE_NAME,
    FilterExpression: 'userId = :userId AND #year = :year',
    ExpressionAttributeNames: { '#year': 'year' },
    ExpressionAttributeValues: marshall({ ':userId': userId, ':year': year }),
  }));

  return result.Items && result.Items.length > 0
      ? unmarshall(result.Items[0]) as VacationBalance
      : null;
}

// Actualizar días pendientes al crear solicitud
async function updateBalancePendingDays(userId: string, year: number, days: number): Promise<void> {
  const balance = await getBalanceInternal(userId, year);
  if (!balance) return;

  const newPendingDays = balance.pendingDays + days;
  const newAvailableDays = balance.totalDays - balance.usedDays - newPendingDays;

  await client.send(new UpdateItemCommand({
    TableName: BALANCE_TABLE_NAME,
    Key: marshall({ id: balance.id }),
    UpdateExpression: 'SET pendingDays = :pendingDays, availableDays = :availableDays, lastUpdated = :lastUpdated',
    ExpressionAttributeValues: marshall({
      ':pendingDays': newPendingDays,
      ':availableDays': newAvailableDays,
      ':lastUpdated': new Date().toISOString(),
    }),
  }));
}

// Actualizar balance cuando se aprueba (mover de pendientes a usados)
async function updateBalanceOnApproval(userId: string, year: number, days: number): Promise<void> {
  const balance = await getBalanceInternal(userId, year);
  if (!balance) return;

  const newPendingDays = Math.max(0, balance.pendingDays - days);
  const newUsedDays = balance.usedDays + days;

  await client.send(new UpdateItemCommand({
    TableName: BALANCE_TABLE_NAME,
    Key: marshall({ id: balance.id }),
    UpdateExpression: 'SET pendingDays = :pendingDays, usedDays = :usedDays, lastUpdated = :lastUpdated',
    ExpressionAttributeValues: marshall({
      ':pendingDays': newPendingDays,
      ':usedDays': newUsedDays,
      ':lastUpdated': new Date().toISOString(),
    }),
  }));
}

// Actualizar balance cuando se rechaza o cancela (devolver pendientes a disponibles)
async function updateBalanceOnRejection(userId: string, year: number, days: number): Promise<void> {
  const balance = await getBalanceInternal(userId, year);
  if (!balance) return;

  const newPendingDays = Math.max(0, balance.pendingDays - days);
  const newAvailableDays = balance.totalDays - balance.usedDays - newPendingDays;

  await client.send(new UpdateItemCommand({
    TableName: BALANCE_TABLE_NAME,
    Key: marshall({ id: balance.id }),
    UpdateExpression: 'SET pendingDays = :pendingDays, availableDays = :availableDays, lastUpdated = :lastUpdated',
    ExpressionAttributeValues: marshall({
      ':pendingDays': newPendingDays,
      ':availableDays': newAvailableDays,
      ':lastUpdated': new Date().toISOString(),
    }),
  }));
}

// ==================== FIN FUNCIONES DE BALANCE ====================

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
