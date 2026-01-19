import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { logoutFromManagedLogin } from '../utils';
import { getProfilePictureUrl } from '../services';
import { UserAvatar } from './ui';
import {
    HomeIcon,
    ChartBarIcon,
    CalendarDaysIcon,
    CheckCircleIcon,
    BuildingOffice2Icon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    UsersIcon,
    Cog6ToothIcon,
    ArrowRightOnRectangleIcon,
    ChevronDownIcon,
    UserGroupIcon,
    ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import {
    HomeIcon as HomeIconSolid,
    ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/react/24/solid';

interface NavigationProps {
    onSignOut?: () => void;
}

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    iconActive?: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick?: () => void;
}

interface DropdownItem {
    to: string;
    icon: React.ReactNode;
    label: string;
}

interface NavDropdownProps {
    icon: React.ReactNode;
    label: string;
    items: DropdownItem[];
    isActiveGroup: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, iconActive, label, isActive, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            textDecoration: 'none',
            color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.8)' : 'transparent',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            fontWeight: isActive ? '600' : '500',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
            if (!isActive) {
                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.color = '#fff';
            }
        }}
        onMouseLeave={(e) => {
            if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
            }
        }}
    >
    <span style={{ width: '18px', height: '18px', flexShrink: 0 }}>
      {isActive && iconActive ? iconActive : icon}
    </span>
        <span>{label}</span>
    </Link>
);

const NavDropdown: React.FC<NavDropdownProps> = ({ icon, label, items, isActiveGroup }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isItemActive = (path: string) => location.pathname === path;

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: isActiveGroup ? 'rgba(59, 130, 246, 0.8)' : 'transparent',
                    color: isActiveGroup ? '#fff' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: isActiveGroup ? '600' : '500',
                    fontSize: '0.85rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                    if (!isActiveGroup) {
                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                        e.currentTarget.style.color = '#fff';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActiveGroup && !isOpen) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                    }
                }}
            >
                <span style={{ width: '18px', height: '18px', flexShrink: 0 }}>{icon}</span>
                <span>{label}</span>
                <ChevronDownIcon
                    style={{
                        width: '14px',
                        height: '14px',
                        transition: 'transform 0.2s ease',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: '0',
                    marginTop: '4px',
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    minWidth: '180px',
                    zIndex: 1001,
                    overflow: 'hidden',
                }}>
                    {items.map((item, index) => (
                        <Link
                            key={index}
                            to={item.to}
                            onClick={() => setIsOpen(false)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '10px 14px',
                                textDecoration: 'none',
                                color: isItemActive(item.to) ? '#3b82f6' : 'rgba(255,255,255,0.8)',
                                backgroundColor: isItemActive(item.to) ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                borderLeft: isItemActive(item.to) ? '3px solid #3b82f6' : '3px solid transparent',
                                transition: 'all 0.2s ease',
                                fontSize: '0.85rem',
                                fontWeight: isItemActive(item.to) ? '600' : '400',
                            }}
                            onMouseEnter={(e) => {
                                if (!isItemActive(item.to)) {
                                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isItemActive(item.to)) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                }
                            }}
                        >
                            <span style={{ width: '18px', height: '18px', flexShrink: 0 }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export const Navigation: React.FC<NavigationProps> = ({ onSignOut }) => {
    const { roles, isAdmin, isSuperAdmin, permissions, username, email, userId } = useAuth();
    const location = useLocation();
    const [profilePicture, setProfilePicture] = useState<string | null>(null);

    const isActive = (path: string) => location.pathname === path;
    const displayName = username || email?.split('@')[0] || 'Usuario';

    // Cargar foto de perfil
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

    // Verificar si alguna ruta del grupo está activa
    const isEmpleadoGroupActive = isActive('/vacations') || isActive('/approvals');
    const isSistemaGroupActive = isActive('/super-admin') || isActive('/audit') || isActive('/users');

    // Items del dropdown Empleado
    const empleadoItems: DropdownItem[] = [];
    if (permissions.canCreateVacationRequest) {
        empleadoItems.push({
            to: '/vacations',
            icon: <CalendarDaysIcon style={{ width: '18px', height: '18px' }} />,
            label: 'Mis Vacaciones',
        });
    }
    if (permissions.canApproveVacationRequests) {
        empleadoItems.push({
            to: '/approvals',
            icon: <CheckCircleIcon style={{ width: '18px', height: '18px' }} />,
            label: 'Aprobaciones',
        });
    }

    // Items del dropdown Sistema (solo Super Admin)
    const sistemaItems: DropdownItem[] = [];
    if (isSuperAdmin) {
        sistemaItems.push({
            to: '/super-admin',
            icon: <ShieldCheckIcon style={{ width: '18px', height: '18px' }} />,
            label: 'Admin',
        });
        sistemaItems.push({
            to: '/audit',
            icon: <ClipboardDocumentListIcon style={{ width: '18px', height: '18px' }} />,
            label: 'Auditoría',
        });
    }
    if (permissions.canManageUsers) {
        sistemaItems.push({
            to: '/users',
            icon: <UsersIcon style={{ width: '18px', height: '18px' }} />,
            label: 'Usuarios',
        });
    }

    // Handler para cerrar sesión con Managed Login
    const handleSignOut = async () => {
        if (onSignOut) {
            await onSignOut();
        }
        await logoutFromManagedLogin();
    };

    const getRoleBadgeStyle = (): React.CSSProperties => {
        if (isSuperAdmin) {
            return { backgroundColor: '#ef4444', color: '#fff' };
        }
        if (isAdmin) {
            return { backgroundColor: '#f59e0b', color: '#fff' };
        }
        return { backgroundColor: '#10b981', color: '#fff' };
    };

    return (
        <nav style={{
            backgroundColor: '#0f172a',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 16px',
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '64px',
                    gap: '0.2rem',
                }}>
                    {/* Logo */}
                    <Link to="/" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textDecoration: 'none',
                        flexShrink: 0,
                    }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <CalendarDaysIcon style={{ width: '20px', height: '20px', color: '#fff' }} />
                        </div>
                        <span style={{
                            color: '#fff',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            letterSpacing: '-0.5px',
                            whiteSpace: 'nowrap',
                        }}>
              WFN One
            </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        flex: 1,
                        justifyContent: 'center',
                        margin: '0 0.5rem',
                    }}>
                        {/* Inicio - Principal */}
                        <NavLink
                            to="/"
                            icon={<HomeIcon style={{ width: '18px', height: '18px' }} />}
                            iconActive={<HomeIconSolid style={{ width: '18px', height: '18px' }} />}
                            label="Inicio"
                            isActive={isActive('/')}
                        />

                        {/* Dashboard - Principal */}
                        <NavLink
                            to="/dashboard"
                            icon={<ChartBarIcon style={{ width: '18px', height: '18px' }} />}
                            iconActive={<ChartBarIconSolid style={{ width: '18px', height: '18px' }} />}
                            label="Dashboard"
                            isActive={isActive('/dashboard')}
                        />

                        {/* Empleado - Dropdown (Vacaciones + Aprobaciones) */}
                        {empleadoItems.length > 0 && (
                            <NavDropdown
                                icon={<UserGroupIcon style={{ width: '18px', height: '18px' }} />}
                                label="Empleado"
                                items={empleadoItems}
                                isActiveGroup={isEmpleadoGroupActive}
                            />
                        )}

                        {/* Organización - Principal (Solo Super Admin) */}
                        {isSuperAdmin && (
                            <NavLink
                                to="/organization"
                                icon={<BuildingOffice2Icon style={{ width: '18px', height: '18px' }} />}
                                label="Organización"
                                isActive={isActive('/organization')}
                            />
                        )}

                        {/* Sistema - Dropdown (Admin + Auditoría + Usuarios) */}
                        {sistemaItems.length > 0 && (
                            <NavDropdown
                                icon={<ComputerDesktopIcon style={{ width: '18px', height: '18px' }} />}
                                label="Sistema"
                                items={sistemaItems}
                                isActiveGroup={isSistemaGroupActive}
                            />
                        )}
                    </div>

                    {/* Right Section - User Menu */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem',
                        flexShrink: 0,
                    }}>
                        {/* User Info */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            borderRadius: '10px',
                        }}>
                            <UserAvatar
                                name={displayName}
                                photoUrl={profilePicture}
                                size="sm"
                                showBorder={true}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    lineHeight: '1.2',
                    whiteSpace: 'nowrap',
                }}>
                  {displayName}
                </span>
                                <span style={{
                                    ...getRoleBadgeStyle(),
                                    padding: '1px 6px',
                                    borderRadius: '8px',
                                    fontSize: '0.6rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    whiteSpace: 'nowrap',
                                }}>
                  {roles[0] || 'user'}
                </span>
                            </div>
                        </div>

                        {/* Settings Button */}
                        <Link
                            to="/profile"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '36px',
                                height: '36px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'rgba(255,255,255,0.7)',
                                textDecoration: 'none',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                            }}
                        >
                            <Cog6ToothIcon style={{ width: '18px', height: '18px' }} />
                        </Link>

                        {/* Logout Button */}
                        <button
                            onClick={handleSignOut}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                backgroundColor: '#ef4444',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                transition: 'all 0.2s ease',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#dc2626';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#ef4444';
                            }}
                        >
                            <ArrowRightOnRectangleIcon style={{ width: '16px', height: '16px' }} />
                            <span>Salir</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};
