import { computed } from 'vue'
import { useSessionStore } from '../stores/session'
import {
  rolePermissions,
  hasAccess,
  type UserRole,
  type RolePermissions,
} from '../types/auth'

/**
 * Equivalente Vue del `useAuth()` de React (que combinaba AuthContext +
 * useUserRole). Lee del store de sesión Pinia y expone roles/permisos.
 */
export function useAuth() {
  const session = useSessionStore()

  const roles = computed<UserRole[]>(() => session.roles)
  const isAdmin = computed(() => session.isAdmin)
  const isSuperAdmin = computed(() => session.isSuperAdmin)
  const username = computed(() => session.user?.username ?? null)
  // Nombre legible del usuario (claim `name`). Se prefiere al `username` para
  // mostrar en UI: el username de un federado es `google_1128992…`.
  const name = computed(() => session.user?.name ?? null)
  const email = computed(() => session.user?.email ?? null)
  // Identidad canónica del módulo de vacaciones = Cognito username (no `sub`):
  // es el mismo id con el que las vistas de admin guardan balances
  // (`setBalance`) y nodos del árbol (`createNode`). Unificar aquí hace que
  // solicitudes, balances, árbol y aprobaciones casen entre sí. El backend
  // (VacationService.identityOf) usa la misma identidad.
  const userId = computed(() => session.user?.username ?? null)
  const isLoading = computed(() => session.loading)

  const permissions = computed<RolePermissions>(() => {
    if (isSuperAdmin.value) return rolePermissions.super_admin
    if (isAdmin.value) return rolePermissions.admin
    return rolePermissions.user
  })

  function hasRole(role: UserRole): boolean {
    if (roles.value.includes('super_admin')) return true
    if (role === 'user' && roles.value.includes('admin')) return true
    return roles.value.includes(role)
  }

  function checkAccess(required: UserRole[]): boolean {
    return hasAccess(roles.value, required)
  }

  return {
    roles,
    isAdmin,
    isSuperAdmin,
    username,
    name,
    email,
    userId,
    isLoading,
    permissions,
    hasRole,
    checkAccess,
  }
}
