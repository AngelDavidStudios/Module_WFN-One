// Tipos para el sistema de autorización basado en roles.
// Los roles WFN (super_admin/admin/user) se derivan de los grupos Cognito del
// Sistema C (Admins/Managers/Users) en `auth/roles.ts`.

export type UserRole = 'super_admin' | 'admin' | 'user'

export interface AuthUser {
  username: string
  email?: string
  roles: UserRole[]
}

export interface RolePermissions {
  // Permisos de usuarios
  canManageUsers: boolean
  canAssignRoles: boolean
  canAccessAdminPanel: boolean
  canAccessSuperAdminPanel: boolean
  // Permisos de organización
  canManageHierarchy: boolean
  canViewOrganization: boolean
  // Permisos de vacaciones
  canCreateVacationRequest: boolean
  canApproveVacationRequests: boolean
  canViewAllVacations: boolean
  canViewAuditLogs: boolean
}

// Permisos por rol
export const rolePermissions: Record<UserRole, RolePermissions> = {
  super_admin: {
    canManageUsers: true,
    canAssignRoles: true,
    canAccessAdminPanel: true,
    canAccessSuperAdminPanel: true,
    canManageHierarchy: true,
    canViewOrganization: true,
    canCreateVacationRequest: true,
    canApproveVacationRequests: true,
    canViewAllVacations: true,
    canViewAuditLogs: true,
  },
  admin: {
    canManageUsers: true,
    canAssignRoles: false,
    canAccessAdminPanel: true,
    canAccessSuperAdminPanel: false,
    canManageHierarchy: false,
    canViewOrganization: true,
    canCreateVacationRequest: true,
    canApproveVacationRequests: true,
    canViewAllVacations: false,
    canViewAuditLogs: false,
  },
  user: {
    canManageUsers: false,
    canAssignRoles: false,
    canAccessAdminPanel: false,
    canAccessSuperAdminPanel: false,
    canManageHierarchy: false,
    canViewOrganization: true,
    canCreateVacationRequest: true,
    canApproveVacationRequests: false,
    canViewAllVacations: false,
    canViewAuditLogs: false,
  },
}

// Verificar si un conjunto de roles tiene acceso a una ruta
export const hasAccess = (
  userRoles: UserRole[],
  requiredRoles: UserRole[],
): boolean => {
  if (requiredRoles.length === 0) return true
  // super_admin siempre tiene acceso absoluto
  if (userRoles.includes('super_admin')) return true
  return userRoles.some((role) => requiredRoles.includes(role))
}
