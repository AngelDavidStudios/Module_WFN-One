import React from 'react';
import { redirectToManagedLogin } from '../utils/cognitoManagedLogin';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export const LoginPage: React.FC = () => {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '20px',
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '24px',
                padding: '48px',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
            }}>
                {/* Logo */}
                <div style={{
                    width: '80px',
                    height: '80px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
                }}>
                    <CalendarDaysIcon style={{ width: '48px', height: '48px', color: '#fff' }} />
                </div>

                {/* Título */}
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#1f2937',
                    marginBottom: '8px',
                    letterSpacing: '-0.5px',
                }}>
                    WFN One
                </h1>

                <p style={{
                    color: '#6b7280',
                    fontSize: '1rem',
                    marginBottom: '32px',
                    lineHeight: '1.6',
                }}>
                    Sistema de Gestión de Vacaciones
                </p>

                {/* Botón de Login */}
                <button
                    onClick={() => redirectToManagedLogin()}
                    style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(59, 130, 246, 0.4)';
                    }}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        style={{ width: '20px', height: '20px' }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                        />
                    </svg>
                    Iniciar Sesión
                </button>

                {/* Footer */}
                <p style={{
                    marginTop: '32px',
                    fontSize: '0.8rem',
                    color: '#9ca3af',
                }}>
                    Acceso seguro con AWS Cognito
                </p>
            </div>
        </div>
    );
};
