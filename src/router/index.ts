import {
  createRouter,
  createWebHistory,
  type RouteRecordRaw,
} from 'vue-router'
import { useSessionStore } from '../stores/session'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/post-login',
    name: 'post-login',
    component: () => import('../views/PostLoginView.vue'),
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const session = useSessionStore()
  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'home' }
  }
  if (to.meta.requiresAdmin && !session.isAdmin) {
    return { name: 'dashboard' }
  }
  if (to.meta.requiresSuperAdmin && !session.isSuperAdmin) {
    return { name: 'dashboard' }
  }
  return true
})
