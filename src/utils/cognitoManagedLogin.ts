/**
 * Utilidades para integración con Cognito Managed Login
 *
 * El dominio de Cognito Managed Login permite usar una UI personalizada
 * para el inicio de sesión sin necesidad de implementar formularios propios.
 */

import { signInWithRedirect, signOut } from 'aws-amplify/auth';

/**
 * Redirige al usuario a la página de login de Cognito Managed Login
 * usando signInWithRedirect de Amplify
 */
export const redirectToManagedLogin = async (): Promise<void> => {
    try {
        await signInWithRedirect();
    } catch (error) {
        console.error('Error redirecting to login:', error);
    }
};

/**
 * Cierra la sesión del usuario y redirige al logout de Cognito
 */
export const logoutFromManagedLogin = async (): Promise<void> => {
    try {
        await signOut({ global: true });
    } catch (error) {
        console.error('Error signing out:', error);
    }
};

/**
 * Obtiene la URL del dominio de Cognito desde variables de entorno
 */
export const getCognitoDomainUrl = (): string => {
    const domain = import.meta.env.VITE_COGNITO_DOMAIN || 'adstudios.auth.us-east-1.amazoncognito.com';
    return `https://${domain}`;
};
