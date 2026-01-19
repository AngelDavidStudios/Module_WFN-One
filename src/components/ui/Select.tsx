import React from 'react';

export interface SelectOption {
    value: string;
    label: string;
}

export interface SelectProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    hint?: string;
}

export const Select: React.FC<SelectProps> = ({
                                                  label, value, onChange, options, placeholder,
                                                  required = false, disabled = false, hint,
                                              }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {label && (
                <label style={{ fontWeight: '600', color: '#374151', fontSize: '0.9rem' }}>
                    {label} {required && <span style={{ color: '#dc2626' }}>*</span>}
                </label>
            )}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1px solid #e5e7eb', fontSize: '0.95rem',
                    backgroundColor: disabled ? '#f9fafb' : '#fff',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
            >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {hint && <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>{hint}</p>}
        </div>
    );
};
