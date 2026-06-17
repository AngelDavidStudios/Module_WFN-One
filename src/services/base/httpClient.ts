import { AxiosError } from 'axios'
import type { AxiosRequestConfig } from 'axios'
import { api } from '../../api/client'
import type { ApiResponse } from './apiTypes'

/**
 * HttpClient — Facade sobre el cliente axios del BFF (Sistema C).
 *
 * A diferencia de la versión Amplify, NO inyecta tokens Bearer: la autenticación
 * viaja en la cookie de sesión de iron-session (api tiene withCredentials).
 * Cada instancia se ata a un `basePath` de dominio (p.ej. /vacation) que el
 * backend NestJS expondrá. El patrón `postAction(action, params)` se conserva
 * para no tocar la firma de los *Api.ts migrados.
 */
export interface HttpClientConfig {
  basePath: string
}

function extractError(error: unknown): string {
  if (error instanceof AxiosError) {
    if (error.response) {
      const data = error.response.data as { error?: string; message?: string }
      return data?.error || data?.message || `Error ${error.response.status}`
    }
    if (error.request) {
      return 'Error de conexión. Verifica tu internet.'
    }
    return error.message || 'Error desconocido'
  }
  return (error as Error)?.message || 'Error desconocido'
}

export class HttpClient {
  private basePath: string

  constructor(config: HttpClientConfig) {
    // Normaliza para evitar dobles slashes.
    this.basePath = config.basePath.replace(/\/$/, '')
  }

  private url(path = ''): string {
    return `${this.basePath}${path}`
  }

  /**
   * POST con acción (compatibilidad con los handlers tipo Lambda).
   * Envía { action, ...params } al basePath del dominio.
   */
  async postAction<T>(
    action: string,
    params: Record<string, unknown> = {},
  ): Promise<ApiResponse<T>> {
    try {
      const { data } = await api.post<T>(this.basePath, { action, ...params })
      return { data, success: true }
    } catch (error) {
      return { error: extractError(error), success: false }
    }
  }

  async post<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const res = await api.post<T>(this.url(path), data, config)
      return { data: res.data, success: true }
    } catch (error) {
      return { error: extractError(error), success: false }
    }
  }

  async get<T>(
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const res = await api.get<T>(this.url(path), config)
      return { data: res.data, success: true }
    } catch (error) {
      return { error: extractError(error), success: false }
    }
  }

  async put<T>(
    path: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const res = await api.put<T>(this.url(path), data, config)
      return { data: res.data, success: true }
    } catch (error) {
      return { error: extractError(error), success: false }
    }
  }

  async delete<T>(
    path: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse<T>> {
    try {
      const res = await api.delete<T>(this.url(path), config)
      return { data: res.data, success: true }
    } catch (error) {
      return { error: extractError(error), success: false }
    }
  }
}

// Factory para crear clientes HTTP
export const createHttpClient = (config: HttpClientConfig): HttpClient => {
  return new HttpClient(config)
}
