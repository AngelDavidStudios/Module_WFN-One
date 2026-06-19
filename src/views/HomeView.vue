<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '../composables/useAuth'
import { getProfilePictureUrl } from '../services'
import { UserAvatar } from '../components/ui'

const {
  roles,
  isAdmin,
  isSuperAdmin,
  permissions,
  name,
  username,
  email,
  userId,
} = useAuth()

const displayName = computed(
  () => name.value || username.value || email.value?.split('@')[0] || 'Usuario',
)
const profilePicture = ref<string | null>(null)

async function loadProfilePicture(): Promise<void> {
  if (userId.value) {
    const url = await getProfilePictureUrl(userId.value)
    if (url) profilePicture.value = url
  }
}
onMounted(loadProfilePicture)
watch(userId, loadProfilePicture)

const permissionList = computed(() => [
  { label: 'Gestionar usuarios', has: permissions.value.canManageUsers },
  { label: 'Asignar roles', has: permissions.value.canAssignRoles },
  {
    label: 'Panel de administración',
    has: permissions.value.canAccessAdminPanel,
  },
  {
    label: 'Panel de super admin',
    has: permissions.value.canAccessSuperAdminPanel,
  },
  {
    label: 'Crear solicitudes de vacaciones',
    has: permissions.value.canCreateVacationRequest,
  },
  {
    label: 'Aprobar vacaciones',
    has: permissions.value.canApproveVacationRequests,
  },
])
</script>

<template>
  <div style="padding: 32px; max-width: 1200px; margin: 0 auto">
    <!-- Header de bienvenida -->
    <div
      style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 32px;
        color: #fff;
        display: flex;
        align-items: center;
        gap: 24px;
      "
    >
      <UserAvatar
        :name="displayName"
        :photo-url="profilePicture"
        size="xl"
        :show-border="true"
      />
      <div>
        <h1 style="font-size: 2rem; font-weight: 700; margin: 0; color: #fff">
          ¡Bienvenido, {{ displayName }}!
        </h1>
        <p style="font-size: 1rem; opacity: 0.9; margin: 8px 0 0 0">
          Sistema de Gestión WFN One
        </p>
      </div>
    </div>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 24px;
      "
    >
      <!-- Tarjeta de información del usuario -->
      <div
        style="
          padding: 24px;
          background-color: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          "
        >
          <UserAvatar
            :name="displayName"
            :photo-url="profilePicture"
            size="lg"
            :show-border="true"
          />
          <div>
            <h3 style="margin: 0; color: #1f2937; font-size: 1.1rem">
              Tu Perfil
            </h3>
            <p style="margin: 0; color: #6b7280; font-size: 0.85rem">
              {{ email }}
            </p>
          </div>
        </div>

        <div
          style="
            display: flex;
            flex-direction: column;
            gap: 12px;
            padding: 16px;
            background-color: #f9fafb;
            border-radius: 8px;
          "
        >
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <span style="color: #6b7280; font-size: 0.9rem">Roles asignados</span>
            <span style="color: #1f2937; font-weight: 600; font-size: 0.9rem">
              {{ roles.length > 0 ? roles.join(', ') : 'Sin roles' }}
            </span>
          </div>
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <span style="color: #6b7280; font-size: 0.9rem">Nivel de acceso</span>
            <span
              :style="{
                padding: '4px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: isSuperAdmin
                  ? '#fef2f2'
                  : isAdmin
                    ? '#fffbeb'
                    : '#f0fdf4',
                color: isSuperAdmin ? '#dc2626' : isAdmin ? '#d97706' : '#16a34a',
              }"
            >
              {{
                isSuperAdmin
                  ? 'Super Admin'
                  : isAdmin
                    ? 'Administrador'
                    : 'Usuario'
              }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tarjeta de permisos -->
      <div
        style="
          padding: 24px;
          background-color: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
          "
        >
          <div
            style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <ShieldCheckIcon style="width: 28px; height: 28px; color: #fff" />
          </div>
          <div>
            <h3 style="margin: 0; color: #1f2937; font-size: 1.1rem">
              Tus Permisos
            </h3>
            <p style="margin: 0; color: #6b7280; font-size: 0.85rem">
              Accesos del sistema
            </p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 10px">
          <div
            v-for="item in permissionList"
            :key="item.label"
            :style="{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: item.has ? '#f0fdf4' : '#fef2f2',
              borderRadius: '8px',
              border: `1px solid ${item.has ? '#bbf7d0' : '#fecaca'}`,
            }"
          >
            <CheckCircleIcon
              v-if="item.has"
              style="width: 18px; height: 18px; color: #16a34a"
            />
            <XCircleIcon
              v-else
              style="width: 18px; height: 18px; color: #dc2626"
            />
            <span
              :style="{
                color: item.has ? '#166534' : '#991b1b',
                fontSize: '0.85rem',
                fontWeight: 500,
              }"
            >
              {{ item.label }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
