import { APP_CONFIG } from '../constants';

export interface ValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateEmail = (email: string): ValidationResult => {
    if (!email) return { isValid: false, error: 'El email es requerido' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { isValid: false, error: 'Formato de email inválido' };
    return { isValid: true };
};

export const validatePassword = (password: string): ValidationResult => {
    if (!password) return { isValid: false, error: 'La contraseña es requerida' };
    if (password.length < 8) return { isValid: false, error: 'La contraseña debe tener al menos 8 caracteres' };
    return { isValid: true };
};

export const validateRequired = (value: string, fieldName: string): ValidationResult => {
    if (!value || !value.trim()) return { isValid: false, error: `${fieldName} es requerido` };
    return { isValid: true };
};

export const validateFile = (file: File): ValidationResult => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
        return { isValid: false, error: 'Tipo de archivo no permitido. Solo JPG, PNG, GIF, WEBP' };
    }
    if (file.size > APP_CONFIG.maxFileSize) {
        return { isValid: false, error: 'El archivo es muy grande. Máximo 5MB' };
    }
    return { isValid: true };
};

export const validateDateRange = (startDate: string, endDate: string): ValidationResult => {
    if (!startDate || !endDate) return { isValid: false, error: 'Las fechas son requeridas' };
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > end) return { isValid: false, error: 'La fecha de inicio no puede ser mayor a la final' };
    return { isValid: true };
};
