import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { auditApi } from '../../services/auditApi';
import {
    type AuditLog,
    type AuditAction,
    type AuditEntityType,
    AUDIT_ACTION_LABELS,
    AUDIT_ACTION_ICONS,
} from '../../types/audit';

export const AuditDashboard: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionFilter, setActionFilter] = useState<string>('');
    const [entityFilter, setEntityFilter] = useState<string>('');

    const loadLogs = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const response = await auditApi.getAuditLogs({
            action: actionFilter as AuditAction || undefined,
            entityType: entityFilter as AuditEntityType || undefined,
        });

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setLogs(response.data.logs);
        }

        setIsLoading(false);
    }, [actionFilter, entityFilter]);

    useEffect(() => {
        loadLogs();
    }, [loadLogs]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionColor = (action: AuditAction): string => {
        switch (action) {
            case 'REQUEST_APPROVED':
                return '#27ae60';
            case 'REQUEST_REJECTED':
                return '#e74c3c';
            case 'REQUEST_CANCELLED':
                return '#95a5a6';
            case 'REQUEST_CREATED':
                return '#3498db';
            case 'HIERARCHY_CREATED':
            case 'HIERARCHY_UPDATED':
                return '#9b59b6';
            case 'HIERARCHY_DELETED':
                return '#e74c3c';
            case 'USER_ASSIGNED':
                return '#f39c12';
            default:
                return '#666';
        }
    };

    if (!isSuperAdmin) {
        return (
            <div style={{ padding: '32px', textAlign: 'center' }}>
                <h1>⛔ Acceso Denegado</h1>
                <p>Solo el Super Admin puede acceder al registro de auditoría.</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>📋 Registro de Auditoría</h1>
                <p style={{ color: '#666' }}>
                    Visualiza todas las acciones realizadas en el sistema de vacaciones.
                </p>
            </div>

            {/* Filtros */}
            <div style={{
                display: 'flex',
                gap: '16px',
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Filtrar por acción
                    </label>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            minWidth: '200px',
                        }}
                    >
                        <option value="">Todas las acciones</option>
                        {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        Filtrar por tipo
                    </label>
                    <select
                        value={entityFilter}
                        onChange={(e) => setEntityFilter(e.target.value)}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #ddd',
                            minWidth: '200px',
                        }}
                    >
                        <option value="">Todos los tipos</option>
                        <option value="VacationRequest">Solicitudes de Vacaciones</option>
                        <option value="OrganizationNode">Árbol Organizacional</option>
                        <option value="User">Usuarios</option>
                    </select>
                </div>

                <button
                    onClick={() => {
                        setActionFilter('');
                        setEntityFilter('');
                    }}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#6c757d',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginTop: '20px',
                    }}
                >
                    🔄 Limpiar filtros
                </button>

                <div style={{ marginLeft: 'auto', marginTop: '20px', color: '#666' }}>
                    {logs.length} registro(s)
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '12px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    borderRadius: '8px',
                    marginBottom: '24px'
                }}>
                    ⚠️ {error}
                </div>
            )}

            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
                    Cargando registros de auditoría...
                </div>
            ) : logs.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '48px',
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    color: '#666'
                }}>
                    No hay registros de auditoría.
                </div>
            ) : (
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                            <th style={tableHeaderStyle}>Fecha/Hora</th>
                            <th style={tableHeaderStyle}>Acción</th>
                            <th style={tableHeaderStyle}>Tipo</th>
                            <th style={tableHeaderStyle}>Usuario</th>
                            <th style={tableHeaderStyle}>Detalles</th>
                        </tr>
                        </thead>
                        <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                <td style={tableCellStyle}>
                                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                        {formatDate(log.createdAt)}
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 12px',
                        backgroundColor: `${getActionColor(log.action)}15`,
                        color: getActionColor(log.action),
                        borderRadius: '16px',
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                    }}>
                      {AUDIT_ACTION_ICONS[log.action]} {AUDIT_ACTION_LABELS[log.action]}
                    </span>
                                </td>
                                <td style={tableCellStyle}>
                    <span style={{
                        padding: '4px 8px',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                    }}>
                      {log.entityType}
                    </span>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {log.userEmail}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', fontFamily: 'monospace' }}>
                                        {log.userId.substring(0, 20)}...
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                                    {log.details ? (
                                        <details style={{ fontSize: '0.85rem' }}>
                                            <summary style={{ cursor: 'pointer', color: '#3498db' }}>
                                                Ver detalles
                                            </summary>
                                            <pre style={{
                                                backgroundColor: '#f8f9fa',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                fontSize: '0.8rem',
                                                overflow: 'auto',
                                                maxWidth: '300px',
                                                marginTop: '8px',
                                            }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                                        </details>
                                    ) : (
                                        <span style={{ color: '#888', fontSize: '0.85rem' }}>-</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Estadísticas rápidas */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                marginTop: '32px',
            }}>
                <StatCard
                    title="Solicitudes Creadas"
                    count={logs.filter(l => l.action === 'REQUEST_CREATED').length}
                    icon="📝"
                    color="#3498db"
                />
                <StatCard
                    title="Solicitudes Aprobadas"
                    count={logs.filter(l => l.action === 'REQUEST_APPROVED').length}
                    icon="✅"
                    color="#27ae60"
                />
                <StatCard
                    title="Solicitudes Rechazadas"
                    count={logs.filter(l => l.action === 'REQUEST_REJECTED').length}
                    icon="❌"
                    color="#e74c3c"
                />
                <StatCard
                    title="Cambios en Jerarquía"
                    count={logs.filter(l => l.action.startsWith('HIERARCHY_')).length}
                    icon="🏢"
                    color="#9b59b6"
                />
            </div>
        </div>
    );
};

// Componente de tarjeta de estadísticas
interface StatCardProps {
    title: string;
    count: number;
    icon: string;
    color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, count, icon, color }) => (
    <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        borderLeft: `4px solid ${color}`,
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '2rem' }}>{icon}</span>
            <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color }}>{count}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>{title}</div>
            </div>
        </div>
    </div>
);

const tableHeaderStyle: React.CSSProperties = {
    padding: '16px 12px',
    textAlign: 'left',
    fontWeight: 'bold',
    color: '#495057',
};

const tableCellStyle: React.CSSProperties = {
    padding: '16px 12px',
    verticalAlign: 'top',
};
