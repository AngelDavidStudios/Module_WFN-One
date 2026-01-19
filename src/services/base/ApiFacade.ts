import outputs from '../../../amplify_outputs.json';
import { HttpClient, createHttpClient } from './httpClient';

// Tipos de outputs de Amplify
interface AmplifyCustomOutputs {
    userManagementApiUrl?: string;
    organizationTreeApiUrl?: string;
    vacationManagementApiUrl?: string;
    cognitoDomain?: string;
}

/**
 * Obtiene las URLs de las APIs desde amplify_outputs.json
 */
const getApiUrls = (): AmplifyCustomOutputs => {
    const customOutputs = (outputs as { custom?: AmplifyCustomOutputs }).custom;
    return customOutputs || {};
};

/**
 * Cache de clientes HTTP para reutilización
 */
const clientCache: Map<string, HttpClient> = new Map();

/**
 * Obtiene o crea un cliente HTTP para una URL específica
 */
const getClient = (url: string): HttpClient => {
    if (!url) {
        throw new Error('API URL not configured. Run `npx ampx sandbox` to deploy the backend.');
    }

    if (!clientCache.has(url)) {
        clientCache.set(url, createHttpClient({ baseUrl: url }));
    }

    return clientCache.get(url)!;
};

/**
 * API Facade - Interfaz unificada para todas las APIs
 */
export const ApiFacade = {
    /**
     * Cliente para API de gestión de usuarios
     */
    get userManagement(): HttpClient {
        const urls = getApiUrls();
        return getClient(urls.userManagementApiUrl || '');
    },

    /**
     * Cliente para API de árbol organizacional
     */
    get organization(): HttpClient {
        const urls = getApiUrls();
        return getClient(urls.organizationTreeApiUrl || '');
    },

    /**
     * Cliente para API de vacaciones
     */
    get vacation(): HttpClient {
        const urls = getApiUrls();
        return getClient(urls.vacationManagementApiUrl || '');
    },

    /**
     * Obtiene el dominio de Cognito configurado
     */
    getCognitoDomain(): string {
        const urls = getApiUrls();
        return urls.cognitoDomain || '';
    },

    /**
     * Verifica si todas las APIs están configuradas
     */
    isConfigured(): boolean {
        const urls = getApiUrls();
        return !!(
            urls.userManagementApiUrl &&
            urls.organizationTreeApiUrl &&
            urls.vacationManagementApiUrl
        );
    },

    /**
     * Limpia la cache de clientes (útil para testing)
     */
    clearCache(): void {
        clientCache.clear();
    },
};

export default ApiFacade;
