// Tipos para el sistema de auditoría

export type AuditAction =
  | 'REQUEST_CREATED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'REQUEST_CANCELLED'
  | 'HIERARCHY_CREATED'
  | 'HIERARCHY_UPDATED'
  | 'HIERARCHY_DELETED'
  | 'USER_ASSIGNED'
  | 'USER_CREATED'
  | 'USER_DELETED'
  | 'ROLE_ASSIGNED'
  | 'ROLE_REMOVED'
  | 'PASSWORD_RESET'

export type AuditEntityType = 'VacationRequest' | 'OrganizationNode' | 'User'

export interface AuditLog {
  id: string
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  userId: string
  userEmail: string
  details?: Record<string, unknown>
  createdAt: string
}

export interface AuditLogFilters {
  action?: AuditAction
  entityType?: AuditEntityType
  userId?: string
  startDate?: string
  endDate?: string
}

export interface CreateAuditLogInput {
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  details?: Record<string, unknown>
}

// Labels para mostrar en UI
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  REQUEST_CREATED: 'Solicitud creada',
  REQUEST_APPROVED: 'Solicitud aprobada',
  REQUEST_REJECTED: 'Solicitud rechazada',
  REQUEST_CANCELLED: 'Solicitud cancelada',
  HIERARCHY_CREATED: 'Nodo jerárquico creado',
  HIERARCHY_UPDATED: 'Nodo jerárquico actualizado',
  HIERARCHY_DELETED: 'Nodo jerárquico eliminado',
  USER_ASSIGNED: 'Usuario asignado',
  USER_CREATED: 'Usuario creado',
  USER_DELETED: 'Usuario eliminado',
  ROLE_ASSIGNED: 'Rol asignado',
  ROLE_REMOVED: 'Rol removido',
  PASSWORD_RESET: 'Contraseña reseteada',
}

export const AUDIT_ACTION_ICONS: Record<AuditAction, string> = {
  REQUEST_CREATED: '📝',
  REQUEST_APPROVED: '✅',
  REQUEST_REJECTED: '❌',
  REQUEST_CANCELLED: '🚫',
  HIERARCHY_CREATED: '➕',
  HIERARCHY_UPDATED: '✏️',
  HIERARCHY_DELETED: '🗑️',
  USER_ASSIGNED: '👤',
  USER_CREATED: '👤',
  USER_DELETED: '🗑️',
  ROLE_ASSIGNED: '🔑',
  ROLE_REMOVED: '🔓',
  PASSWORD_RESET: '🔄',
}
