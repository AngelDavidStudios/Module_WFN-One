import React from 'react';

export interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
    return (
        <div style={{
            textAlign: 'center', padding: '48px 24px',
            backgroundColor: '#f9fafb', borderRadius: '12px',
            border: '2px dashed #e5e7eb',
        }}>
            <div style={{ marginBottom: '12px', color: '#9ca3af' }}>{icon}</div>
            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem', fontWeight: '500' }}>{title}</p>
            {description && <p style={{ color: '#9ca3af', margin: '4px 0 0 0', fontSize: '0.85rem' }}>{description}</p>}
            {action && <div style={{ marginTop: '16px' }}>{action}</div>}
        </div>
    );
};
