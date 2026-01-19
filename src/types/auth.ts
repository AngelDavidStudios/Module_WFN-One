// Tipos para el sistema de autenticación basado en roles

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface AuthUser {
    username: string;
    email?: string;
    roles: UserRole[];
}

export interface RolePermissions {
    // Permisos de usuarios
    canManageUsers: boolean;
    canAssignRoles: boolean;
    canAccessAdminPanel: boolean;
    canAccessSuperAdminPanel: boolean;
    // Permisos de organización
    canManageHierarchy: boolean;
    canViewOrganization: boolean;
    // Permisos de vacaciones
    canCreateVacationRequest: boolean;
    canApproveVacationRequests: boolean;
    canViewAllVacations: boolean;
    canViewAuditLogs: boolean;
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
};

// Verificar si un rol tiene acceso a una ruta
export const hasAccess = (userRoles: UserRole[], requiredRoles: UserRole[]): boolean => {
    // Si no se requieren roles específicos, todos tienen acceso
    if (requiredRoles.length === 0) return true;

    // super_admin siempre tiene acceso absoluto
    if (userRoles.includes('super_admin')) return true;

    // Verificar si el usuario tiene al menos uno de los roles requeridos
    return userRoles.some(role => requiredRoles.includes(role));
};