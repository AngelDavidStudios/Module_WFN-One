import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { type UserRole } from '../types/auth';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRoles?: UserRole[];
    redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles = [],
  redirectTo = '/unauthorized',
}) => {
    const { checkAccess, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem'
            }}>
                Verificando permisos...
            </div>
        );
    }

    if (!checkAccess(requiredRoles)) {
        return <Navigate to={redirectTo} state={{ from: location }} replace />;
    }

    return <>{children}</>;
};