import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    text?: string;
}

const sizeMap = { sm: 20, md: 32, lg: 48 };

export const Spinner: React.FC<SpinnerProps> = ({
                                                    size = 'md',
                                                    color = '#3b82f6',
                                                    text,
                                                }) => {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '12px'
        }}>
            <ArrowPathIcon style={{
                width: sizeMap[size], height: sizeMap[size], color,
                animation: 'spin 1s linear infinite',
            }} />
            {text && <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>{text}</span>}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
