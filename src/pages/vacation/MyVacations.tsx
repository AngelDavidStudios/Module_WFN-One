import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { vacationApi } from '../../services/vacationApi';
import {
    type VacationRequest,
    type VacationType,
    type VacationBalance,
    VACATION_TYPE_LABELS,
    VACATION_STATUS_LABELS,
    VACATION_STATUS_COLORS,
    calculateDays,
} from '../../types/vacation';
import {
    CalendarDaysIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const MyVacations: React.FC = () => {
    const { userId, email, username } = useAuth();
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [balance, setBalance] = useState<VacationBalance | null>(null);

    const [newRequest, setNewRequest] = useState({
        startDate: '',
        endDate: '',
        type: 'VACATION' as VacationType,
        reason: '',
    });

    const loadRequests = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        const response = await vacationApi.getMyRequests(userId);

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setRequests(response.data.requests);
        }

        // Cargar balance de vacaciones
        const balanceResponse = await vacationApi.getBalance(userId);
        if (balanceResponse.data?.balance) {
            setBalance(balanceResponse.data.balance);
        }

        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    // Calcular días solicitados en el formulario
    const requestedDays = newRequest.startDate && newRequest.endDate
        ? calculateDays(newRequest.startDate, newRequest.endDate)
        : 0;

    const canCreateRequest = balance && balance.availableDays >= requestedDays && requestedDays > 0;

    const handleCreateRequest = async () => {
        if (!newRequest.startDate || !newRequest.endDate) {
            alert('Por favor selecciona las fechas de inicio y fin');
            return;
        }

        if (new Date(newRequest.startDate) > new Date(newRequest.endDate)) {
            alert('La fecha de inicio no puede ser posterior a la fecha de fin');
            return;
        }

        if (!userId || !email || !username) {
            alert('Error de autenticación. Por favor inicia sesión nuevamente.');
            return;
        }

        // Validar balance
        if (!balance) {
            alert('No tienes días de vacaciones asignados. Contacta al administrador.');
            return;
        }

        if (balance.availableDays < requestedDays) {
            alert(`No tienes suficientes días disponibles. Disponibles: ${balance.availableDays}, Solicitados: ${requestedDays}`);
            return;
        }

        setIsSubmitting(true);

        const response = await vacationApi.createRequest(
            {
                startDate: newRequest.startDate,
                endDate: newRequest.endDate,
                type: newRequest.type,
                reason: newRequest.reason,
            },
            userId,
            email,
            username
        );

        setIsSubmitting(false);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        setNewRequest({ startDate: '', endDate: '', type: 'VACATION', reason: '' });
        setShowCreateModal(false);
        loadRequests();
        alert('Solicitud creada exitosamente. Tu supervisor ha sido notificado.');
    };

    const handleCancelRequest = async (requestId: string) => {
        if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return;
        if (!userId) return;

        const response = await vacationApi.cancelRequest(requestId, userId);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        loadRequests();
        alert('Solicitud cancelada exitosamente.');
    };

    const totalDays = newRequest.startDate && newRequest.endDate
        ? calculateDays(newRequest.startDate, newRequest.endDate)
        : 0;

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
                Cargando solicitudes...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>🏖️ Mis Vacaciones</h1>
                    <p style={{ color: '#666' }}>Gestiona tus solicitudes de vacaciones y permisos.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    disabled={!balance || balance.availableDays === 0}
                    style={{
                        padding: '12px 24px',
                        backgroundColor: (!balance || balance.availableDays === 0) ? '#95a5a6' : '#27ae60',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: (!balance || balance.availableDays === 0) ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                    }}
                >
                    ➕ Nueva Solicitud
                </button>
            </div>

            {/* Tarjeta de Balance de Vacaciones */}
            <div style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '24px',
                color: '#fff',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <CalendarDaysIcon style={{ width: '28px', height: '28px' }} />
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Mi Balance de Vacaciones {new Date().getFullYear()}</h2>
                </div>

                {balance ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{balance.totalDays}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Asignados</div>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{balance.usedDays}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Usados</div>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.15)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{balance.pendingDays}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Pendientes</div>
                        </div>
                        <div style={{
                            backgroundColor: 'rgba(255,255,255,0.25)',
                            borderRadius: '12px',
                            padding: '16px',
                            textAlign: 'center',
                            border: '2px solid rgba(255,255,255,0.5)',
                        }}>
                            <div style={{ fontSize: '2rem', fontWeight: '700' }}>{balance.availableDays}</div>
                            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Disponibles</div>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <ExclamationTriangleIcon style={{ width: '24px', height: '24px' }} />
                        <div>
                            <p style={{ margin: 0, fontWeight: '600' }}>Sin días asignados</p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', opacity: 0.9 }}>
                                Contacta al administrador para que te asigne días de vacaciones.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '24px' }}>
                    ⚠️ {error}
                </div>
            )}

            {/* Lista de solicitudes */}
            <div style={{ display: 'grid', gap: '16px' }}>
                {requests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#fff', borderRadius: '12px', color: '#666' }}>
                        No tienes solicitudes de vacaciones. ¡Crea una nueva!
                    </div>
                ) : (
                    requests.map((request) => (
                        <div
                            key={request.id}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                padding: '20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    {VACATION_TYPE_LABELS[request.type]}
                  </span>
                                    <span style={{
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        backgroundColor: VACATION_STATUS_COLORS[request.status].bg,
                                        color: VACATION_STATUS_COLORS[request.status].text,
                                    }}>
                    {VACATION_STATUS_LABELS[request.status]}
                  </span>
                                </div>
                                <div style={{ color: '#666', marginBottom: '4px' }}>
                                    📅 {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                    <span style={{ marginLeft: '12px' }}>({request.totalDays} días)</span>
                                </div>
                                {request.reason && (
                                    <div style={{ color: '#888', fontSize: '0.9rem' }}>
                                        💬 {request.reason}
                                    </div>
                                )}
                                {request.supervisorComment && (
                                    <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '8px', fontStyle: 'italic' }}>
                                        📝 Comentario del supervisor: {request.supervisorComment}
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {request.status === 'PENDING' && (
                                    <button
                                        onClick={() => handleCancelRequest(request.id)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#e74c3c',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal de crear solicitud */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                }} onClick={() => setShowCreateModal(false)}>
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            minWidth: '450px',
                            maxWidth: '500px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '20px' }}>🏖️ Nueva Solicitud de Vacaciones</h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                    Tipo de solicitud
                                </label>
                                <select
                                    value={newRequest.type}
                                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as VacationType })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem',
                                    }}
                                >
                                    {Object.entries(VACATION_TYPE_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                        Fecha inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.startDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                        Fecha fin
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.endDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                        min={newRequest.startDate || new Date().toISOString().split('T')[0]}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd',
                                            fontSize: '1rem',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                            </div>

                            {totalDays > 0 && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: canCreateRequest ? '#d4edda' : '#f8d7da',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    color: canCreateRequest ? '#155724' : '#721c24',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Días solicitados: {totalDays}</span>
                                        <span>Disponibles: {balance?.availableDays || 0}</span>
                                    </div>
                                    {!canCreateRequest && balance && (
                                        <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                            ⚠️ No tienes suficientes días disponibles para esta solicitud.
                                        </div>
                                    )}
                                    {!balance && (
                                        <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                                            ⚠️ No tienes días de vacaciones asignados. Contacta al administrador.
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>
                                    Motivo (opcional)
                                </label>
                                <textarea
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                    placeholder="Describe el motivo de tu solicitud..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd',
                                        fontSize: '1rem',
                                        resize: 'vertical',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    onClick={handleCreateRequest}
                                    disabled={isSubmitting || !canCreateRequest}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        backgroundColor: (isSubmitting || !canCreateRequest) ? '#95a5a6' : '#27ae60',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: (isSubmitting || !canCreateRequest) ? 'not-allowed' : 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    style={{
                                        padding: '12px 24px',
                                        backgroundColor: '#e9ecef',
                                        color: '#333',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
