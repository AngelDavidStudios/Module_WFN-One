import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
    const { roles, isAdmin, isSuperAdmin } = useAuth();
    const location = useLocation();
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 100px)',
            padding: '32px',
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: '6rem',
                marginBottom: '24px',
            }}>
                🚫
            </div>

            <h1 style={{
                fontSize: '2.5rem',
                color: '#e74c3c',
                marginBottom: '16px',
            }}>
                Acceso No Autorizado
            </h1>

            <p style={{
                fontSize: '1.1rem',
                color: '#666',
                maxWidth: '500px',
                marginBottom: '24px',
            }}>
                No tienes los permisos necesarios para acceder a <strong>{from}</strong>.
                <br />
                Tu rol actual es: <strong>{roles.join(', ') || 'Sin rol asignado'}</strong>
            </p>

            <div style={{
                padding: '20px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px',
                marginBottom: '32px',
                maxWidth: '500px',
            }}>
                <p style={{ margin: 0, color: '#856404' }}>
                    💡 <strong>Tip:</strong> Si crees que deberías tener acceso a esta página,
                    contacta a un administrador para que te asigne los permisos correspondientes.
                </p>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link
                    to="/"
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                    }}
                >
                    🏠 Ir al Inicio
                </Link>

                <Link
                    to="/dashboard"
                    style={{
                        padding: '12px 24px',
                        backgroundColor: '#27ae60',
                        color: '#fff',
                        textDecoration: 'none',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                    }}
                >
                    📊 Mi Dashboard
                </Link>
            </div>

            {/* Mostrar información de permisos */}
            <div style={{
                marginTop: '48px',
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                maxWidth: '400px',
            }}>
                <h3 style={{ marginBottom: '12px', color: '#495057' }}>Tus permisos actuales:</h3>
                <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    textAlign: 'left',
                }}>
                    <li style={{ marginBottom: '8px' }}>
                        {roles.length > 0 ? '✅' : '❌'} Autenticado
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        {isAdmin ? '✅' : '❌'} Acceso de Administrador
                    </li>
                    <li style={{ marginBottom: '8px' }}>
                        {isSuperAdmin ? '✅' : '❌'} Acceso de Super Admin
                    </li>
                </ul>
            </div>
        </div>
    );
};
