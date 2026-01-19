import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface UserAvatarProps {
    name?: string;
    photoUrl?: string | null;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
    showBorder?: boolean;
}

// Colores de fondo para las iniciales basados en la primera letra
const getAvatarColor = (name: string): string => {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // A-B
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // C-D
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // E-F
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // G-H
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // I-J
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // K-L
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // M-N
        'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // O-P
        'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Q-R
        'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)', // S-T
        'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', // U-V
        'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)', // W-X
        'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', // Y-Z
    ];

    const firstChar = name.charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);

    if (charCode >= 65 && charCode <= 90) { // A-Z
        const index = Math.floor((charCode - 65) / 2);
        return colors[Math.min(index, colors.length - 1)];
    }

    return 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
};

// Obtener las iniciales del nombre
const getInitials = (name: string): string => {
    if (!name) return '?';

    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }

    // Tomar primera letra del primer y último nombre
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// Tamaños del avatar
const sizes = {
    sm: { container: 32, font: '0.75rem', icon: 20 },
    md: { container: 40, font: '0.875rem', icon: 24 },
    lg: { container: 48, font: '1rem', icon: 28 },
    xl: { container: 80, font: '1.5rem', icon: 50 },
    xxl: { container: 140, font: '2.5rem', icon: 80 },
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
                                                          name = '',
                                                          photoUrl,
                                                          size = 'md',
                                                          showBorder = true,
                                                      }) => {
    const sizeConfig = sizes[size];
    const initials = getInitials(name);
    const bgColor = getAvatarColor(name);

    return (
        <div
            style={{
                width: `${sizeConfig.container}px`,
                height: `${sizeConfig.container}px`,
                borderRadius: '50%',
                background: photoUrl
                    ? `url(${photoUrl}) center/cover no-repeat`
                    : bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: showBorder ? '2px solid rgba(255,255,255,0.3)' : 'none',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}
        >
            {!photoUrl && (
                name ? (
                    <span
                        style={{
                            color: '#fff',
                            fontSize: sizeConfig.font,
                            fontWeight: '700',
                            textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                            userSelect: 'none',
                        }}
                    >
            {initials}
          </span>
                ) : (
                    <UserCircleIcon
                        style={{
                            width: `${sizeConfig.icon}px`,
                            height: `${sizeConfig.icon}px`,
                            color: '#fff',
                        }}
                    />
                )
            )}
        </div>
    );
};
