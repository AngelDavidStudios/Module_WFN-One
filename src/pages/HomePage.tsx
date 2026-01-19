import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getProfilePictureUrl } from '../services/profilePictureService';
import { UserAvatar } from '../components/ui';
import {
    ShieldCheckIcon,
    CheckCircleIcon,
    XCircleIcon,
} from '@heroicons/react/24/outline';

export const HomePage: React.FC = () => {
    const { roles, isAdmin, isSuperAdmin, permissions, username, email, userId } = useAuth();
    const displayName = username || email?.split('@')[0] || 'Usuario';
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    // Cargar foto de perfil
    useEffect(() => {
        const loadProfilePicture = async () => {
            if (userId) {
                const url = await getProfilePictureUrl(userId);
                if (url) {
                    setProfilePicture(url);
                }
            }
        };
        loadProfilePicture();
    }, [userId]);

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header de bienvenida */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '32px',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
            }}>
                {/* Foto de perfil */}
                <UserAvatar
                    name={displayName}
                    photoUrl={profilePicture}
                    size="xl"
                    showBorder={true}
                />

                <div>
                    <h1 style={{
                        fontSize: '2rem',
                        marginBottom: '8px',
                        fontWeight: '700',
                        margin: 0,
                    }}>
                        ¡Bienvenido, {displayName}!
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        opacity: 0.9,
                        margin: '8px 0 0 0',
                    }}>
                        Sistema de Gestión WFN One
                    </p>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
            }}>
                {/* Tarjeta de información del usuario */}
                <div style={{
                    padding: '24px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <UserAvatar
                            name={displayName}
                            photoUrl={profilePicture}
                            size="lg"
                            showBorder={true}
                        />
                        <div>
                            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem' }}>Tu Perfil</h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>{email}</p>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '8px',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Roles asignados</span>
                            <span style={{
                                color: '#1f2937',
                                fontWeight: '600',
                                fontSize: '0.9rem',
                            }}>
                {roles.length > 0 ? roles.join(', ') : 'Sin roles'}
              </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nivel de acceso</span>
                            <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: isSuperAdmin ? '#fef2f2' : isAdmin ? '#fffbeb' : '#f0fdf4',
                                color: isSuperAdmin ? '#dc2626' : isAdmin ? '#d97706' : '#16a34a',
                            }}>
                {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Administrador' : 'Usuario'}
              </span>
                        </div>
                    </div>
                </div>

                {/* Tarjeta de permisos */}
                <div style={{
                    padding: '24px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ShieldCheckIcon style={{ width: '28px', height: '28px', color: '#fff' }} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem' }}>Tus Permisos</h3>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.85rem' }}>Accesos del sistema</p>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                    }}>
                        <PermissionItem
                            label="Gestionar usuarios"
                            hasPermission={permissions.canManageUsers}
                        />
                        <PermissionItem
                            label="Asignar roles"
                            hasPermission={permissions.canAssignRoles}
                        />
                        <PermissionItem
                            label="Panel de administración"
                            hasPermission={permissions.canAccessAdminPanel}
                        />
                        <PermissionItem
                            label="Panel de super admin"
                            hasPermission={permissions.canAccessSuperAdminPanel}
                        />
                        <PermissionItem
                            label="Crear solicitudes de vacaciones"
                            hasPermission={permissions.canCreateVacationRequest}
                        />
                        <PermissionItem
                            label="Aprobar vacaciones"
                            hasPermission={permissions.canApproveVacationRequests}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente auxiliar para mostrar permisos
const PermissionItem: React.FC<{ label: string; hasPermission: boolean }> = ({ label, hasPermission }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 12px',
        backgroundColor: hasPermission ? '#f0fdf4' : '#fef2f2',
        borderRadius: '8px',
        border: `1px solid ${hasPermission ? '#bbf7d0' : '#fecaca'}`,
    }}>
        {hasPermission ? (
            <CheckCircleIcon style={{ width: '18px', height: '18px', color: '#16a34a' }} />
        ) : (
            <XCircleIcon style={{ width: '18px', height: '18px', color: '#dc2626' }} />
        )}
        <span style={{
            color: hasPermission ? '#166534' : '#991b1b',
            fontSize: '0.85rem',
            fontWeight: '500',
        }}>
      {label}
    </span>
    </div>
);
