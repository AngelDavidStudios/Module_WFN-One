import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { organizationApi } from '../../services/organizationApi';
import { type OrganizationNode, DEPARTMENTS } from '../../types/organization';
import { userManagementApi, type CognitoUser } from '../../services/userManagementApi';
import { getAnyUserProfilePictureUrl } from '../../services/profilePictureService';
import { UserAvatar } from '../../components/ui';
import {
    BuildingOffice2Icon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    ChevronRightIcon,
    XMarkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    BriefcaseIcon,
    UserIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';
import {
    BuildingOffice2Icon as BuildingOffice2IconSolid,
} from '@heroicons/react/24/solid';

export const ManageHierarchy: React.FC = () => {
    const { isSuperAdmin } = useAuth();
    const [nodes, setNodes] = useState<OrganizationNode[]>([]);
    const [tree, setTree] = useState<OrganizationNode[]>([]);
    const [cognitoUsers, setCognitoUsers] = useState<CognitoUser[]>([]);
    const [userPhotos, setUserPhotos] = useState<Record<string, string | null>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [newNode, setNewNode] = useState({
        userId: '',
        userEmail: '',
        userName: '',
        position: '',
        department: DEPARTMENTS[0] as string,
        supervisorId: '',
    });

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [treeResponse, usersResponse] = await Promise.all([
                organizationApi.getTree(),
                userManagementApi.listUsers(),
            ]);

            if (treeResponse.error) {
                setError(treeResponse.error);
            } else if (treeResponse.data) {
                setNodes(treeResponse.data.nodes);
                setTree(treeResponse.data.tree);
            }

            if (usersResponse.data) {
                setCognitoUsers(usersResponse.data.users);
            }
        } catch (err) {
            setError((err as Error).message);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Cargar fotos de perfil
    useEffect(() => {
        const loadUserPhotos = async () => {
            const photos: Record<string, string | null> = {};
            for (const node of nodes) {
                const photoUrl = await getAnyUserProfilePictureUrl(node.userId);
                photos[node.userId] = photoUrl;
            }
            setUserPhotos(photos);
        };
        if (nodes.length > 0) {
            loadUserPhotos();
        }
    }, [nodes]);

    const handleUserSelect = (userId: string) => {
        const user = cognitoUsers.find(u => u.username === userId);
        if (user) {
            setNewNode({
                ...newNode,
                userId: user.username,
                userEmail: user.email || '',
                userName: user.preferredUsername || user.name || user.email?.split('@')[0] || user.username,
            });
        }
    };

    const handleAddNode = async () => {
        if (!newNode.userId || !newNode.position || !newNode.department) {
            alert('Por favor completa todos los campos requeridos');
            return;
        }

        setIsSubmitting(true);

        const response = await organizationApi.createNode({
            userId: newNode.userId,
            userEmail: newNode.userEmail,
            userName: newNode.userName,
            position: newNode.position,
            department: newNode.department,
            supervisorId: newNode.supervisorId || undefined,
        });

        setIsSubmitting(false);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        setNewNode({ userId: '', userEmail: '', userName: '', position: '', department: DEPARTMENTS[0], supervisorId: '' });
        setShowAddModal(false);
        loadData();
        alert('Nodo agregado exitosamente al árbol organizacional.');
    };

    const handleDeleteNode = async (nodeId: string, nodeName: string) => {
        if (!confirm(`¿Estás seguro de eliminar a "${nodeName}" del árbol organizacional?`)) return;

        const response = await organizationApi.deleteNode(nodeId);

        if (response.error) {
            alert(`Error: ${response.error}`);
            return;
        }

        loadData();
        alert('Nodo eliminado exitosamente.');
    };

    // Usuarios que no están en el árbol
    const availableUsers = cognitoUsers.filter(
        user => !nodes.some(node => node.userId === user.username)
    );

    if (!isSuperAdmin) {
        return (
            <div style={{
                padding: '64px 32px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
            }}>
                <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: '#fef2f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <ExclamationTriangleIcon style={{ width: '40px', height: '40px', color: '#dc2626' }} />
                </div>
                <h1 style={{ fontSize: '1.5rem', color: '#1f2937', margin: 0 }}>Acceso Denegado</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>Solo el Super Admin puede gestionar el árbol organizacional.</p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: 'calc(100vh - 100px)',
                gap: '16px',
            }}>
                <ArrowPathIcon style={{ width: '40px', height: '40px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
                <span style={{ color: '#6b7280' }}>Cargando estructura organizacional...</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                borderRadius: '16px',
                padding: '28px 32px',
                marginBottom: '32px',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <BuildingOffice2IconSolid style={{ width: '32px', height: '32px', color: '#fff' }} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: '700' }}>
                            Árbol Organizacional
                        </h1>
                        <p style={{ margin: '4px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
                            Define la estructura jerárquica de la organización
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={() => loadData()}
                        style={{
                            padding: '12px',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background-color 0.2s',
                        }}
                        title="Refrescar datos"
                    >
                        <ArrowPathIcon style={{ width: '20px', height: '20px' }} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        disabled={availableUsers.length === 0}
                        style={{
                            padding: '12px 20px',
                            backgroundColor: availableUsers.length === 0 ? 'rgba(255,255,255,0.3)' : '#fff',
                            color: availableUsers.length === 0 ? 'rgba(255,255,255,0.7)' : '#6366f1',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: availableUsers.length === 0 ? 'not-allowed' : 'pointer',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                        }}
                    >
                        <PlusIcon style={{ width: '20px', height: '20px' }} />
                        Agregar al Árbol
                    </button>
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '14px 18px',
                    backgroundColor: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '10px',
                    marginBottom: '24px',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                }}>
                    <ExclamationTriangleIcon style={{ width: '20px', height: '20px', flexShrink: 0 }} />
                    {error}
                </div>
            )}

            {/* Vista del árbol */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Árbol visual */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <BuildingOffice2Icon style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                                Estructura Jerárquica
                            </h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                                Vista en árbol de la organización
                            </p>
                        </div>
                    </div>

                    {tree.length === 0 ? (
                        <div style={{
                            textAlign: 'center',
                            padding: '48px 24px',
                            backgroundColor: '#f9fafb',
                            borderRadius: '12px',
                            border: '2px dashed #e5e7eb',
                        }}>
                            <UserGroupIcon style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 12px' }} />
                            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>
                                No hay nodos en el árbol.
                            </p>
                            <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                                Agrega usuarios para comenzar a construir la estructura.
                            </p>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            {tree.map((node) => (
                                <TreeNodeComponent
                                    key={node.id}
                                    node={node}
                                    level={0}
                                    onDelete={handleDeleteNode}
                                    userPhotos={userPhotos}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Lista de todos los nodos */}
                <div style={{
                    backgroundColor: '#fff',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    border: '1px solid #e5e7eb',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <UserGroupIcon style={{ width: '22px', height: '22px', color: '#fff' }} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
                                Todos los Miembros
                            </h2>
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '0.8rem' }}>
                                {nodes.length} miembro{nodes.length !== 1 ? 's' : ''} en la organización
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                        {nodes.length === 0 ? (
                            <div style={{
                                textAlign: 'center',
                                padding: '48px 24px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '12px',
                                border: '2px dashed #e5e7eb',
                            }}>
                                <UserIcon style={{ width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 12px' }} />
                                <p style={{ color: '#6b7280', margin: 0 }}>No hay miembros registrados.</p>
                            </div>
                        ) : (
                            nodes.map((node) => (
                                <div
                                    key={node.id}
                                    style={{
                                        padding: '14px 16px',
                                        backgroundColor: '#f9fafb',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        border: '1px solid #f3f4f6',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <UserAvatar
                                        name={node.userName}
                                        photoUrl={userPhotos[node.userId]}
                                        size="md"
                                        showBorder={true}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.95rem' }}>
                                            {node.userName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <BriefcaseIcon style={{ width: '12px', height: '12px' }} />
                                            {node.position} · {node.department}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px',
                                        backgroundColor: node.level === 0 ? '#dbeafe' : '#f0fdf4',
                                        color: node.level === 0 ? '#1d4ed8' : '#166534',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                    }}>
                    Nivel {node.level}
                  </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de agregar */}
            {showAddModal && (
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
                    backdropFilter: 'blur(4px)',
                }} onClick={() => setShowAddModal(false)}>
                    <div
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '16px',
                            padding: '28px',
                            width: '100%',
                            maxWidth: '480px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header del modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <PlusIcon style={{ width: '24px', height: '24px', color: '#fff' }} />
                                </div>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>
                                        Agregar al Árbol
                                    </h2>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>
                                        Asigna un usuario a la estructura
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    backgroundColor: '#f3f4f6',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <XMarkIcon style={{ width: '20px', height: '20px' }} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                                    Usuario *
                                </label>
                                <select
                                    value={newNode.userId}
                                    onChange={(e) => handleUserSelect(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="">Seleccionar usuario...</option>
                                    {availableUsers.map((user) => (
                                        <option key={user.username} value={user.username}>
                                            {user.preferredUsername || user.name || user.email} ({user.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                                    Cargo/Posición *
                                </label>
                                <input
                                    type="text"
                                    value={newNode.position}
                                    onChange={(e) => setNewNode({ ...newNode, position: e.target.value })}
                                    placeholder="Ej: Gerente de Proyectos"
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        boxSizing: 'border-box',
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                                    Departamento *
                                </label>
                                <select
                                    value={newNode.department}
                                    onChange={(e) => setNewNode({ ...newNode, department: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {DEPARTMENTS.map((dept) => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                                    Supervisor (Jefe directo)
                                </label>
                                <select
                                    value={newNode.supervisorId}
                                    onChange={(e) => setNewNode({ ...newNode, supervisorId: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #e5e7eb',
                                        fontSize: '0.95rem',
                                        backgroundColor: '#fff',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <option value="">Sin supervisor (nivel raíz)</option>
                                    {nodes.map((node) => (
                                        <option key={node.id} value={node.id}>
                                            {node.userName} - {node.position}
                                        </option>
                                    ))}
                                </select>
                                <p style={{ color: '#9ca3af', fontSize: '0.8rem', margin: '6px 0 0 0' }}>
                                    Si no seleccionas supervisor, este usuario será nivel raíz.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: '#f3f4f6',
                                        color: '#374151',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleAddNode}
                                    disabled={isSubmitting}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                        fontWeight: '600',
                                        fontSize: '0.95rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <ArrowPathIcon style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircleIcon style={{ width: '18px', height: '18px' }} />
                                            Agregar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Componente recursivo para mostrar el árbol
interface TreeNodeComponentProps {
    node: OrganizationNode & { children?: OrganizationNode[] };
    level: number;
    onDelete: (id: string, name: string) => void;
    userPhotos: Record<string, string | null>;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ node, level, onDelete, userPhotos }) => {
    const children = (node as OrganizationNode & { children?: OrganizationNode[] }).children || [];
    const hasChildren = children.length > 0;

    // Colores según nivel
    const levelColors = [
        { bg: '#dbeafe', border: '#3b82f6', text: '#1d4ed8' }, // Nivel 0 - Azul
        { bg: '#fef3c7', border: '#f59e0b', text: '#b45309' }, // Nivel 1 - Amarillo
        { bg: '#d1fae5', border: '#10b981', text: '#065f46' }, // Nivel 2 - Verde
        { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6' }, // Nivel 3 - Morado
        { bg: '#fce7f3', border: '#ec4899', text: '#9d174d' }, // Nivel 4 - Rosa
    ];
    const colorScheme = levelColors[Math.min(level, levelColors.length - 1)];

    return (
        <div style={{ marginLeft: level > 0 ? 28 : 0 }}>
            {/* Línea conectora */}
            {level > 0 && (
                <div style={{
                    position: 'relative',
                    marginLeft: '-14px',
                    marginBottom: '-8px',
                }}>
                    <ChevronRightIcon style={{
                        width: '14px',
                        height: '14px',
                        color: '#d1d5db',
                        position: 'absolute',
                        left: '-2px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                    }} />
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                backgroundColor: colorScheme.bg,
                borderRadius: '12px',
                marginBottom: '8px',
                borderLeft: `4px solid ${colorScheme.border}`,
                transition: 'all 0.2s',
            }}>
                <UserAvatar
                    name={node.userName}
                    photoUrl={userPhotos[node.userId]}
                    size="md"
                    showBorder={false}
                />

                <div style={{ flex: 1 }}>
                    <div style={{
                        fontWeight: '600',
                        color: '#1f2937',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        {node.userName}
                        {level === 0 && (
                            <span style={{
                                padding: '2px 6px',
                                backgroundColor: colorScheme.border,
                                color: '#fff',
                                borderRadius: '4px',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                            }}>
                CEO
              </span>
                        )}
                    </div>
                    <div style={{
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <BriefcaseIcon style={{ width: '12px', height: '12px' }} />
                        {node.position}
                    </div>
                </div>

                {hasChildren && (
                    <span style={{
                        padding: '3px 8px',
                        backgroundColor: 'rgba(0,0,0,0.08)',
                        color: '#6b7280',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600',
                    }}>
            {children.length} subordinado{children.length > 1 ? 's' : ''}
          </span>
                )}

                <button
                    onClick={() => onDelete(node.id, node.userName)}
                    style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    title="Eliminar del árbol"
                >
                    <TrashIcon style={{ width: '16px', height: '16px' }} />
                </button>
            </div>

            {children.map((child) => (
                <TreeNodeComponent
                    key={child.id}
                    node={child as OrganizationNode & { children?: OrganizationNode[] }}
                    level={level + 1}
                    onDelete={onDelete}
                    userPhotos={userPhotos}
                />
            ))}
        </div>
    );
};
