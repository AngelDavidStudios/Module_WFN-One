<script setup lang="ts">
import { ref, computed, onMounted, watch, type CSSProperties } from 'vue'
import { useRoute } from 'vue-router'
import {
  HomeIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  ComputerDesktopIcon,
} from '@heroicons/vue/24/outline'
import {
  HomeIcon as HomeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
} from '@heroicons/vue/24/solid'
import { useAuth } from '../../composables/useAuth'
import { useSessionStore } from '../../stores/session'
import { getProfilePictureUrl } from '../../services'
import { UserAvatar } from '../ui'
import NavLink from './NavLink.vue'
import NavDropdown, { type DropdownItem } from './NavDropdown.vue'

const route = useRoute()
const session = useSessionStore()
const { roles, isAdmin, isSuperAdmin, permissions, name, username, email, userId } =
  useAuth()

const profilePicture = ref<string | null>(null)

const isActive = (path: string): boolean => route.path === path
const displayName = computed(
  () => name.value || username.value || email.value?.split('@')[0] || 'Usuario',
)

async function loadProfilePicture(): Promise<void> {
  if (userId.value) {
    const url = await getProfilePictureUrl(userId.value)
    if (url) profilePicture.value = url
  }
}
onMounted(loadProfilePicture)
watch(userId, loadProfilePicture)

const isEmpleadoGroupActive = computed(
  () => isActive('/vacations') || isActive('/approvals'),
)
const isSistemaGroupActive = computed(
  () => isActive('/super-admin') || isActive('/audit') || isActive('/users'),
)

const empleadoItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = []
  if (permissions.value.canCreateVacationRequest) {
    items.push({ to: '/vacations', icon: CalendarDaysIcon, label: 'Mis Vacaciones' })
  }
  // Cualquier usuario puede ser supervisor en el árbol y aprobar a sus
  // subordinados (no depende del grupo Cognito). La vista se auto-filtra:
  // si no tiene subordinados, la lista sale vacía.
  items.push({ to: '/approvals', icon: CheckCircleIcon, label: 'Aprobaciones' })
  return items
})

const sistemaItems = computed<DropdownItem[]>(() => {
  const items: DropdownItem[] = []
  if (isSuperAdmin.value) {
    items.push({ to: '/super-admin', icon: ShieldCheckIcon, label: 'Admin' })
    items.push({ to: '/audit', icon: ClipboardDocumentListIcon, label: 'Auditoría' })
  }
  if (permissions.value.canManageUsers) {
    items.push({ to: '/users', icon: UsersIcon, label: 'Usuarios' })
  }
  return items
})

const roleBadgeStyle = computed<CSSProperties>(() => {
  if (isSuperAdmin.value) return { backgroundColor: '#ef4444', color: '#fff' }
  if (isAdmin.value) return { backgroundColor: '#f59e0b', color: '#fff' }
  return { backgroundColor: '#10b981', color: '#fff' }
})

function handleSignOut(): void {
  session.signOut()
}

function onSettingsEnter(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'rgba(255,255,255,0.2)'
  t.style.color = '#fff'
}
function onSettingsLeave(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.backgroundColor = 'rgba(255,255,255,0.1)'
  t.style.color = 'rgba(255,255,255,0.7)'
}
function onLogoutEnter(e: MouseEvent): void {
  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#dc2626'
}
function onLogoutLeave(e: MouseEvent): void {
  ;(e.currentTarget as HTMLElement).style.backgroundColor = '#ef4444'
}
</script>

<template>
  <nav
    style="
      background-color: #0f172a;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      position: sticky;
      top: 0;
      z-index: 1000;
    "
  >
    <div style="max-width: 1400px; margin: 0 auto; padding: 0 16px">
      <div
        style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          height: 64px;
          gap: 0.2rem;
        "
      >
        <!-- Logo -->
        <RouterLink
          to="/"
          style="
            display: flex;
            align-items: center;
            gap: 8px;
            text-decoration: none;
            flex-shrink: 0;
          "
        >
          <div
            style="
              width: 36px;
              height: 36px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            "
          >
            <CalendarDaysIcon style="width: 20px; height: 20px; color: #fff" />
          </div>
          <span
            style="
              color: #fff;
              font-weight: 700;
              font-size: 1.1rem;
              letter-spacing: -0.5px;
              white-space: nowrap;
            "
          >
            WFN One
          </span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <div
          style="
            display: flex;
            align-items: center;
            gap: 0.2rem;
            flex: 1;
            justify-content: center;
            margin: 0 0.5rem;
          "
        >
          <NavLink
            to="/"
            label="Inicio"
            :is-active="isActive('/')"
            :icon="HomeIcon"
            :icon-active="HomeIconSolid"
          />
          <NavLink
            to="/dashboard"
            label="Dashboard"
            :is-active="isActive('/dashboard')"
            :icon="ChartBarIcon"
            :icon-active="ChartBarIconSolid"
          />
          <NavDropdown
            v-if="empleadoItems.length > 0"
            label="Empleado"
            :items="empleadoItems"
            :is-active-group="isEmpleadoGroupActive"
            :icon="UserGroupIcon"
          />
          <NavLink
            v-if="isSuperAdmin"
            to="/organization"
            label="Organización"
            :is-active="isActive('/organization')"
            :icon="BuildingOffice2Icon"
          />
          <NavDropdown
            v-if="sistemaItems.length > 0"
            label="Sistema"
            :items="sistemaItems"
            :is-active-group="isSistemaGroupActive"
            :icon="ComputerDesktopIcon"
          />
        </div>

        <!-- Right Section -->
        <div
          style="display: flex; align-items: center; gap: 0.2rem; flex-shrink: 0"
        >
          <div
            style="
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 6px 10px;
              background-color: rgba(255, 255, 255, 0.05);
              border-radius: 10px;
            "
          >
            <UserAvatar
              :name="displayName"
              :photo-url="profilePicture"
              size="sm"
              :show-border="true"
            />
            <div style="display: flex; flex-direction: column">
              <span
                style="
                  color: #fff;
                  font-weight: 600;
                  font-size: 0.8rem;
                  line-height: 1.2;
                  white-space: nowrap;
                "
              >
                {{ displayName }}
              </span>
              <span
                :style="{
                  ...roleBadgeStyle,
                  padding: '1px 6px',
                  borderRadius: '8px',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                }"
              >
                {{ roles[0] || 'user' }}
              </span>
            </div>
          </div>

          <RouterLink
            to="/profile"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 36px;
              height: 36px;
              background-color: rgba(255, 255, 255, 0.1);
              border-radius: 8px;
              color: rgba(255, 255, 255, 0.7);
              text-decoration: none;
              transition: all 0.2s ease;
              flex-shrink: 0;
            "
            @mouseenter="onSettingsEnter"
            @mouseleave="onSettingsLeave"
          >
            <Cog6ToothIcon style="width: 18px; height: 18px" />
          </RouterLink>

          <button
            style="
              display: flex;
              align-items: center;
              gap: 6px;
              padding: 8px 12px;
              background-color: #ef4444;
              color: #fff;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.8rem;
              transition: all 0.2s ease;
              flex-shrink: 0;
              white-space: nowrap;
            "
            @click="handleSignOut"
            @mouseenter="onLogoutEnter"
            @mouseleave="onLogoutLeave"
          >
            <ArrowRightOnRectangleIcon style="width: 16px; height: 16px" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>
