import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { vacationApi } from '../services/vacationApi';
import { organizationApi } from '../services/organizationApi';
import { userManagementApi } from '../services/userManagementApi';
import { auditApi } from '../services/auditApi';
import type { VacationRequest } from '../types/vacation';
import type { OrganizationNode } from '../types/organization';
import type { AuditLog } from '../types/audit';
import type { CognitoUser } from '../services/userManagementApi';
import { VACATION_STATUS_LABELS, VACATION_STATUS_COLORS } from '../types/vacation';
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_ICONS } from '../types/audit';

interface DashboardStats {
    totalUsers: number;
    totalOrganizationNodes: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    totalRequests: number;
}

export const SuperAdminDashboard: React.FC = () => {
    const { roles, username } = useAuth();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalOrganizationNodes: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        totalRequests: 0,
    });
    const [recentRequests, setRecentRequests] = useState<VacationRequest[]>([]);
    const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
    const [users, setUsers] = useState<CognitoUser[]>([]);
    const [orgNodes, setOrgNodes] = useState<OrganizationNode[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadDashboardData = useCallback(async () => {
        setIsLoading(true);

        try {
            const [usersRes, orgRes, vacationsRes, auditRes] = await Promise.all([
                userManagementApi.listUsers(),
                organizationApi.getTree(),
                vacationApi.getAllRequests(),
                auditApi.getAuditLogs(),
            ]);

            if (usersRes.data) {
                setUsers(usersRes.data.users);
            }

            if (orgRes.data) {
                setOrgNodes(orgRes.data.nodes);
            }

            if (vacationsRes.data) {
                const requests = vacationsRes.data.requests;
                setRecentRequests(requests.slice(0, 5));

                setStats(prev => ({
                    ...prev,
                    totalUsers: usersRes.data?.users.length || 0,
                    totalOrganizationNodes: orgRes.data?.nodes.length || 0,
                    totalRequests: requests.length,
                    pendingRequests: requests.filter(r => r.status === 'PENDING').length,
                    approvedRequests: requests.filter(r => r.status === 'APPROVED').length,
                    rejectedRequests: requests.filter(r => r.status === 'REJECTED').length,
                }));
            }

            if (auditRes.data) {
                setRecentLogs(auditRes.data.logs.slice(0, 5));
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 100px)',
                color: '#212529',
            }}>
                Cargando dashboard...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', color: '#212529' }}>
            {/* Header */}
            <div style={{
                marginBottom: '32px',
                padding: '24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: '#fff',
            }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px', color: '#fff' }}>
                    👑 Panel de Super Administrador
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.9)', margin: 0 }}>
                    Bienvenido, <strong>{username}</strong> • Rol: <strong>{roles.join(', ')}</strong>
                </p>
            </div>

            {/* Estadísticas principales */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
            }}>
                <StatCard title="Usuarios Totales" value={stats.totalUsers} icon="👥" color="#3498db" link="/users" />
                <StatCard title="En Organización" value={stats.totalOrganizationNodes} icon="🏢" color="#9b59b6" link="/organization" />
                <StatCard title="Pendientes" value={stats.pendingRequests} icon="⏳" color="#f39c12" link="/approvals" />
                <StatCard title="Aprobadas" value={stats.approvedRequests} icon="✅" color="#27ae60" />
                <StatCard title="Rechazadas" value={stats.rejectedRequests} icon="❌" color="#e74c3c" />
                <StatCard title="Total Solicitudes" value={stats.totalRequests} icon="📋" color="#17a2b8" link="/audit" />
            </div>

            {/* Accesos rápidos */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
            }}>
                <QuickAccessCard to="/users" icon="👥" title="Usuarios" color="#3498db" />
                <QuickAccessCard to="/organization" icon="🏢" title="Organización" color="#9b59b6" />
                <QuickAccessCard to="/approvals" icon="✅" title="Aprobaciones" color="#27ae60" />
                <QuickAccessCard to="/vacations" icon="🏖️" title="Vacaciones" color="#f39c12" />
                <QuickAccessCard to="/audit" icon="📋" title="Auditoría" color="#e74c3c" />
                <QuickAccessCard to="/profile" icon="⚙️" title="Perfil" color="#6c757d" />
            </div>

            {/* Contenido en grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
            }}>
                {/* Últimas solicitudes */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>🏖️ Últimas Solicitudes</h2>
                        <Link to="/audit" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>Ver todas →</Link>
                    </div>

                    {recentRequests.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No hay solicitudes</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentRequests.map((request) => (
                                <div key={request.id} style={{
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    borderLeft: `4px solid ${VACATION_STATUS_COLORS[request.status].text}`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontWeight: 'bold', color: '#212529' }}>{request.requesterName}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                                {new Date(request.startDate).toLocaleDateString()} ({request.totalDays} días)
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

                {/* Actividad reciente */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>📋 Actividad Reciente</h2>
                        <Link to="/audit" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>Ver todo →</Link>
                    </div>

                    {recentLogs.length === 0 ? (
                        <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No hay actividad</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentLogs.map((log) => (
                                <div key={log.id} style={{
                                    padding: '12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>{AUDIT_ACTION_ICONS[log.action] || '📝'}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 'bold', color: '#212529', fontSize: '0.9rem' }}>
                                            {AUDIT_ACTION_LABELS[log.action] || log.action}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                            {log.userEmail} · {formatDate(log.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Usuarios */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>👥 Usuarios</h2>
                        <Link to="/users" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>Gestionar →</Link>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {users.slice(0, 5).map((user) => (
                            <div key={user.username} style={{
                                padding: '10px 12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: '#212529' }}>
                                        {user.preferredUsername || user.name || user.email?.split('@')[0]}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.email}</div>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {user.groups.slice(0, 2).map(group => (
                                        <span key={group} style={{
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            backgroundColor: group === 'super_admin' ? '#f8d7da' : group === 'admin' ? '#fff3cd' : '#e3f2fd',
                                            color: group === 'super_admin' ? '#721c24' : group === 'admin' ? '#856404' : '#0c5460',
                                        }}>
                      {group}
                    </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Organización */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, color: '#212529' }}>🏢 Organización</h2>
                        <Link to="/organization" style={{ color: '#3498db', textDecoration: 'none', fontSize: '0.9rem' }}>Gestionar →</Link>
                    </div>

                    {orgNodes.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <p style={{ color: '#666', marginBottom: '16px' }}>Sin estructura definida</p>
                            <Link to="/organization" style={{
                                padding: '10px 20px',
                                backgroundColor: '#9b59b6',
                                color: '#fff',
                                borderRadius: '8px',
                                textDecoration: 'none',
                                fontWeight: 'bold',
                            }}>
                                Crear Estructura
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {orgNodes.slice(0, 5).map((node) => (
                                <div key={node.id} style={{
                                    padding: '10px 12px',
                                    backgroundColor: '#f8f9fa',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderLeft: `4px solid ${node.level === 0 ? '#9b59b6' : '#dee2e6'}`,
                                }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', color: '#212529' }}>{node.userName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{node.position}</div>
                                    </div>
                                    <span style={{
                                        padding: '2px 8px',
                                        backgroundColor: '#e9ecef',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        color: '#495057',
                                    }}>
                    {node.department}
                  </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente StatCard
interface StatCardProps {
    title: string;
    value: number;
    icon: string;
    color: string;
    link?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, link }) => {
    const content = (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${color}`,
            cursor: link ? 'pointer' : 'default',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '2rem' }}>{icon}</span>
                <div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color }}>{value}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{title}</div>
                </div>
            </div>
        </div>
    );

    return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content;
};

// Componente QuickAccessCard
interface QuickAccessCardProps {
    to: string;
    icon: string;
    title: string;
    color: string;
}

const QuickAccessCard: React.FC<QuickAccessCardProps> = ({ to, icon, title, color }) => (
    <Link to={to} style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textDecoration: 'none',
        border: `2px solid transparent`,
        transition: 'all 0.2s',
    }}
          onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.borderColor = color;
          }}
          onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'transparent';
          }}>
        <span style={{ fontSize: '2rem', marginBottom: '8px' }}>{icon}</span>
        <span style={{ color: '#212529', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>{title}</span>
    </Link>
);
