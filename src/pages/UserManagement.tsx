import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { userManagementApi, type CognitoUser } from '../services/userManagementApi';
import { vacationApi } from '../services/vacationApi';
import { getAnyUserProfilePictureUrl } from '../services/profilePictureService';
import { type UserRole } from '../types/auth';
import { type VacationBalance } from '../types/vacation';
import { UserAvatar } from '../components/ui';
import {
    CalendarDaysIcon,
} from '@heroicons/react/24/outline';

export const UserManagement: React.FC = () => {
    const { permissions, isSuperAdmin, userId: adminUserId } = useAuth();

    const [users, setUsers] = useState<CognitoUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [showCredentialsModal, setShowCredentialsModal] = useState(false);
    const [showBalanceModal, setShowBalanceModal] = useState(false);
    const [createdUserCredentials, setCreatedUserCredentials] = useState<{
        email: string;
        username: string;
        temporaryPassword: string;
    } | null>(null);
    const [selectedUser, setSelectedUser] = useState<CognitoUser | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [operationLoading, setOperationLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const [newUser, setNewUser] = useState({
        email: '',
        username: '',
        temporaryPassword: '',
    });

    // Estado para fotos de perfil de usuarios
    const [userPhotos, setUserPhotos] = useState<Record<string, string | null>>({});

    // Estado para balances de vacaciones
    const [userBalances, setUserBalances] = useState<Record<string, VacationBalance>>({});
    const [balanceDays, setBalanceDays] = useState<number>(0);

    // Cargar usuarios
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const response = await userManagementApi.listUsers();

        if (response.error) {
            setError(response.error);
            setUsers([]);
        } else if (response.data) {
            setUsers(response.data.users);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    // Cargar fotos de perfil cuando cambian los usuarios
    useEffect(() => {
        const loadUserPhotos = async () => {
            const photos: Record<string, string | null> = {};

            // Cargar fotos en paralelo (máximo 5 a la vez para no sobrecargar)
            const batchSize = 5;
            for (let i = 0; i < users.length; i += batchSize) {
                const batch = users.slice(i, i + batchSize);
                const results = await Promise.all(
                    batch.map(async (user) => {
                        // Usar el username del usuario para buscar su foto
                        const photoUrl = await getAnyUserProfilePictureUrl(user.username);
                        return { id: user.username, url: photoUrl };
                    })
                );
                results.forEach(({ id, url }) => {
                    photos[id] = url;
                });
            }

            setUserPhotos(photos);
        };

        if (users.length > 0) {
            loadUserPhotos();
        }
    }, [users]);

    // Cargar balances de vacaciones
    useEffect(() => {
        const loadBalances = async () => {
            const response = await vacationApi.getAllBalances();
            if (response.data?.balances) {
                const balancesMap: Record<string, VacationBalance> = {};
                response.data.balances.forEach((balance) => {
                    balancesMap[balance.userId] = balance;
                });
                setUserBalances(balancesMap);
            }
        };

        if (users.length > 0 && isSuperAdmin) {
            loadBalances();
        }
    }, [users, isSuperAdmin]);

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    );

    const handleCreateUser = async () => {
        if (!newUser.email || !newUser.username) {
            alert('Por favor completa el email y nombre de usuario');
            return;
        }

        // Si se proporciona contraseña, validar longitud
        if (newUser.temporaryPassword && newUser.temporaryPassword.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setOperationLoading(true);

        const response = await userManagementApi.createUser(
            newUser.email,
            newUser.username,
            newUser.temporaryPassword || undefined
        );

        setOperationLoading(false);

        if (response.error) {
            alert(`Error al crear usuario: ${response.error}`);
            return;
        }

        // Guardar credenciales para mostrar al admin
        if (response.data?.user) {
            setCreatedUserCredentials({
                email: newUser.email,
                username: newUser.username,
                temporaryPassword: response.data.user.temporaryPassword,
            });
            setShowCredentialsModal(true);
        }

        setNewUser({ email: '', username: '', temporaryPassword: '' });
        setShowCreateModal(false);
        loadUsers();
    };

    const handleToggleRole = async (username: string, role: UserRole, hasRole: boolean) => {
        if (!permissions.canAssignRoles && role !== 'user') {
            alert('No tienes permisos para asignar este rol');
            return;
        }

        setOperationLoading(true);

        const response = hasRole
            ? await userManagementApi.removeUserFromGroup(username, role)
            : await userManagementApi.addUserToGroup(username, role);

        setOperationLoading(false);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        // Actualizar el usuario seleccionado
        if (selectedUser) {
            const updatedGroups = hasRole
                ? selectedUser.groups.filter(g => g !== role)
                : [...selectedUser.groups, role];
            setSelectedUser({ ...selectedUser, groups: updatedGroups });
        }

        loadUsers();
    };

    const handleDeleteUser = async (username: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar al usuario "${username}"? Esta acción es irreversible.`)) {
            return;
        }

        setOperationLoading(true);

        const response = await userManagementApi.deleteUser(username);

        setOperationLoading(false);

        if (response.error) {
            alert(`Error al eliminar usuario: ${response.error}`);
            return;
        }

        loadUsers();
        alert('Usuario eliminado exitosamente.');
    };

    const handleResetPassword = async () => {
        if (!selectedUser || !newPassword) {
            alert('Por favor ingresa la nueva contraseña');
            return;
        }

        if (newPassword.length < 8) {
            alert('La contraseña debe tener al menos 8 caracteres');
            return;
        }

        setOperationLoading(true);

        const response = await userManagementApi.resetPassword(selectedUser.username, newPassword);

        setOperationLoading(false);

        if (response.error) {
            alert(`Error al resetear contraseña: ${response.error}`);
            return;
        }

        setNewPassword('');
        setShowResetPasswordModal(false);
        setSelectedUser(null);
        loadUsers();
        alert('Contraseña reseteada exitosamente. El usuario puede iniciar sesión con la nueva contraseña.');
    };

    const handleOpenBalanceModal = (user: CognitoUser) => {
        setSelectedUser(user);
        const currentBalance = userBalances[user.username];
        setBalanceDays(currentBalance?.totalDays || 0);
        setShowBalanceModal(true);
    };

    const handleSetBalance = async () => {
        if (!selectedUser || !adminUserId) {
            alert('Error: Usuario no seleccionado');
            return;
        }

        if (balanceDays < 0) {
            alert('Los días de vacaciones no pueden ser negativos');
            return;
        }

        setOperationLoading(true);

        const response = await vacationApi.setBalance(
            selectedUser.username,
            selectedUser.email || '',
            selectedUser.preferredUsername || selectedUser.name || selectedUser.username,
            balanceDays,
            adminUserId
        );

        setOperationLoading(false);

        if (response.error) {
            alert(`Error al asignar vacaciones: ${response.error}`);
            return;
        }

        // Actualizar balance local
        if (response.data?.balance) {
            setUserBalances(prev => ({
                ...prev,
                [selectedUser.username]: response.data!.balance,
            }));
        }

        setShowBalanceModal(false);
        setSelectedUser(null);
        setBalanceDays(0);
        alert('Días de vacaciones asignados exitosamente.');
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, React.CSSProperties> = {
            CONFIRMED: { backgroundColor: '#d4edda', color: '#155724' },
            UNCONFIRMED: { backgroundColor: '#fff3cd', color: '#856404' },
            FORCE_CHANGE_PASSWORD: { backgroundColor: '#cce5ff', color: '#004085' },
        };

        const labels: Record<string, string> = {
            CONFIRMED: 'Confirmado',
            UNCONFIRMED: 'Sin confirmar',
            FORCE_CHANGE_PASSWORD: 'Cambio de contraseña',
        };

        return (
            <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                ...(styles[status] || { backgroundColor: '#f8f9fa', color: '#495057' }),
            }}>
        {labels[status] || status}
      </span>
        );
    };

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 100px)',
                fontSize: '1.2rem',
            }}>
                Cargando usuarios de Cognito...
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>👥 Gestión de Usuarios</h1>
                <p style={{ color: '#666' }}>
                    Administra usuarios de AWS Cognito, asigna roles y gestiona permisos del sistema.
                </p>
                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '8px',
                        marginTop: '16px',
                    }}>
                        ⚠️ {error}
                    </div>
                )}
            </div>

            {/* Barra de acciones */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '10px 16px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            width: '300px',
                            fontSize: '1rem',
                        }}
                    />
                    <button
                        onClick={loadUsers}
                        disabled={isLoading}
                        style={{
                            padding: '10px 16px',
                            backgroundColor: '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                        }}
                    >
                        🔄 Recargar
                    </button>
                    <span style={{ color: '#666' }}>
            {filteredUsers.length} usuario(s) encontrado(s)
          </span>
                </div>

                {permissions.canManageUsers && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#27ae60',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        ➕ Crear Usuario
                    </button>
                )}
            </div>

            {/* Tabla de usuarios */}
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                overflow: 'hidden',
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={tableHeaderStyle}>Usuario</th>
                        <th style={tableHeaderStyle}>Email</th>
                        <th style={tableHeaderStyle}>Estado</th>
                        <th style={tableHeaderStyle}>Roles</th>
                        <th style={tableHeaderStyle}>Vacaciones</th>
                        <th style={tableHeaderStyle}>Creado</th>
                        <th style={tableHeaderStyle}>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredUsers.length === 0 ? (
                        <tr>
                            <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#666' }}>
                                {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios registrados'}
                            </td>
                        </tr>
                    ) : (
                        filteredUsers.map((user) => (
                            <tr key={user.username} style={{ borderBottom: '1px solid #e9ecef' }}>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {/* Foto de perfil con iniciales */}
                                        <UserAvatar
                                            name={user.preferredUsername || user.name || user.username}
                                            photoUrl={userPhotos[user.username]}
                                            size="md"
                                            showBorder={true}
                                        />
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>
                                                {user.preferredUsername || user.name || user.username}
                                            </div>
                                            {(user.preferredUsername || user.name) && user.username !== (user.preferredUsername || user.name) && (
                                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                                    ID: {user.username}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                      {user.email || '-'}
                    </span>
                                </td>
                                <td style={tableCellStyle}>{getStatusBadge(user.status)}</td>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {user.groups.length > 0 ? (
                                            user.groups.map(role => (
                                                <span
                                                    key={role}
                                                    style={{
                                                        padding: '2px 8px',
                                                        backgroundColor:
                                                            role === 'super_admin' ? '#f8d7da' :
                                                                role === 'admin' ? '#fff3cd' : '#e3f2fd',
                                                        borderRadius: '12px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 'bold',
                                                    }}
                                                >
                            {role}
                          </span>
                                            ))
                                        ) : (
                                            <span style={{ color: '#888', fontSize: '0.9rem' }}>Sin roles</span>
                                        )}
                                    </div>
                                </td>
                                <td style={tableCellStyle}>
                                    {/* Columna de Vacaciones */}
                                    {(() => {
                                        const balance = userBalances[user.username];
                                        if (!balance) {
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ color: '#999', fontSize: '0.85rem' }}>Sin asignar</span>
                                                    {isSuperAdmin && (
                                                        <button
                                                            onClick={() => handleOpenBalanceModal(user)}
                                                            style={{
                                                                padding: '4px 8px',
                                                                backgroundColor: '#3b82f6',
                                                                color: '#fff',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem',
                                                            }}
                                                        >
                                                            Asignar
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        fontSize: '0.9rem',
                                                        fontWeight: '600',
                                                        color: balance.availableDays > 0 ? '#059669' : '#dc2626',
                                                    }}>
                                                        <CalendarDaysIcon style={{ width: '16px', height: '16px' }} />
                                                        {balance.availableDays} días
                                                    </div>
                                                    <div style={{ fontSize: '0.7rem', color: '#666' }}>
                                                        {balance.usedDays} usados / {balance.totalDays} total
                                                    </div>
                                                </div>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => handleOpenBalanceModal(user)}
                                                        style={{
                                                            padding: '4px 6px',
                                                            backgroundColor: 'transparent',
                                                            color: '#3b82f6',
                                                            border: '1px solid #3b82f6',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.7rem',
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </td>
                                <td style={tableCellStyle}>
                    <span style={{ color: '#666', fontSize: '0.9rem' }}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                    </span>
                                </td>
                                <td style={tableCellStyle}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {permissions.canAssignRoles && (
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowRoleModal(true);
                                                }}
                                                style={actionButtonStyle('#9b59b6')}
                                                title="Gestionar roles"
                                            >
                                                🔑
                                            </button>
                                        )}
                                        {isSuperAdmin && (
                                            <button
                                                onClick={() => {
                                                    setSelectedUser(user);
                                                    setShowResetPasswordModal(true);
                                                }}
                                                disabled={operationLoading}
                                                style={actionButtonStyle('#3498db')}
                                                title="Resetear contraseña"
                                            >
                                                🔄
                                            </button>
                                        )}
                                        {isSuperAdmin && !user.groups.includes('super_admin') && (
                                            <button
                                                onClick={() => handleDeleteUser(user.username)}
                                                disabled={operationLoading}
                                                style={actionButtonStyle('#e74c3c')}
                                                title="Eliminar usuario"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>

            {/* Modal de crear usuario */}
            {showCreateModal && (
                <Modal onClose={() => setShowCreateModal(false)} title="Crear Nuevo Usuario">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Email (para inicio de sesión) *</label>
                            <input
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                style={inputStyle}
                                placeholder="usuario@email.com"
                            />
                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                El usuario iniciará sesión con este email.
                            </small>
                        </div>
                        <div>
                            <label style={labelStyle}>Nombre de usuario (visible) *</label>
                            <input
                                type="text"
                                value={newUser.username}
                                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                                style={inputStyle}
                                placeholder="Juan Pérez"
                            />
                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                Este nombre se mostrará en la interfaz.
                            </small>
                        </div>
                        <div>
                            <label style={labelStyle}>Contraseña temporal (opcional)</label>
                            <input
                                type="password"
                                value={newUser.temporaryPassword}
                                onChange={(e) => setNewUser({ ...newUser, temporaryPassword: e.target.value })}
                                style={inputStyle}
                                placeholder="Dejar vacío para generar automáticamente"
                            />
                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                Si se deja vacío, Cognito generará una contraseña y la enviará por correo al usuario.
                                El usuario deberá cambiarla en su primer inicio de sesión.
                            </small>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                                onClick={handleCreateUser}
                                disabled={operationLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: operationLoading ? '#95a5a6' : '#27ae60',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: operationLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                {operationLoading ? 'Creando...' : 'Crear Usuario'}
                            </button>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                disabled={operationLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: '#6c757d',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal de gestión de roles */}
            {showRoleModal && selectedUser && (
                <Modal onClose={() => setShowRoleModal(false)} title={`Roles de ${selectedUser.username}`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {(['user', 'admin', 'super_admin'] as UserRole[]).map(role => {
                            const hasRole = selectedUser.groups.includes(role);
                            const canToggle = isSuperAdmin || (permissions.canAssignRoles && role !== 'super_admin');

                            return (
                                <div
                                    key={role}
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '12px',
                                        backgroundColor: hasRole ? '#e3f2fd' : '#f8f9fa',
                                        borderRadius: '8px',
                                        border: hasRole ? '2px solid #2196f3' : '1px solid #e9ecef',
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {role === 'super_admin' ? '👑 Super Admin' :
                                                role === 'admin' ? '⚙️ Administrador' : '👤 Usuario'}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                            {role === 'super_admin' ? 'Acceso completo al sistema' :
                                                role === 'admin' ? 'Puede gestionar usuarios y configuraciones' :
                                                    'Acceso básico al sistema'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleRole(selectedUser.username, role, hasRole)}
                                        disabled={!canToggle || operationLoading}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: !canToggle || operationLoading
                                                ? '#95a5a6'
                                                : hasRole ? '#e74c3c' : '#27ae60',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: canToggle && !operationLoading ? 'pointer' : 'not-allowed',
                                            opacity: canToggle ? 1 : 0.5,
                                        }}
                                    >
                                        {operationLoading ? '...' : hasRole ? 'Quitar' : 'Asignar'}
                                    </button>
                                </div>
                            );
                        })}

                        <button
                            onClick={() => setShowRoleModal(false)}
                            style={{
                                marginTop: '16px',
                                padding: '12px',
                                backgroundColor: '#6c757d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal de resetear contraseña */}
            {showResetPasswordModal && selectedUser && (
                <Modal
                    onClose={() => {
                        setShowResetPasswordModal(false);
                        setNewPassword('');
                        setSelectedUser(null);
                    }}
                    title="🔄 Resetear Contraseña"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            marginBottom: '8px',
                        }}>
                            <p style={{ margin: 0, color: '#1565c0' }}>
                                <strong>Usuario:</strong> {selectedUser.preferredUsername || selectedUser.name || selectedUser.username}
                            </p>
                            <p style={{ margin: '4px 0 0 0', color: '#1565c0', fontSize: '0.9rem' }}>
                                <strong>Email:</strong> {selectedUser.email}
                            </p>
                        </div>

                        {selectedUser.status === 'FORCE_CHANGE_PASSWORD' && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#fff3cd',
                                borderRadius: '8px',
                                color: '#856404',
                            }}>
                                ⚠️ Este usuario tiene pendiente un cambio de contraseña obligatorio.
                                Al resetear la contraseña, podrá iniciar sesión normalmente.
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>Nueva contraseña *</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={inputStyle}
                                placeholder="Mínimo 8 caracteres"
                            />
                            <small style={{ color: '#666', fontSize: '0.85rem' }}>
                                El usuario podrá iniciar sesión con esta contraseña inmediatamente.
                            </small>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                            <button
                                onClick={handleResetPassword}
                                disabled={operationLoading || !newPassword}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: operationLoading ? '#95a5a6' : '#3498db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: operationLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                {operationLoading ? 'Reseteando...' : 'Resetear Contraseña'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowResetPasswordModal(false);
                                    setNewPassword('');
                                    setSelectedUser(null);
                                }}
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
                </Modal>
            )}

            {/* Modal de credenciales del usuario creado */}
            {showCredentialsModal && createdUserCredentials && (
                <Modal
                    onClose={() => {
                        setShowCredentialsModal(false);
                        setCreatedUserCredentials(null);
                    }}
                    title="✅ Usuario Creado Exitosamente"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            padding: '16px',
                            backgroundColor: '#d4edda',
                            borderRadius: '8px',
                            color: '#155724',
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>
                                ¡Usuario creado! Comparte estas credenciales con el usuario:
                            </p>
                        </div>

                        <div style={{
                            padding: '20px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '2px dashed #dee2e6',
                        }}>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', color: '#666' }}>Nombre: </span>
                                <span style={{ fontSize: '1.1rem' }}>{createdUserCredentials.username}</span>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <span style={{ fontWeight: 'bold', color: '#666' }}>Email (para iniciar sesión): </span>
                                <span style={{
                                    fontSize: '1.1rem',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#e9ecef',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                }}>
                  {createdUserCredentials.email}
                </span>
                            </div>
                            <div>
                                <span style={{ fontWeight: 'bold', color: '#666' }}>Contraseña temporal: </span>
                                <span style={{
                                    fontSize: '1.1rem',
                                    fontFamily: 'monospace',
                                    backgroundColor: '#fff3cd',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                }}>
                  {createdUserCredentials.temporaryPassword}
                </span>
                            </div>
                        </div>

                        <div style={{
                            padding: '12px',
                            backgroundColor: '#cce5ff',
                            borderRadius: '8px',
                            color: '#004085',
                            fontSize: '0.9rem',
                        }}>
                            ⚠️ <strong>Importante:</strong> El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
                        </div>

                        <button
                            onClick={() => {
                                // Copiar credenciales al portapapeles
                                const text = `Credenciales de acceso:\nEmail: ${createdUserCredentials.email}\nContraseña temporal: ${createdUserCredentials.temporaryPassword}`;
                                navigator.clipboard.writeText(text);
                                alert('Credenciales copiadas al portapapeles');
                            }}
                            style={{
                                padding: '12px',
                                backgroundColor: '#6c757d',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                        >
                            📋 Copiar Credenciales
                        </button>

                        <button
                            onClick={() => {
                                setShowCredentialsModal(false);
                                setCreatedUserCredentials(null);
                            }}
                            style={{
                                padding: '12px',
                                backgroundColor: '#27ae60',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                            }}
                        >
                            Cerrar
                        </button>
                    </div>
                </Modal>
            )}

            {/* Modal de asignar vacaciones */}
            {showBalanceModal && selectedUser && (
                <Modal
                    onClose={() => {
                        setShowBalanceModal(false);
                        setSelectedUser(null);
                        setBalanceDays(0);
                    }}
                    title="🏖️ Asignar Días de Vacaciones"
                >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{
                            padding: '12px',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '8px',
                            color: '#1565c0',
                        }}>
                            <p style={{ margin: 0 }}>
                                <strong>Usuario:</strong> {selectedUser.preferredUsername || selectedUser.name || selectedUser.username}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                                {selectedUser.email}
                            </p>
                        </div>

                        {/* Información del balance actual */}
                        {userBalances[selectedUser.username] && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef',
                            }}>
                                <p style={{ margin: 0, fontWeight: 'bold', marginBottom: '8px' }}>Balance actual:</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.9rem' }}>
                                    <div>
                                        <span style={{ color: '#666' }}>Total asignado:</span>
                                        <strong style={{ marginLeft: '8px' }}>{userBalances[selectedUser.username].totalDays} días</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#666' }}>Usados:</span>
                                        <strong style={{ marginLeft: '8px', color: '#dc2626' }}>{userBalances[selectedUser.username].usedDays} días</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#666' }}>Pendientes:</span>
                                        <strong style={{ marginLeft: '8px', color: '#f59e0b' }}>{userBalances[selectedUser.username].pendingDays} días</strong>
                                    </div>
                                    <div>
                                        <span style={{ color: '#666' }}>Disponibles:</span>
                                        <strong style={{ marginLeft: '8px', color: '#059669' }}>{userBalances[selectedUser.username].availableDays} días</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label style={labelStyle}>
                                Días totales de vacaciones para el año {new Date().getFullYear()}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="365"
                                value={balanceDays}
                                onChange={(e) => setBalanceDays(parseInt(e.target.value) || 0)}
                                style={inputStyle}
                            />
                            <p style={{ margin: '8px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                                Este es el total de días que el usuario puede solicitar durante el año.
                            </p>
                        </div>

                        {userBalances[selectedUser.username] && balanceDays < userBalances[selectedUser.username].usedDays && (
                            <div style={{
                                padding: '12px',
                                backgroundColor: '#fee2e2',
                                borderRadius: '8px',
                                color: '#dc2626',
                                fontSize: '0.9rem',
                            }}>
                                ⚠️ No puedes asignar menos días de los que el usuario ya ha usado ({userBalances[selectedUser.username].usedDays} días).
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                            <button
                                onClick={handleSetBalance}
                                disabled={operationLoading || (userBalances[selectedUser.username] && balanceDays < userBalances[selectedUser.username].usedDays)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    backgroundColor: operationLoading ? '#95a5a6' : '#27ae60',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: operationLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold',
                                }}
                            >
                                {operationLoading ? 'Guardando...' : 'Guardar'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowBalanceModal(false);
                                    setSelectedUser(null);
                                    setBalanceDays(0);
                                }}
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
                </Modal>
            )}
        </div>
    );
};

// Componente Modal reutilizable
interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    title: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => (
    <div
        style={{
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
        }}
        onClick={onClose}
    >
        <div
            style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                padding: '24px',
                minWidth: '400px',
                maxWidth: '500px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <h2 style={{ marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e9ecef' }}>
                {title}
            </h2>
            {children}
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
};

const actionButtonStyle = (bgColor: string): React.CSSProperties => ({
    width: '36px',
    height: '36px',
    backgroundColor: bgColor,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '4px',
    fontWeight: 'bold',
    color: '#495057',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '1rem',
    boxSizing: 'border-box',
};
