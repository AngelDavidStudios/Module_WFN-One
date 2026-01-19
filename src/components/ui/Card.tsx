import React from 'react';

export interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBg?: string;
    padding?: 'sm' | 'md' | 'lg';
    className?: string;
}

const paddingStyles = {
    sm: '16px',
    md: '24px',
    lg: '32px',
};

export const Card: React.FC<CardProps> = ({
                                              children,
                                              title,
                                              subtitle,
                                              icon,
                                              iconBg = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                              padding = 'md',
                                          }) => {
    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: paddingStyles[padding],
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
        }}>
            {(title || icon) && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '20px'
                }}>
                    {icon && (
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {icon}
                        </div>
                    )}
                    <div>
                        {title && (
                            <h3 style={{
                                margin: 0,
                                color: '#1f2937',
                                fontSize: '1.1rem',
                                fontWeight: '600'
                            }}>
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p style={{
                                margin: 0,
                                color: '#6b7280',
                                fontSize: '0.8rem'
                            }}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
};
