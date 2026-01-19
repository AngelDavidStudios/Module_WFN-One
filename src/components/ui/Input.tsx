import React from 'react';

export interface InputProps {
    label?: string;
    type?: 'text' | 'email' | 'password' | 'number';
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    error?: string;
    hint?: string;
}

export const Input: React.FC<InputProps> = ({
                                                label, type = 'text', value, onChange, placeholder,
                                                required = false, disabled = false, error, hint,
                                            }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
            )}
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: `1px solid ${error ? '#fca5a5' : '#e5e7eb'}`,
                    fontSize: '0.95rem', boxSizing: 'border-box',
                    backgroundColor: disabled ? '#f9fafb' : '#fff',
                    outline: 'none',
                }}
            />
            {hint && !error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>{hint}</p>}
            {error && <p style={{ margin: 0, fontSize: '0.8rem', color: '#dc2626' }}>{error}</p>}
        </div>
    );
};
