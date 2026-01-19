import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    onClose?: () => void;
}

const alertStyles: Record<string, { bg: string; border: string; color: string; icon: React.ReactNode }> = {
    success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', icon: <CheckCircleIcon style={{ width: 20, height: 20 }} /> },
    error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: <XCircleIcon style={{ width: 20, height: 20 }} /> },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e', icon: <ExclamationTriangleIcon style={{ width: 20, height: 20 }} /> },
    info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af', icon: <InformationCircleIcon style={{ width: 20, height: 20 }} /> },
};

export const Alert: React.FC<AlertProps> = ({ type, message, onClose }) => {
    const styles = alertStyles[type];
    return (
        <div style={{
            padding: '14px 18px', borderRadius: '10px',
            backgroundColor: styles.bg, border: `1px solid ${styles.border}`,
            color: styles.color, display: 'flex', alignItems: 'center', gap: '10px',
        }}>
            {styles.icon}
            <span style={{ flex: 1 }}>{message}</span>
            {onClose && (
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    ✕
                </button>
            )}
        </div>
    );
};
