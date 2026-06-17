<script setup lang="ts">
import { ref, computed, onMounted, watch, type CSSProperties } from 'vue'
import {
  CameraIcon,
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '../composables/useAuth'
import {
  uploadProfilePicture,
  getProfilePictureUrl,
  deleteProfilePicture,
} from '../services/profilePictureService'
import { UserAvatar } from '../components/ui'

const { username, email, roles, userId } = useAuth()

const profilePicture = ref<string | null>(null)
const isUploadingPicture = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const showChangePassword = ref(false)
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const isLoading = ref(false)
const message = ref<{ type: 'success' | 'error'; text: string } | null>(null)

const displayName = computed(
  () => username.value || email.value?.split('@')[0] || 'Usuario',
)

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  fontSize: '1rem',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
}
const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '6px',
  fontWeight: 600,
  color: '#374151',
  fontSize: '0.9rem',
}

function roleBadge(role: string): { bg: string; color: string } {
  if (role === 'super_admin') return { bg: '#fef2f2', color: '#dc2626' }
  if (role === 'admin') return { bg: '#fffbeb', color: '#d97706' }
  return { bg: '#ecfdf5', color: '#059669' }
}

async function loadProfilePicture(): Promise<void> {
  if (userId.value) {
    const url = await getProfilePictureUrl(userId.value)
    if (url) profilePicture.value = url
  }
}
onMounted(loadProfilePicture)
watch(userId, loadProfilePicture)

async function handlePictureUpload(event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !userId.value) return
  isUploadingPicture.value = true
  message.value = null
  const result = await uploadProfilePicture(userId.value, file)
  if (result.success && result.url) {
    profilePicture.value = result.url
    message.value = { type: 'success', text: '¡Foto de perfil actualizada!' }
  } else {
    message.value = {
      type: 'error',
      text: result.error || 'Error al subir la imagen',
    }
  }
  isUploadingPicture.value = false
  if (fileInput.value) fileInput.value.value = ''
}

async function handleDeletePicture(): Promise<void> {
  if (!userId.value) return
  if (!window.confirm('¿Estás seguro de eliminar tu foto de perfil?')) return
  isUploadingPicture.value = true
  const success = await deleteProfilePicture(userId.value)
  if (success) {
    profilePicture.value = null
    message.value = { type: 'success', text: 'Foto de perfil eliminada' }
  } else {
    message.value = { type: 'error', text: 'Error al eliminar la imagen' }
  }
  isUploadingPicture.value = false
}

async function handleChangePassword(): Promise<void> {
  message.value = null
  const form = passwordForm.value
  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    message.value = { type: 'error', text: 'Por favor completa todos los campos' }
    return
  }
  if (form.newPassword.length < 8) {
    message.value = {
      type: 'error',
      text: 'La nueva contraseña debe tener al menos 8 caracteres',
    }
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    message.value = { type: 'error', text: 'Las contraseñas no coinciden' }
    return
  }

  // El cambio de contraseña ya no usa Amplify. En el modelo BFF lo gestiona
  // Cognito Managed Login o un endpoint del backend NestJS (pendiente).
  message.value = {
    type: 'error',
    text: 'El cambio de contraseña se gestionará desde el backend (pendiente). Por ahora, usa el flujo de Cognito Managed Login.',
  }
}

function cancelChangePassword(): void {
  showChangePassword.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
  message.value = null
}
</script>

<template>
  <div style="padding: 32px; max-width: 900px; margin: 0 auto">
    <!-- Header -->
    <div
      style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 16px;
        padding: 32px;
        margin-bottom: 32px;
        color: #fff;
      "
    >
      <h1 style="font-size: 1.75rem; margin-bottom: 8px; font-weight: 700; color: #fff">
        Configuración del Perfil
      </h1>
      <p style="font-size: 0.95rem; opacity: 0.9; margin: 0">
        Gestiona tu información personal y configuración de seguridad
      </p>
    </div>

    <!-- Mensaje -->
    <div
      v-if="message"
      :style="{
        padding: '14px 18px',
        borderRadius: '10px',
        marginBottom: '24px',
        backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
        color: message.type === 'success' ? '#065f46' : '#991b1b',
        border: `1px solid ${message.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }"
    >
      {{ message.type === 'success' ? '✅' : '⚠️' }} {{ message.text }}
    </div>

    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
        gap: 24px;
      "
    >
      <!-- Foto de perfil -->
      <div
        style="
          background-color: #fff;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
          "
        >
          <div
            style="
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <CameraIcon style="width: 22px; height: 22px; color: #fff" />
          </div>
          <div>
            <h2
              style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
            >
              Foto de Perfil
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 0.8rem">
              JPG, PNG, GIF o WEBP. Máx 5MB
            </p>
          </div>
        </div>

        <div
          style="
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          "
        >
          <div style="position: relative">
            <UserAvatar
              :name="displayName"
              :photo-url="profilePicture"
              size="xxl"
              :show-border="true"
            />
            <div
              v-if="isUploadingPicture"
              style="
                position: absolute;
                inset: 0;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <div
                style="
                  width: 30px;
                  height: 30px;
                  border: 3px solid #fff;
                  border-top-color: transparent;
                  border-radius: 50%;
                  animation: spin 1s linear infinite;
                "
              />
            </div>
          </div>

          <div style="display: flex; gap: 12px">
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              style="display: none"
              @change="handlePictureUpload"
            />
            <button
              :disabled="isUploadingPicture"
              :style="{
                padding: '10px 20px',
                backgroundColor: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                opacity: isUploadingPicture ? 0.7 : 1,
              }"
              @click="fileInput?.click()"
            >
              <CameraIcon style="width: 16px; height: 16px" />
              {{ profilePicture ? 'Cambiar' : 'Subir' }} Foto
            </button>
            <button
              v-if="profilePicture"
              :disabled="isUploadingPicture"
              :style="{
                padding: '10px 20px',
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                cursor: isUploadingPicture ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }"
              @click="handleDeletePicture"
            >
              <TrashIcon style="width: 16px; height: 16px" />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      <!-- Información personal -->
      <div
        style="
          background-color: #fff;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        "
      >
        <div
          style="
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
          "
        >
          <div
            style="
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <ShieldCheckIcon style="width: 22px; height: 22px; color: #fff" />
          </div>
          <div>
            <h2
              style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
            >
              Información Personal
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 0.8rem">
              Datos de tu cuenta
            </p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px">
          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 14px 16px;
              background-color: #f9fafb;
              border-radius: 10px;
            "
          >
            <span style="color: #6b7280; font-size: 0.9rem">Nombre</span>
            <span style="color: #1f2937; font-weight: 600; font-size: 0.9rem">
              {{ username || 'No disponible' }}
            </span>
          </div>

          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 14px 16px;
              background-color: #f9fafb;
              border-radius: 10px;
            "
          >
            <span style="color: #6b7280; font-size: 0.9rem">Email</span>
            <span style="color: #1f2937; font-weight: 600; font-size: 0.9rem">
              {{ email || 'No disponible' }}
            </span>
          </div>

          <div
            style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 14px 16px;
              background-color: #f9fafb;
              border-radius: 10px;
            "
          >
            <span style="color: #6b7280; font-size: 0.9rem">Roles</span>
            <div style="display: flex; gap: 6px">
              <span
                v-for="role in roles"
                :key="role"
                :style="{
                  padding: '4px 10px',
                  backgroundColor: roleBadge(role).bg,
                  color: roleBadge(role).color,
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }"
              >
                {{ role }}
              </span>
            </div>
          </div>

          <div
            style="
              padding: 14px 16px;
              background-color: #f9fafb;
              border-radius: 10px;
            "
          >
            <span
              style="
                color: #6b7280;
                font-size: 0.9rem;
                display: block;
                margin-bottom: 4px;
              "
            >
              ID Usuario
            </span>
            <span
              style="
                font-family: monospace;
                font-size: 0.75rem;
                color: #9ca3af;
                word-break: break-all;
              "
            >
              {{ userId || 'No disponible' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Seguridad -->
    <div
      style="
        background-color: #fff;
        border-radius: 16px;
        padding: 28px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border: 1px solid #e5e7eb;
        margin-top: 24px;
      "
    >
      <div
        style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        "
      >
        <div
          style="
            width: 40px;
            height: 40px;
            border-radius: 10px;
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <KeyIcon style="width: 22px; height: 22px; color: #fff" />
        </div>
        <div>
          <h2
            style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
          >
            Seguridad
          </h2>
          <p style="margin: 0; color: #6b7280; font-size: 0.8rem">
            Gestiona tu contraseña
          </p>
        </div>
      </div>

      <button
        v-if="!showChangePassword"
        style="
          padding: 12px 24px;
          background-color: #f59e0b;
          color: #fff;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: background-color 0.2s;
        "
        @click="showChangePassword = true"
        @mouseenter="
          ($event.currentTarget as HTMLElement).style.backgroundColor =
            '#d97706'
        "
        @mouseleave="
          ($event.currentTarget as HTMLElement).style.backgroundColor =
            '#f59e0b'
        "
      >
        <KeyIcon style="width: 18px; height: 18px" />
        Cambiar Contraseña
      </button>

      <div v-else style="max-width: 400px">
        <div style="margin-bottom: 16px">
          <label :style="labelStyle">Contraseña actual</label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            :style="inputStyle"
            placeholder="Ingresa tu contraseña actual"
          />
        </div>

        <div style="margin-bottom: 16px">
          <label :style="labelStyle">Nueva contraseña</label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            :style="inputStyle"
            placeholder="Mínimo 8 caracteres"
          />
        </div>

        <div style="margin-bottom: 24px">
          <label :style="labelStyle">Confirmar nueva contraseña</label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            :style="inputStyle"
            placeholder="Repite la nueva contraseña"
          />
        </div>

        <div style="display: flex; gap: 12px">
          <button
            :disabled="isLoading"
            :style="{
              padding: '12px 24px',
              backgroundColor: isLoading ? '#9ca3af' : '#10b981',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
            }"
            @click="handleChangePassword"
          >
            {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          <button
            :disabled="isLoading"
            style="
              padding: 12px 24px;
              background-color: #f3f4f6;
              color: #374151;
              border: none;
              border-radius: 10px;
              cursor: pointer;
              font-weight: 600;
              font-size: 0.9rem;
            "
            @click="cancelChangePassword"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
