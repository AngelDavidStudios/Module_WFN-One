import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { useSessionStore } from '../stores/session'
import { hasAccess, type UserRole } from '../types/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/post-login',
    name: 'post-login',
    component: () => import('../views/PostLoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/unauthorized',
    name: 'unauthorized',
    component: () => import('../views/UnauthorizedView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/vacations',
    name: 'vacations',
    component: () => import('../views/vacation/MyVacationsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/approvals',
    name: 'approvals',
    // Sin requiredRoles: cualquier usuario puede ser supervisor en el árbol
    // organizacional y aprobar las solicitudes de SUS subordinados (el backend
    // lo permite por `supervisorId`, no por grupo Cognito). La vista se
    // auto-filtra a las solicitudes donde el usuario es el supervisor asignado
    // (vacía si no tiene subordinados).
    component: () => import('../views/vacation/PendingApprovalsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/organization',
    name: 'organization',
    component: () => import('../views/organization/ManageHierarchyView.vue'),
    meta: { requiresAuth: true, requiredRoles: ['super_admin'] },
  },
  {
    path: '/super-admin',
    name: 'super-admin',
    component: () => import('../views/SuperAdminView.vue'),
    meta: { requiresAuth: true, requiredRoles: ['super_admin'] },
  },
  {
    path: '/audit',
    name: 'audit',
    component: () => import('../views/audit/AuditView.vue'),
    meta: { requiresAuth: true, requiredRoles: ['super_admin'] },
  },
  {
    path: '/users',
    name: 'users',
    component: () => import('../views/UserManagementView.vue'),
    meta: { requiresAuth: true, requiredRoles: ['admin'] },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const session = useSessionStore()

  // Usuario autenticado que visita el login → al inicio.
  if (to.name === 'login' && session.isAuthenticated) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'login' }
  }

  const required = to.meta.requiredRoles as UserRole[] | undefined
  if (required && required.length > 0) {
    if (!hasAccess(session.roles, required)) {
      return { name: 'unauthorized' }
    }
  }

  return true
})
