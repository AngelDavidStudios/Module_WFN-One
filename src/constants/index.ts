/**
 * Constantes de la aplicación
 * Centraliza valores que se usan en múltiples lugares
 */

// Colores del tema
export const COLORS = {
    primary: '#3b82f6',
    primaryDark: '#2563eb',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#0ea5e9',

    // Grises
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
} as const;

// Gradientes predefinidos
export const GRADIENTS = {
    primary: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    info: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
    purple: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
} as const;

// Tamaños de espaciado
export const SPACING = {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
} as const;

// Breakpoints para responsive
export const BREAKPOINTS = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
    name: 'WFN One',
    version: '1.0.0',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    sessionTimeout: 3600, // 1 hora en segundos
} as const;

// Roles del sistema
export const ROLES = {
    SUPER_ADMIN: 'super_admin',
    ADMIN: 'admin',
    USER: 'user',
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

// Estados de vacaciones
export const VACATION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
} as const;

export type VacationStatusType = typeof VACATION_STATUS[keyof typeof VACATION_STATUS];

// Tipos de acciones para auditoría
export const AUDIT_ACTIONS = {
    // Usuarios
    USER_CREATED: 'USER_CREATED',
    USER_DELETED: 'USER_DELETED',
    USER_UPDATED: 'USER_UPDATED',
    USER_ROLE_CHANGED: 'USER_ROLE_CHANGED',

    // Vacaciones
    VACATION_REQUESTED: 'VACATION_REQUESTED',
    VACATION_APPROVED: 'VACATION_APPROVED',
    VACATION_REJECTED: 'VACATION_REJECTED',
    VACATION_CANCELLED: 'VACATION_CANCELLED',

    // Organización
    ORG_NODE_CREATED: 'ORG_NODE_CREATED',
    ORG_NODE_DELETED: 'ORG_NODE_DELETED',
    ORG_NODE_UPDATED: 'ORG_NODE_UPDATED',
} as const;

export type AuditActionType = typeof AUDIT_ACTIONS[keyof typeof AUDIT_ACTIONS];
