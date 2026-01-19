import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    iconBg?: string;
    children: React.ReactNode;
    maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
                                                isOpen, onClose, title, subtitle, icon,
                                                iconBg = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                                children, maxWidth = '480px',
                                            }) => {
    if (!isOpen) return null;

    return (
        <div onClick={onClose} style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 1000, backdropFilter: 'blur(4px)',
        }}>
            <div onClick={(e) => e.stopPropagation()} style={{
                backgroundColor: '#fff', borderRadius: '16px', padding: '28px',
                width: '100%', maxWidth, boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                maxHeight: '90vh', overflowY: 'auto',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {icon && (
                            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {icon}
                            </div>
                        )}
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1f2937' }}>{title}</h2>
                            {subtitle && <p style={{ margin: 0, fontSize: '0.85rem', color: '#6b7280' }}>{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                        backgroundColor: '#f3f4f6', color: '#6b7280', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <XMarkIcon style={{ width: '20px', height: '20px' }} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};
