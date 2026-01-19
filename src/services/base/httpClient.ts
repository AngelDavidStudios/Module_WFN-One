import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { ApiResponse } from './apiTypes';

export interface HttpClientConfig {
    baseUrl: string;
    timeout?: number;
    withAuth?: boolean;
}

/**
 * Clase HttpClient - Facade para todas las operaciones HTTP
 * Single Responsibility: Solo maneja comunicación HTTP
 */
export class HttpClient {
    private client: AxiosInstance;
    private withAuth: boolean;

    constructor(config: HttpClientConfig) {
        this.withAuth = config.withAuth ?? true;

        this.client = axios.create({
            baseURL: config.baseUrl,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Interceptor para agregar token de autenticación
        this.client.interceptors.request.use(async (axiosConfig) => {
            if (this.withAuth) {
                const token = await this.getAuthToken();
                if (token) {
                    axiosConfig.headers.Authorization = `Bearer ${token}`;
                }
            }
            return axiosConfig;
        });

        // Interceptor para manejo de errores
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                return Promise.reject(this.handleError(error));
            }
        );
    }

    private async getAuthToken(): Promise<string> {
        try {
            const session = await fetchAuthSession();
            return session.tokens?.accessToken?.toString() || '';
        } catch {
            return '';
        }
    }

    private handleError(error: AxiosError): Error {
        if (error.response) {
            // Error de respuesta del servidor
            const data = error.response.data as { error?: string; message?: string };
            return new Error(data.error || data.message || `Error ${error.response.status}`);
        } else if (error.request) {
            // Error de red
            return new Error('Error de conexión. Verifica tu internet.');
        }
        return new Error(error.message || 'Error desconocido');
    }

    /**
     * Realiza una petición POST con acción (para APIs Lambda)
     */
    async postAction<T>(action: string, params: Record<string, unknown> = {}): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post<T>('', { action, ...params });
            return { data: response.data, success: true };
        } catch (error) {
            return { error: (error as Error).message, success: false };
        }
    }

    /**
     * Realiza una petición POST estándar
     */
    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.post<T>(url, data, config);
            return { data: response.data, success: true };
        } catch (error) {
            return { error: (error as Error).message, success: false };
        }
    }

    /**
     * Realiza una petición GET
     */
    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.get<T>(url, config);
            return { data: response.data, success: true };
        } catch (error) {
            return { error: (error as Error).message, success: false };
        }
    }

    /**
     * Realiza una petición PUT
     */
    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.put<T>(url, data, config);
            return { data: response.data, success: true };
        } catch (error) {
            return { error: (error as Error).message, success: false };
        }
    }

    /**
     * Realiza una petición DELETE
     */
    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
        try {
            const response = await this.client.delete<T>(url, config);
            return { data: response.data, success: true };
        } catch (error) {
            return { error: (error as Error).message, success: false };
        }
    }
}

// Factory para crear clientes HTTP
export const createHttpClient = (config: HttpClientConfig): HttpClient => {
    return new HttpClient(config);
};
