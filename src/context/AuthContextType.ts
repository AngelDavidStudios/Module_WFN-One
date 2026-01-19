import { createContext } from 'react';
import type { UserRole, RolePermissions } from '../types/auth';

export interface AuthContextType {
    roles: UserRole[];
    isLoading: boolean;
    error: Error | null;
    hasRole: (role: UserRole) => boolean;
    checkAccess: (requiredRoles: UserRole[]) => boolean;
    permissions: RolePermissions;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    username: string | null;
    email: string | null;
    userId: string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
