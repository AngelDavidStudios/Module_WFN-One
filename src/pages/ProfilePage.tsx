import React, { useState, useRef, useEffect } from 'react';
import { updatePassword } from 'aws-amplify/auth';
import { useAuth } from '../hooks/useAuth';
import {
    uploadProfilePicture,
    getProfilePictureUrl,
    deleteProfilePicture
} from '../services/profilePictureService';
import { UserAvatar } from '../components/ui';
import {
    CameraIcon,
    TrashIcon,
    KeyIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';

export const ProfilePage: React.FC = () => {
    const { username, email, roles, userId } = useAuth();

    // Estado para foto de perfil
    const [profilePicture, setProfilePicture] = useState<string | null>(null);
    const [isUploadingPicture, setIsUploadingPicture] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [showChangePassword, setShowChangePassword] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Cargar foto de perfil al montar
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

    // Handler para subir foto
    const handlePictureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) return;

        setIsUploadingPicture(true);
        setMessage(null);

        const result = await uploadProfilePicture(userId, file);

        if (result.success && result.url) {
            setProfilePicture(result.url);
            setMessage({ type: 'success', text: '¡Foto de perfil actualizada!' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al subir la imagen' });
        }

        setIsUploadingPicture(false);
        // Limpiar input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handler para eliminar foto
    const handleDeletePicture = async () => {
        if (!userId) return;

        const confirm = window.confirm('¿Estás seguro de eliminar tu foto de perfil?');
        if (!confirm) return;

        setIsUploadingPicture(true);
        const success = await deleteProfilePicture(userId);

        if (success) {
            setProfilePicture(null);
            setMessage({ type: 'success', text: 'Foto de perfil eliminada' });
        } else {
            setMessage({ type: 'error', text: 'Error al eliminar la imagen' });
        }

        setIsUploadingPicture(false);
    };

    const handleChangePassword = async () => {
        setMessage(null);

        if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Por favor completa todos los campos' });
            return;
        }

        if (passwordForm.newPassword.length < 8) {
            setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 8 caracteres' });
            return;
        }

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            return;
        }

        setIsLoading(true);

        try {
            await updatePassword({
                oldPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });

            setMessage({ type: 'success', text: '¡Contraseña actualizada exitosamente!' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setShowChangePassword(false);
        } catch (error) {
            const errorMessage = (error as Error).message || 'Error al cambiar la contraseña';
            setMessage({ type: 'error', text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        fontSize: '1rem',
        boxSizing: 'border-box',
        backgroundColor: '#fff',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        marginBottom: '6px',
        fontWeight: '600',
        color: '#374151',
        fontSize: '0.9rem',
    };

    return (
        <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '32px',
                marginBottom: '32px',
                color: '#fff',
            }}>
                <h1 style={{ fontSize: '1.75rem', marginBottom: '8px', fontWeight: '700' }}>
                    Configuración del Perfil
                </h1>
                <p style={{ fontSize: '0.95rem', opacity: 0.9, margin: 0 }}>
                    Gestiona tu información personal y configuración de seguridad
                </p>
            </div>

            {/* Mensaje de estado */}
            {message && (
                <div style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                    color: message.type === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    {message.type === 'success' ? '✅' : '⚠️'} {message.text}
                </div>
            )}

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '24px',
            }}>
                {/* Sección de foto de perfil */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <CameraIcon style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                                Foto de Perfil
                            </h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                                JPG, PNG, GIF o WEBP. Máx 5MB
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                            <UserAvatar
                                name={username || email?.split('@')[0] || 'Usuario'}
                                photoUrl={profilePicture}
                                size="xxl"
                                showBorder={true}
                            />
                            {isUploadingPicture && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    backgroundColor: 'rgba(0,0,0,0.5)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <div style={{
                                        width: '30px',
                                        height: '30px',
                                        border: '3px solid #fff',
                                        borderTopColor: 'transparent',
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite',
                                    }} />
                                </div>
                            )}
                        </div>

                        {/* Botones de acción */}
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handlePictureUpload}
                                style={{ display: 'none' }}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingPicture}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#3b82f6',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    opacity: isUploadingPicture ? 0.7 : 1,
                                }}
                            >
                                <CameraIcon style={{ width: '16px', height: '16px' }} />
                                {profilePicture ? 'Cambiar' : 'Subir'} Foto
                            </button>
                            {profilePicture && (
                                <button
                                    onClick={handleDeletePicture}
                                    disabled={isUploadingPicture}
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#fee2e2',
                                        color: '#dc2626',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                                    Eliminar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información del perfil */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '28px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ShieldCheckIcon style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                                Información Personal
                            </h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                                Datos de tu cuenta
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '10px',
                        }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Nombre</span>
                            <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9rem' }}>
                {username || 'No disponible'}
              </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '10px',
                        }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Email</span>
                            <span style={{ color: '#1f2937', fontWeight: '600', fontSize: '0.9rem' }}>
                {email || 'No disponible'}
              </span>
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '14px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '10px',
                        }}>
                            <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>Roles</span>
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {roles.map(role => (
                                    <span
                                        key={role}
                                        style={{
                                            padding: '4px 10px',
                                            backgroundColor:
                                                role === 'super_admin' ? '#fef2f2' :
                                                    role === 'admin' ? '#fffbeb' : '#ecfdf5',
                                            color:
                                                role === 'super_admin' ? '#dc2626' :
                                                    role === 'admin' ? '#d97706' : '#059669',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                        }}
                                    >
                    {role}
                  </span>
                                ))}
                            </div>
                        </div>

                        <div style={{
                            padding: '14px 16px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '10px',
                        }}>
              <span style={{ color: '#6b7280', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>
                ID Usuario
              </span>
                            <span style={{
                                fontFamily: 'monospace',
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                wordBreak: 'break-all',
                            }}>
                {userId || 'No disponible'}
              </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de seguridad */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '28px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                marginTop: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <KeyIcon style={{ width: '22px', height: '22px', color: '#fff' }} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                            Seguridad
                        </h2>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                            Gestiona tu contraseña
                        </p>
                    </div>
                </div>

                {!showChangePassword ? (
                    <button
                        onClick={() => setShowChangePassword(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#f59e0b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#d97706'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f59e0b'}
                    >
                        <KeyIcon style={{ width: '18px', height: '18px' }} />
                        Cambiar Contraseña
                    </button>
                ) : (
                    <div style={{ maxWidth: '400px' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Contraseña actual</label>
                            <input
                                type="password"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Ingresa tu contraseña actual"
                            />
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={labelStyle}>Nueva contraseña</label>
                            <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Mínimo 8 caracteres"
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>Confirmar nueva contraseña</label>
                            <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Repite la nueva contraseña"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={handleChangePassword}
                                disabled={isLoading}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: isLoading ? '#9ca3af' : '#10b981',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: isLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                }}
                            >
                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowChangePassword(false);
                                    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                                    setMessage(null);
                                }}
                                disabled={isLoading}
                                style={{
                                    padding: '12px 24px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* CSS para animación de spinner */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};
