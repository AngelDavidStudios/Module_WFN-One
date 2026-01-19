import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { vacationApi } from '../../services/vacationApi';
import {
    type VacationRequest,
    VACATION_TYPE_LABELS,
    VACATION_STATUS_COLORS,
} from '../../types/vacation';

export const PendingApprovals: React.FC = () => {
    const { userId, email } = useAuth();
    const [requests, setRequests] = useState<VacationRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [showCommentModal, setShowCommentModal] = useState<{ id: string; action: 'approve' | 'reject' } | null>(null);

    const loadRequests = useCallback(async () => {
        if (!userId) return;

        setIsLoading(true);
        setError(null);

        const response = await vacationApi.getPendingApprovals(userId);

        if (response.error) {
            setError(response.error);
        } else if (response.data) {
            setRequests(response.data.requests);
        }

        setIsLoading(false);
    }, [userId]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleAction = async (requestId: string, action: 'approve' | 'reject', actionComment?: string) => {
        if (!userId || !email) return;

        setProcessingId(requestId);

        const response = action === 'approve'
            ? await vacationApi.approveRequest(requestId, userId, email, actionComment)
            : await vacationApi.rejectRequest(requestId, userId, email, actionComment);

        setProcessingId(null);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        setShowCommentModal(null);
        setComment('');
        loadRequests();
        alert(`Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente.`);
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 100px)' }}>
                Cargando solicitudes pendientes...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>✅ Aprobaciones Pendientes</h1>
                <p style={{ color: '#666' }}>Revisa y gestiona las solicitudes de vacaciones de tu equipo.</p>
            </div>

            {error && (
                <div style={{ padding: '12px', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '8px', marginBottom: '24px' }}>
                    ⚠️ {error}
                </div>
            )}

            {requests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#fff', borderRadius: '12px', color: '#666' }}>
                    🎉 No tienes solicitudes pendientes de aprobación.
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '16px' }}>
                    {requests.map((request) => (
                        <div
                            key={request.id}
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                borderLeft: '4px solid #ffa502',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                      👤 {request.requesterName}
                    </span>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '12px',
                                            fontSize: '0.85rem',
                                            fontWeight: 'bold',
                                            backgroundColor: VACATION_STATUS_COLORS.PENDING.bg,
                                            color: VACATION_STATUS_COLORS.PENDING.text,
                                        }}>
                      Pendiente
                    </span>
                                    </div>

                                    <div style={{
                                        display: 'inline-block',
                                        padding: '8px 16px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        marginBottom: '12px',
                                    }}>
                                        <strong>{VACATION_TYPE_LABELS[request.type]}</strong>
                                    </div>

                                    <div style={{ color: '#666', marginBottom: '8px' }}>
                                        📅 <strong>Fechas:</strong> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                                        <span style={{
                                            marginLeft: '12px',
                                            padding: '2px 8px',
                                            backgroundColor: '#e3f2fd',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                        }}>
                      {request.totalDays} día(s)
                    </span>
                                    </div>

                                    {request.reason && (
                                        <div style={{ color: '#666', fontSize: '0.95rem' }}>
                                            💬 <strong>Motivo:</strong> {request.reason}
                                        </div>
                                    )}

                                    <div style={{ color: '#888', fontSize: '0.85rem', marginTop: '12px' }}>
                                        📧 {request.requesterEmail} · Solicitado el {new Date(request.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                                    <button
                                        onClick={() => setShowCommentModal({ id: request.id, action: 'approve' })}
                                        disabled={processingId === request.id}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#27ae60',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        ✅ Aprobar
                                    </button>
                                    <button
                                        onClick={() => setShowCommentModal({ id: request.id, action: 'reject' })}
                                        disabled={processingId === request.id}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: '#e74c3c',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        ❌ Rechazar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de comentario */}
            {showCommentModal && (
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
                }} onClick={() => setShowCommentModal(null)}>
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            padding: '24px',
                            minWidth: '400px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: '16px' }}>
                            {showCommentModal.action === 'approve' ? '✅ Aprobar Solicitud' : '❌ Rechazar Solicitud'}
                        </h2>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                                Comentario (opcional)
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={showCommentModal.action === 'approve'
                                    ? 'Añade un comentario de aprobación...'
                                    : 'Explica el motivo del rechazo...'
                                }
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

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handleAction(showCommentModal.id, showCommentModal.action, comment)}
                                disabled={processingId !== null}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: showCommentModal.action === 'approve' ? '#27ae60' : '#e74c3c',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                {processingId ? 'Procesando...' : 'Confirmar'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCommentModal(null);
                                    setComment('');
                                }}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#e9ecef',
                                    color: '#333',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
