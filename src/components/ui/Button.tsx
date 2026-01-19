import React from 'react';

export interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ReactNode;
    loading?: boolean;
    type?: 'button' | 'submit' | 'reset';
    title?: string;
}

const variantStyles: Record<string, React.CSSProperties> = {
    primary: { backgroundColor: '#3b82f6', color: '#fff' },
    secondary: { backgroundColor: '#f3f4f6', color: '#374151' },
    danger: { backgroundColor: '#ef4444', color: '#fff' },
    success: { backgroundColor: '#10b981', color: '#fff' },
    ghost: { backgroundColor: 'transparent', color: '#6b7280' },
};

const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px', fontSize: '0.8rem' },
    md: { padding: '10px 18px', fontSize: '0.9rem' },
    lg: { padding: '14px 24px', fontSize: '1rem' },
};

export const Button: React.FC<ButtonProps> = ({
                                                  children,
                                                  onClick,
                                                  disabled = false,
                                                  variant = 'primary',
                                                  size = 'md',
                                                  fullWidth = false,
                                                  icon,
                                                  loading = false,
                                                  type = 'button',
                                                  title,
                                              }) => {
    const isDisabled = disabled || loading;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            title={title}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                opacity: isDisabled ? 0.6 : 1,
                transition: 'all 0.2s ease',
                width: fullWidth ? '100%' : 'auto',
                ...variantStyles[variant],
                ...sizeStyles[size],
            }}
        >
            {loading && <LoadingSpinner size={16} />}
            {!loading && icon}
            {children}
        </button>
    );
};

const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 16 }) => (
    <span style={{
        width: size,
        height: size,
        border: '2px solid currentColor',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        display: 'inline-block',
    }} />
);
