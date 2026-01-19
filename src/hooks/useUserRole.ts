import { useState, useEffect } from 'react';
import { fetchAuthSession, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import { type UserRole } from '../types/auth';

interface UseUserRoleReturn {
    roles: UserRole[];
    isLoading: boolean;
    error: Error | null;
    hasRole: (role: UserRole) => boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    username: string | null;
    email: string | null;
    userId: string | null;
}

export const useUserRole = (): UseUserRoleReturn => {
    const [roles, setRoles] = useState<UserRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchUserRoles = async (retryCount = 0) => {
        try {
            setIsLoading(true);
            setError(null);

            const session = await fetchAuthSession();

            if (!session.tokens?.accessToken) {
                setRoles([]);
                setUsername(null);
                setEmail(null);
                setUserId(null);
                setIsLoading(false);
                return;
            }

            // Obtener información del usuario desde el token (más confiable que fetchUserAttributes)
            const accessToken = session.tokens.accessToken;
            const idToken = session.tokens.idToken;

            // Obtener userId del token
            const sub = accessToken.payload.sub as string;
            setUserId(sub || null);

            // Obtener username y email del ID token si está disponible
            let userEmail: string | null = null;
            let userName: string | null = null;

            if (idToken?.payload) {
                userEmail = idToken.payload.email as string || null;
                userName = (idToken.payload.preferred_username as string) ||
                    (idToken.payload.name as string) ||
                    (idToken.payload['cognito:username'] as string) ||
                    null;
            }

            // Si no tenemos email del ID token, intentar con fetchUserAttributes
            if (!userEmail) {
                try {
                    const userAttributes = await fetchUserAttributes();
                    userEmail = userAttributes.email || null;
                    userName = userAttributes.preferred_username ||
                        userAttributes.name ||
                        userName ||
                        null;
                } catch (attrError) {
                    console.log('Could not fetch user attributes, using token data:', attrError);
                    // Usar datos del token como fallback
                    const cognitoUsername = accessToken.payload['cognito:username'] as string;
                    userName = userName || cognitoUsername || userEmail?.split('@')[0] || null;
                }
            }

            setEmail(userEmail);
            setUsername(userName || userEmail?.split('@')[0] || null);

            // Los grupos están en el token de acceso
            const groups = accessToken.payload['cognito:groups'] as string[] | undefined;

            if (groups && Array.isArray(groups)) {
                // Filtrar solo los roles válidos
                const validRoles = groups.filter(
                    (group): group is UserRole =>
                        ['super_admin', 'admin', 'user'].includes(group)
                );
                setRoles(validRoles);
            } else {
                // Si no tiene grupos, asignar rol de usuario por defecto
                setRoles(['user']);
            }
        } catch (err) {
            console.error('Error fetching user roles:', err);

            // Reintentar hasta 2 veces con delay
            if (retryCount < 2) {
                console.log(`Retrying fetchUserRoles (attempt ${retryCount + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                return fetchUserRoles(retryCount + 1);
            }

            setError(err instanceof Error ? err : new Error('Error fetching user roles'));
            setRoles([]);
            setUsername(null);
            setEmail(null);
            setUserId(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Esperar un momento antes de verificar para asegurar que Amplify procesó el OAuth
        const timer = setTimeout(() => {
            fetchUserRoles();
        }, 100);

        // Escuchar eventos de autenticación
        const hubListener = Hub.listen('auth', ({ payload }) => {
            switch (payload.event) {
                case 'signedIn':
                case 'tokenRefresh':
                case 'signInWithRedirect':
                    // Esperar un momento después del evento
                    setTimeout(() => fetchUserRoles(), 500);
                    break;
                case 'signedOut':
                    setRoles([]);
                    setUsername(null);
                    setEmail(null);
                    setUserId(null);
                    break;
            }
        });

        return () => {
            clearTimeout(timer);
            hubListener();
        };
    }, []);

    const hasRole = (role: UserRole): boolean => {
        // super_admin tiene todos los roles
        if (roles.includes('super_admin')) return true;
        // admin tiene acceso a admin y user
        if (role === 'user' && roles.includes('admin')) return true;
        return roles.includes(role);
    };

    return {
        roles,
        isLoading,
        error,
        hasRole,
        isAdmin: roles.includes('admin') || roles.includes('super_admin'),
        isSuperAdmin: roles.includes('super_admin'),
        username,
        email,
        userId,
    };
};
