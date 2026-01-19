import React, { type ReactNode } from 'react';
import { useUserRole } from '../hooks/useUserRole';
import { type UserRole, hasAccess, rolePermissions, type RolePermissions } from '../types/auth';
import { AuthContext, type AuthContextType } from './AuthContextType';

// Re-exportar para mantener compatibilidad
export { AuthContext, type AuthContextType };

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const { roles, isLoading, error, hasRole, isAdmin, isSuperAdmin, username, email, userId } = useUserRole();

    const checkAccess = (requiredRoles: UserRole[]): boolean => {
        return hasAccess(roles, requiredRoles);
    };

    // Obtener permisos basados en el rol más alto
    const getPermissions = (): RolePermissions => {
        if (isSuperAdmin) return rolePermissions.super_admin;
        if (isAdmin) return rolePermissions.admin;
        return rolePermissions.user;
    };

    return (
        <AuthContext.Provider
            value={{
                roles,
                isLoading,
                error,
                hasRole,
                checkAccess,
                permissions: getPermissions(),
                isAdmin,
                isSuperAdmin,
                username,
                email,
                userId,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

