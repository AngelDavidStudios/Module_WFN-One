import axios, { AxiosError } from 'axios'

// Base del BFF (Sistema C). Si VITE_API_URL está definida (p.ej. la URL del
// Lambda) se llama directo cross-origin; si no, se usa el proxy local
// `/api` → :3000 definido en vite.config.ts.
export const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  // X-System identifica a este SPA como Sistema A ante el BFF (Sistema C).
  headers: { 'Content-Type': 'application/json', 'X-System': 'A' },
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // El store de sesión escucha este evento para limpiarse.
      window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    }
    return Promise.reject(error)
  },
)
