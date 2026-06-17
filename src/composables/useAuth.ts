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
  const email = computed(() => session.user?.email ?? null)
  const userId = computed(() => session.user?.sub ?? null)
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
    email,
    userId,
    isLoading,
    permissions,
    hasRole,
    checkAccess,
  }
}
