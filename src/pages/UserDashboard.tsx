import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { vacationApi } from '../services/vacationApi';
import { organizationApi } from '../services/organizationApi';
import type { VacationRequest } from '../types/vacation';
import type { OrganizationNode } from '../types/organization';
import { VACATION_STATUS_LABELS, VACATION_STATUS_COLORS, VACATION_TYPE_LABELS } from '../types/vacation';
import {
    ClipboardDocumentListIcon,
    ClockIcon,
    CheckCircleIcon,
    SunIcon,
    DocumentPlusIcon,
    Cog6ToothIcon,
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalDaysUsed: number;
    pendingApprovals: number;
}

export const UserDashboard: React.FC = () => {
    const { userId, username, email, roles, isAdmin, isSuperAdmin } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalDaysUsed: 0,
        pendingApprovals: 0,
    });
    const [recentRequests, setRecentRequests] = useState<VacationRequest[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<VacationRequest[]>([]);
    const [supervisor, setSupervisor] = useState<OrganizationNode | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboardData = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);

        try {
            // Cargar mis solicitudes
            const myRequestsRes = await vacationApi.getMyRequests(userId);

            if (myRequestsRes.data) {
                const requests = myRequestsRes.data.requests;
                setRecentRequests(requests.slice(0, 5));

                const approved = requests.filter(r => r.status === 'APPROVED');
                const totalDays = approved.reduce((sum, r) => sum + r.totalDays, 0);

                setStats(prev => ({
                    ...prev,
                    totalRequests: requests.length,
                    pendingRequests: requests.filter(r => r.status === 'PENDING').length,
                    approvedRequests: approved.length,
                    rejectedRequests: requests.filter(r => r.status === 'REJECTED').length,
                    totalDaysUsed: totalDays,
                }));
            }

            // Si es admin, cargar aprobaciones pendientes
            if (isAdmin || isSuperAdmin) {
                const approvalsRes = await vacationApi.getPendingApprovals(userId);
                if (approvalsRes.data) {
                    setPendingApprovals(approvalsRes.data.requests.slice(0, 3));
                    setStats(prev => ({
                        ...prev,
                        pendingApprovals: approvalsRes.data?.requests.length || 0,
                    }));
                }
            }

            // Cargar información del supervisor
            const orgRes = await organizationApi.getNodeByUserId(userId);
            if (orgRes.data?.node?.supervisorId && orgRes.data.node.supervisorId !== 'ROOT') {
                const supervisorRes = await organizationApi.getNode(orgRes.data.node.supervisorId);
                if (supervisorRes.data?.node) {
                    setSupervisor(supervisorRes.data.node);
                }
            }
        } catch (error) {
            console.error('Error loading dashboard:', error);
        }

        setIsLoading(false);
    }, [userId, isAdmin, isSuperAdmin]);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)', color: '#212529' }}>
                Cargando dashboard...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', color: '#212529' }}>
            {/* Header */}
            <div style={{
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                borderRadius: '12px',
                color: '#fff',
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>
                    👋 ¡Hola, {username || email?.split('@')[0]}!
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                    Rol: <strong>{roles.join(', ') || 'Usuario'}</strong>
                    {supervisor && (
                        <span style={{ marginLeft: '16px' }}>
              | Supervisor: <strong>{supervisor.userName}</strong>
            </span>
                    )}
                </p>
            </div>

            {/* Estadísticas de vacaciones */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
            }}>
                <StatCard
                    title="Mis Solicitudes"
                    value={stats.totalRequests}
                    icon={<ClipboardDocumentListIcon style={{ width: '28px', height: '28px' }} />}
                    color="#3b82f6"
                />
                <StatCard
                    title="Pendientes"
                    value={stats.pendingRequests}
                    icon={<ClockIcon style={{ width: '28px', height: '28px' }} />}
                    color="#f59e0b"
                />
                <StatCard
                    title="Aprobadas"
                    value={stats.approvedRequests}
                    icon={<CheckCircleIcon style={{ width: '28px', height: '28px' }} />}
                    color="#10b981"
                />
                <StatCard
                    title="Días Usados"
                    value={stats.totalDaysUsed}
                    icon={<SunIcon style={{ width: '28px', height: '28px' }} />}
                    color="#8b5cf6"
                />
                {(isAdmin || isSuperAdmin) && (
                    <StatCard
                        title="Por Aprobar"
                        value={stats.pendingApprovals}
                        icon={<DocumentPlusIcon style={{ width: '28px', height: '28px' }} />}
                        color="#ef4444"
                        link="/approvals"
                    />
                )}
            </div>

            {/* Acciones rápidas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
            }}>
                <QuickAction
                    to="/vacations"
                    icon={<CalendarDaysIcon style={{ width: '32px', height: '32px' }} />}
                    label="Solicitar Vacaciones"
                    color="#10b981"
                />
                <QuickAction
                    to="/vacations"
                    icon={<ClipboardDocumentListIcon style={{ width: '32px', height: '32px' }} />}
                    label="Mis Solicitudes"
                    color="#3b82f6"
                />
                {(isAdmin || isSuperAdmin) && (
                    <QuickAction
                        to="/approvals"
                        icon={<CheckCircleIcon style={{ width: '32px', height: '32px' }} />}
                        label="Aprobar Solicitudes"
                        color="#f59e0b"
                    />
                )}
                <QuickAction
                    to="/profile"
                    icon={<Cog6ToothIcon style={{ width: '32px', height: '32px' }} />}
                    label="Mi Perfil"
                    color="#6b7280"
                />
            </div>

            {/* Contenido principal */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
            }}>
                {/* Mis solicitudes recientes */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>🏖️ Mis Solicitudes Recientes</h2>
                        <Link to="/vacations" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>
                            Ver todas →
                        </Link>
                    </div>

                    {recentRequests.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                            <p>No tienes solicitudes de vacaciones</p>
                            <Link
                                to="/vacations"
                                style={{
                                    display: 'inline-block',
                                    padding: '10px 20px',
                                    backgroundColor: '#27ae60',
                                    color: '#fff',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    marginTop: '12px',
                                }}
                            >
                                Crear Solicitud
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentRequests.map((request) => (
                                <div
                                    key={request.id}
                                    style={{
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${VACATION_STATUS_COLORS[request.status].text}`,
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#212529' }}>
                                                {VACATION_TYPE_LABELS[request.type]}
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                                <span style={{ marginLeft: '8px' }}>({request.totalDays} días)</span>
                                            </div>
                                        </div>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '12px',
                                            fontSize: '0.8rem',
                                            fontWeight: 'bold',
                                            backgroundColor: VACATION_STATUS_COLORS[request.status].bg,
                                            color: VACATION_STATUS_COLORS[request.status].text,
                                        }}>
                      {VACATION_STATUS_LABELS[request.status]}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Aprobaciones pendientes (solo para admin/supervisor) */}
                {(isAdmin || isSuperAdmin) && (
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>📝 Solicitudes por Aprobar</h2>
                            <Link to="/approvals" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>
                                Ver todas →
                            </Link>
                        </div>

                        {pendingApprovals.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                                <p>🎉 No tienes solicitudes pendientes</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {pendingApprovals.map((request) => (
                                    <div
                                        key={request.id}
                                        style={{
                                            padding: '12px',
                                            backgroundColor: '#fff3cd',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #f39c12',
                                        }}
                                    >
                                        <div style={{ fontWeight: 'bold', color: '#212529' }}>
                                            {request.requesterName}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {VACATION_TYPE_LABELS[request.type]} · {request.totalDays} días
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#856404' }}>
                                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Información del usuario */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    padding: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, marginBottom: '16px', color: '#212529' }}>
                        👤 Mi Información
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <InfoRow label="Email" value={email || '-'} />
                        <InfoRow label="Usuario" value={username || '-'} />
                        <InfoRow label="Roles" value={roles.join(', ') || 'Usuario'} />
                        {supervisor && (
                            <InfoRow label="Supervisor" value={`${supervisor.userName} (${supervisor.position})`} />
                        )}
                    </div>
                    <Link
                        to="/profile"
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '10px',
                            backgroundColor: '#f8f9fa',
                            color: '#3498db',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            marginTop: '16px',
                            fontWeight: 'bold',
                        }}
                    >
                        ⚙️ Editar Perfil
                    </Link>
                </div>
            </div>
        </div>
    );
};

// Componentes auxiliares
interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link }) => {
    const content = (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${color}`,
            transition: 'all 0.2s ease',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    backgroundColor: `${color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                }}>
                    {icon}
                </div>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#1f2937' }}>{value}</div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>{title}</div>
                </div>
            </div>
        </div>
    );

    return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
};

interface QuickActionProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    color: string;
}

const QuickAction: React.FC<QuickActionProps> = ({ to, icon, label, color }) => (
    <Link
        to={to}
        style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            backgroundColor: '#fff',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            textDecoration: 'none',
            border: '2px solid transparent',
            transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
        }}
    >
        <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: `${color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            marginBottom: '12px',
        }}>
            {icon}
        </div>
        <span style={{
            color: '#1f2937',
            fontWeight: '600',
            fontSize: '0.875rem',
            textAlign: 'center',
            lineHeight: '1.3',
        }}>
      {label}
    </span>
    </Link>
);

interface InfoRowProps {
    label: string;
    value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '6px',
    }}>
        <span style={{ color: '#666', fontWeight: 'bold' }}>{label}</span>
        <span style={{ color: '#212529' }}>{value}</span>
    </div>
);

