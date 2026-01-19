import React from 'react';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
}

const variantStyles: Record<string, { bg: string; color: string }> = {
    default: { bg: '#f3f4f6', color: '#374151' },
    primary: { bg: '#dbeafe', color: '#1d4ed8' },
    success: { bg: '#dcfce7', color: '#166534' },
    warning: { bg: '#fef3c7', color: '#b45309' },
    danger: { bg: '#fee2e2', color: '#dc2626' },
    info: { bg: '#e0e7ff', color: '#4338ca' },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
    const styles = variantStyles[variant];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center',
            padding: size === 'sm' ? '2px 8px' : '4px 12px',
            backgroundColor: styles.bg, color: styles.color,
            borderRadius: '20px',
            fontSize: size === 'sm' ? '0.75rem' : '0.85rem',
            fontWeight: '600',
        }}>
      {children}
    </span>
    );
};
