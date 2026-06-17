import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  fetchSession,
  logout as logoutApi,
  refresh as refreshApi,
  startLogin,
  type SessionUser,
} from '../api/auth'
import { rolesFromGroups, type UserRole } from '../auth/roles'

export const useSessionStore = defineStore('session', () => {
  const user = ref<SessionUser | null>(null)
  const loaded = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  // Roles WFN derivados de los grupos Cognito que entrega el BFF.
  const roles = computed<UserRole[]>(() => rolesFromGroups(user.value?.groups))
  const isSuperAdmin = computed(() => roles.value.includes('super_admin'))
  const isAdmin = computed(
    () => isSuperAdmin.value || roles.value.includes('admin'),
  )

  async function load(): Promise<void> {
    if (loading.value) return
    loading.value = true
    try {
      const res = await fetchSession()
      user.value = res.authenticated && res.user ? res.user : null
    } catch {
      user.value = null
    } finally {
      loaded.value = true
      loading.value = false
    }
  }

  async function signOut(): Promise<void> {
    try {
      const { logoutUrl } = await logoutApi()
      user.value = null
      window.location.assign(logoutUrl)
    } catch {
      user.value = null
    }
  }

  async function refreshTokens(): Promise<void> {
    await refreshApi()
  }

  function signIn(returnTo = '/post-login'): void {
    startLogin(returnTo)
  }

  return {
    user,
    loaded,
    loading,
    isAuthenticated,
    roles,
    isAdmin,
    isSuperAdmin,
    load,
    signIn,
    signOut,
    refreshTokens,
  }
})
