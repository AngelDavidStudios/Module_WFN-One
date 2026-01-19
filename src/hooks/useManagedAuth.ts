/**
 * Hook para manejar la autenticación con Cognito Managed Login
 */

import { useState, useEffect, useCallback } from 'react';
import {
    fetchAuthSession,
    signOut as amplifySignOut,
    getCurrentUser,
} from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

interface AuthState {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: {
        userId: string;
        username: string;
    } | null;
}

export function useManagedAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        isAuthenticated: false,
        isLoading: true,
        user: null,
    });

    const checkAuth = useCallback(async () => {
        try {
            const session = await fetchAuthSession();

            if (session.tokens) {
                const user = await getCurrentUser();
                setAuthState({
                    isAuthenticated: true,
                    isLoading: false,
                    user: {
                        userId: user.userId,
                        username: user.username,
                    },
                });

                // Limpiar el código de la URL si existe
                const url = new URL(window.location.href);
                if (url.searchParams.has('code')) {
                    url.searchParams.delete('code');
                    window.history.replaceState({}, '', url.pathname);
                }
            } else {
                setAuthState({
                    isAuthenticated: false,
                    isLoading: false,
                    user: null,
                });
            }
        } catch (error) {
            console.log('No authenticated user:', error);
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
            });
        }
    }, []);

    useEffect(() => {
        // Manejar el callback de OAuth (cuando hay código en la URL)
        const handleOAuthCallback = async () => {
            const url = new URL(window.location.href);
            const code = url.searchParams.get('code');

            if (code) {
                // Hay un código de autorización, Amplify lo procesará automáticamente
                // Solo necesitamos esperar y verificar la autenticación
                console.log('OAuth code detected, processing...');

                // Esperar un momento para que Amplify procese el código
                await new Promise(resolve => setTimeout(resolve, 500));

                // Verificar si ya estamos autenticados
                await checkAuth();
            } else {
                // No hay código, verificar autenticación normal
                await checkAuth();
            }
        };

        handleOAuthCallback();

        // Escuchar eventos de autenticación
        const hubListener = Hub.listen('auth', ({ payload }) => {
            console.log('Auth event:', payload.event);
            switch (payload.event) {
                case 'signInWithRedirect':
                    checkAuth();
                    break;
                case 'signedIn':
                    checkAuth();
                    break;
                case 'signedOut':
                    setAuthState({
                        isAuthenticated: false,
                        isLoading: false,
                        user: null,
                    });
                    break;
                case 'tokenRefresh':
                    checkAuth();
                    break;
                case 'customOAuthState':
                    console.log('Custom OAuth state:', payload.data);
                    break;
            }
        });

        return () => hubListener();
    }, [checkAuth]);

    const signOut = useCallback(async () => {
        try {
            await amplifySignOut();
            setAuthState({
                isAuthenticated: false,
                isLoading: false,
                user: null,
            });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    }, []);

    return {
        ...authState,
        signOut,
        checkAuth,
    };
}
