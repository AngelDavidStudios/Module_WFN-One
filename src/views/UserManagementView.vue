<script setup lang="ts">
import { ref, computed, onMounted, watch, type CSSProperties } from 'vue'
import { CalendarDaysIcon } from '@heroicons/vue/24/outline'
import { useAuth } from '../composables/useAuth'
import {
  userManagementApi,
  type CognitoUser,
} from '../services/userManagementApi'
import { vacationApi } from '../services/vacationApi'
import { getAnyUserProfilePictureUrl } from '../services/profilePictureService'
import { type UserRole } from '../types/auth'
import { type VacationBalance } from '../types/vacation'
import { UserAvatar } from '../components/ui'
import SimpleModal from '../components/SimpleModal.vue'

const { permissions, isSuperAdmin, userId: adminUserId } = useAuth()

const users = ref<CognitoUser[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const showRoleModal = ref(false)
const showResetPasswordModal = ref(false)
const showCredentialsModal = ref(false)
const showBalanceModal = ref(false)
const createdUserCredentials = ref<{
  email: string
  username: string
  temporaryPassword: string
} | null>(null)
const selectedUser = ref<CognitoUser | null>(null)
const searchTerm = ref('')
const operationLoading = ref(false)
const newPassword = ref('')
const newUser = ref({ email: '', username: '', temporaryPassword: '' })
const userPhotos = ref<Record<string, string | null>>({})
const userBalances = ref<Record<string, VacationBalance>>({})
const balanceDays = ref(0)

const roleList: UserRole[] = ['user', 'admin', 'super_admin']

const tableHeaderStyle: CSSProperties = {
  padding: '16px 12px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#495057',
}
const tableCellStyle: CSSProperties = { padding: '16px 12px' }
const labelStyle: CSSProperties = {
  display: 'block',
  marginBottom: '4px',
  fontWeight: 'bold',
  color: '#495057',
}
const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '1rem',
  boxSizing: 'border-box',
}
function actionButtonStyle(bgColor: string): CSSProperties {
  return {
    width: '36px',
    height: '36px',
    backgroundColor: bgColor,
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
}

const filteredUsers = computed(() =>
  users.value.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      (user.email?.toLowerCase().includes(searchTerm.value.toLowerCase()) ??
        false),
  ),
)

function statusBadge(status: string): { style: CSSProperties; label: string } {
  const styles: Record<string, CSSProperties> = {
    CONFIRMED: { backgroundColor: '#d4edda', color: '#155724' },
    UNCONFIRMED: { backgroundColor: '#fff3cd', color: '#856404' },
    FORCE_CHANGE_PASSWORD: { backgroundColor: '#cce5ff', color: '#004085' },
  }
  const labels: Record<string, string> = {
    CONFIRMED: 'Confirmado',
    UNCONFIRMED: 'Sin confirmar',
    FORCE_CHANGE_PASSWORD: 'Cambio de contraseña',
  }
  return {
    style: {
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '0.8rem',
      fontWeight: 'bold',
      ...(styles[status] || { backgroundColor: '#f8f9fa', color: '#495057' }),
    },
    label: labels[status] || status,
  }
}

function roleTableColor(role: string): string {
  if (role === 'super_admin') return '#f8d7da'
  if (role === 'admin') return '#fff3cd'
  return '#e3f2fd'
}

function roleTitle(role: UserRole): string {
  if (role === 'super_admin') return '👑 Super Admin'
  if (role === 'admin') return '⚙️ Administrador'
  return '👤 Usuario'
}
function roleDesc(role: UserRole): string {
  if (role === 'super_admin') return 'Acceso completo al sistema'
  if (role === 'admin') return 'Puede gestionar usuarios y configuraciones'
  return 'Acceso básico al sistema'
}

async function loadUsers(): Promise<void> {
  isLoading.value = true
  error.value = null
  const response = await userManagementApi.listUsers()
  if (response.error) {
    error.value = response.error
    users.value = []
  } else if (response.data) {
    users.value = response.data.users
  }
  isLoading.value = false
}

onMounted(loadUsers)

watch(users, async (list) => {
  if (list.length === 0) return
  const photos: Record<string, string | null> = {}
  const batchSize = 5
  for (let i = 0; i < list.length; i += batchSize) {
    const batch = list.slice(i, i + batchSize)
    const results = await Promise.all(
      batch.map(async (user) => ({
        id: user.username,
        url: await getAnyUserProfilePictureUrl(user.username),
      })),
    )
    results.forEach(({ id, url }) => {
      photos[id] = url
    })
  }
  userPhotos.value = photos

  if (isSuperAdmin.value) {
    const response = await vacationApi.getAllBalances()
    if (response.data?.balances) {
      const map: Record<string, VacationBalance> = {}
      response.data.balances.forEach((b) => {
        map[b.userId] = b
      })
      userBalances.value = map
    }
  }
})

async function handleCreateUser(): Promise<void> {
  if (!newUser.value.email || !newUser.value.username) {
    alert('Por favor completa el email y nombre de usuario')
    return
  }
  if (
    newUser.value.temporaryPassword &&
    newUser.value.temporaryPassword.length < 8
  ) {
    alert('La contraseña debe tener al menos 8 caracteres')
    return
  }
  operationLoading.value = true
  const response = await userManagementApi.createUser(
    newUser.value.email,
    newUser.value.username,
    newUser.value.temporaryPassword || undefined,
  )
  operationLoading.value = false
  if (response.error) {
    alert(`Error al crear usuario: ${response.error}`)
    return
  }
  if (response.data?.user) {
    createdUserCredentials.value = {
      email: newUser.value.email,
      username: newUser.value.username,
      temporaryPassword: response.data.user.temporaryPassword,
    }
    showCredentialsModal.value = true
  }
  newUser.value = { email: '', username: '', temporaryPassword: '' }
  showCreateModal.value = false
  loadUsers()
}

async function handleToggleRole(
  username: string,
  role: UserRole,
  hasRole: boolean,
): Promise<void> {
  if (!permissions.value.canAssignRoles && role !== 'user') {
    alert('No tienes permisos para asignar este rol')
    return
  }
  operationLoading.value = true
  const response = hasRole
    ? await userManagementApi.removeUserFromGroup(username, role)
    : await userManagementApi.addUserToGroup(username, role)
  operationLoading.value = false
  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  if (selectedUser.value) {
    const updatedGroups = hasRole
      ? selectedUser.value.groups.filter((g) => g !== role)
      : [...selectedUser.value.groups, role]
    selectedUser.value = { ...selectedUser.value, groups: updatedGroups }
  }
  loadUsers()
}

async function handleDeleteUser(username: string): Promise<void> {
  if (
    !confirm(
      `¿Estás seguro de que deseas eliminar al usuario "${username}"? Esta acción es irreversible.`,
    )
  )
    return
  operationLoading.value = true
  const response = await userManagementApi.deleteUser(username)
  operationLoading.value = false
  if (response.error) {
    alert(`Error al eliminar usuario: ${response.error}`)
    return
  }
  loadUsers()
  alert('Usuario eliminado exitosamente.')
}

async function handleResetPassword(): Promise<void> {
  if (!selectedUser.value || !newPassword.value) {
    alert('Por favor ingresa la nueva contraseña')
    return
  }
  if (newPassword.value.length < 8) {
    alert('La contraseña debe tener al menos 8 caracteres')
    return
  }
  operationLoading.value = true
  const response = await userManagementApi.resetPassword(
    selectedUser.value.username,
    newPassword.value,
  )
  operationLoading.value = false
  if (response.error) {
    alert(`Error al resetear contraseña: ${response.error}`)
    return
  }
  newPassword.value = ''
  showResetPasswordModal.value = false
  selectedUser.value = null
  loadUsers()
  alert(
    'Contraseña reseteada exitosamente. El usuario puede iniciar sesión con la nueva contraseña.',
  )
}

function handleOpenBalanceModal(user: CognitoUser): void {
  selectedUser.value = user
  balanceDays.value = userBalances.value[user.username]?.totalDays || 0
  showBalanceModal.value = true
}

async function handleSetBalance(): Promise<void> {
  if (!selectedUser.value || !adminUserId.value) {
    alert('Error: Usuario no seleccionado')
    return
  }
  if (balanceDays.value < 0) {
    alert('Los días de vacaciones no pueden ser negativos')
    return
  }
  operationLoading.value = true
  const response = await vacationApi.setBalance(
    selectedUser.value.username,
    selectedUser.value.email || '',
    selectedUser.value.preferredUsername ||
      selectedUser.value.name ||
      selectedUser.value.username,
    balanceDays.value,
    adminUserId.value,
  )
  operationLoading.value = false
  if (response.error) {
    alert(`Error al asignar vacaciones: ${response.error}`)
    return
  }
  if (response.data?.balance) {
    userBalances.value = {
      ...userBalances.value,
      [selectedUser.value.username]: response.data.balance,
    }
  }
  showBalanceModal.value = false
  selectedUser.value = null
  balanceDays.value = 0
  alert('Días de vacaciones asignados exitosamente.')
}

function copyCredentials(): void {
  if (!createdUserCredentials.value) return
  const text = `Credenciales de acceso:\nEmail: ${createdUserCredentials.value.email}\nContraseña temporal: ${createdUserCredentials.value.temporaryPassword}`
  navigator.clipboard.writeText(text)
  alert('Credenciales copiadas al portapapeles')
}

const currentYear = new Date().getFullYear()
</script>

<template>
  <div
    v-if="isLoading"
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: calc(100vh - 100px);
      font-size: 1.2rem;
    "
  >
    Cargando usuarios de Cognito...
  </div>

  <div v-else style="padding: 32px; max-width: 1400px; margin: 0 auto">
    <div style="margin-bottom: 32px">
      <h1 style="font-size: 2rem; margin-bottom: 8px">👥 Gestión de Usuarios</h1>
      <p style="color: #666">
        Administra usuarios de AWS Cognito, asigna roles y gestiona permisos del
        sistema.
      </p>
      <div
        v-if="error"
        style="
          padding: 12px;
          background-color: #f8d7da;
          color: #721c24;
          border-radius: 8px;
          margin-top: 16px;
        "
      >
        ⚠️ {{ error }}
      </div>
    </div>

    <!-- Barra de acciones -->
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 24px;
        flex-wrap: wrap;
        gap: 16px;
      "
    >
      <div style="display: flex; gap: 12px; align-items: center">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="🔍 Buscar usuarios..."
          style="
            padding: 10px 16px;
            border: 1px solid #ddd;
            border-radius: 8px;
            width: 300px;
            font-size: 1rem;
          "
        />
        <button
          :disabled="isLoading"
          style="
            padding: 10px 16px;
            background-color: #6c757d;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          "
          @click="loadUsers"
        >
          🔄 Recargar
        </button>
        <span style="color: #666">
          {{ filteredUsers.length }} usuario(s) encontrado(s)
        </span>
      </div>

      <button
        v-if="permissions.canManageUsers"
        style="
          padding: 12px 24px;
          background-color: #27ae60;
          color: #fff;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 8px;
        "
        @click="showCreateModal = true"
      >
        ➕ Crear Usuario
      </button>
    </div>

    <!-- Tabla -->
    <div
      style="
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      "
    >
      <table style="width: 100%; border-collapse: collapse">
        <thead>
          <tr style="background-color: #f8f9fa">
            <th :style="tableHeaderStyle">Usuario</th>
            <th :style="tableHeaderStyle">Email</th>
            <th :style="tableHeaderStyle">Estado</th>
            <th :style="tableHeaderStyle">Roles</th>
            <th :style="tableHeaderStyle">Vacaciones</th>
            <th :style="tableHeaderStyle">Creado</th>
            <th :style="tableHeaderStyle">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredUsers.length === 0">
            <td
              colspan="7"
              style="padding: 32px; text-align: center; color: #666"
            >
              {{
                searchTerm
                  ? 'No se encontraron usuarios con ese criterio'
                  : 'No hay usuarios registrados'
              }}
            </td>
          </tr>
          <tr
            v-for="user in filteredUsers"
            v-else
            :key="user.username"
            style="border-bottom: 1px solid #e9ecef"
          >
            <td :style="tableCellStyle">
              <div style="display: flex; align-items: center; gap: 12px">
                <UserAvatar
                  :name="user.preferredUsername || user.name || user.username"
                  :photo-url="userPhotos[user.username]"
                  size="md"
                  :show-border="true"
                />
                <div>
                  <div style="font-weight: bold">
                    {{ user.preferredUsername || user.name || user.username }}
                  </div>
                  <div
                    v-if="
                      (user.preferredUsername || user.name) &&
                      user.username !== (user.preferredUsername || user.name)
                    "
                    style="font-size: 0.8rem; color: #666"
                  >
                    ID: {{ user.username }}
                  </div>
                </div>
              </div>
            </td>
            <td :style="tableCellStyle">
              <span style="font-family: monospace; font-size: 0.9rem">
                {{ user.email || '-' }}
              </span>
            </td>
            <td :style="tableCellStyle">
              <span :style="statusBadge(user.status).style">
                {{ statusBadge(user.status).label }}
              </span>
            </td>
            <td :style="tableCellStyle">
              <div style="display: flex; gap: 4px; flex-wrap: wrap">
                <template v-if="user.groups.length > 0">
                  <span
                    v-for="role in user.groups"
                    :key="role"
                    :style="{
                      padding: '2px 8px',
                      backgroundColor: roleTableColor(role),
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                    }"
                  >
                    {{ role }}
                  </span>
                </template>
                <span v-else style="color: #888; font-size: 0.9rem"
                  >Sin roles</span
                >
              </div>
            </td>
            <td :style="tableCellStyle">
              <div
                v-if="!userBalances[user.username]"
                style="display: flex; align-items: center; gap: 8px"
              >
                <span style="color: #999; font-size: 0.85rem">Sin asignar</span>
                <button
                  v-if="isSuperAdmin"
                  style="
                    padding: 4px 8px;
                    background-color: #3b82f6;
                    color: #fff;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.75rem;
                  "
                  @click="handleOpenBalanceModal(user)"
                >
                  Asignar
                </button>
              </div>
              <div
                v-else
                style="display: flex; align-items: center; gap: 8px"
              >
                <div style="display: flex; flex-direction: column; gap: 2px">
                  <div
                    :style="{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color:
                        userBalances[user.username].availableDays > 0
                          ? '#059669'
                          : '#dc2626',
                    }"
                  >
                    <CalendarDaysIcon style="width: 16px; height: 16px" />
                    {{ userBalances[user.username].availableDays }} días
                  </div>
                  <div style="font-size: 0.7rem; color: #666">
                    {{ userBalances[user.username].usedDays }} usados /
                    {{ userBalances[user.username].totalDays }} total
                  </div>
                </div>
                <button
                  v-if="isSuperAdmin"
                  style="
                    padding: 4px 6px;
                    background-color: transparent;
                    color: #3b82f6;
                    border: 1px solid #3b82f6;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 0.7rem;
                  "
                  @click="handleOpenBalanceModal(user)"
                >
                  Editar
                </button>
              </div>
            </td>
            <td :style="tableCellStyle">
              <span style="color: #666; font-size: 0.9rem">
                {{
                  user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : '-'
                }}
              </span>
            </td>
            <td :style="tableCellStyle">
              <div style="display: flex; gap: 8px">
                <button
                  v-if="permissions.canAssignRoles"
                  :style="actionButtonStyle('#9b59b6')"
                  title="Gestionar roles"
                  @click="
                    () => {
                      selectedUser = user
                      showRoleModal = true
                    }
                  "
                >
                  🔑
                </button>
                <button
                  v-if="isSuperAdmin"
                  :disabled="operationLoading"
                  :style="actionButtonStyle('#3498db')"
                  title="Resetear contraseña"
                  @click="
                    () => {
                      selectedUser = user
                      showResetPasswordModal = true
                    }
                  "
                >
                  🔄
                </button>
                <button
                  v-if="isSuperAdmin && !user.groups.includes('super_admin')"
                  :disabled="operationLoading"
                  :style="actionButtonStyle('#e74c3c')"
                  title="Eliminar usuario"
                  @click="handleDeleteUser(user.username)"
                >
                  🗑️
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal crear usuario -->
    <SimpleModal
      v-if="showCreateModal"
      title="Crear Nuevo Usuario"
      @close="showCreateModal = false"
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div>
          <label :style="labelStyle">Email (para inicio de sesión) *</label>
          <input
            v-model="newUser.email"
            type="email"
            :style="inputStyle"
            placeholder="usuario@email.com"
          />
          <small style="color: #666; font-size: 0.85rem">
            El usuario iniciará sesión con este email.
          </small>
        </div>
        <div>
          <label :style="labelStyle">Nombre de usuario (visible) *</label>
          <input
            v-model="newUser.username"
            type="text"
            :style="inputStyle"
            placeholder="Juan Pérez"
          />
          <small style="color: #666; font-size: 0.85rem">
            Este nombre se mostrará en la interfaz.
          </small>
        </div>
        <div>
          <label :style="labelStyle">Contraseña temporal (opcional)</label>
          <input
            v-model="newUser.temporaryPassword"
            type="password"
            :style="inputStyle"
            placeholder="Dejar vacío para generar automáticamente"
          />
          <small style="color: #666; font-size: 0.85rem">
            Si se deja vacío, Cognito generará una contraseña y la enviará por
            correo al usuario. El usuario deberá cambiarla en su primer inicio
            de sesión.
          </small>
        </div>
        <div style="display: flex; gap: 12px; margin-top: 16px">
          <button
            :disabled="operationLoading"
            :style="{
              flex: 1,
              padding: '12px',
              backgroundColor: operationLoading ? '#95a5a6' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: operationLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }"
            @click="handleCreateUser"
          >
            {{ operationLoading ? 'Creando...' : 'Crear Usuario' }}
          </button>
          <button
            :disabled="operationLoading"
            style="
              flex: 1;
              padding: 12px;
              background-color: #6c757d;
              color: #fff;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            "
            @click="showCreateModal = false"
          >
            Cancelar
          </button>
        </div>
      </div>
    </SimpleModal>

    <!-- Modal roles -->
    <SimpleModal
      v-if="showRoleModal && selectedUser"
      :title="`Roles de ${selectedUser.username}`"
      @close="showRoleModal = false"
    >
      <div style="display: flex; flex-direction: column; gap: 12px">
        <div
          v-for="role in roleList"
          :key="role"
          :style="{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            backgroundColor: selectedUser.groups.includes(role)
              ? '#e3f2fd'
              : '#f8f9fa',
            borderRadius: '8px',
            border: selectedUser.groups.includes(role)
              ? '2px solid #2196f3'
              : '1px solid #e9ecef',
          }"
        >
          <div>
            <div style="font-weight: bold">{{ roleTitle(role) }}</div>
            <div style="font-size: 0.85rem; color: #666">
              {{ roleDesc(role) }}
            </div>
          </div>
          <button
            :disabled="
              !(
                isSuperAdmin ||
                (permissions.canAssignRoles && role !== 'super_admin')
              ) || operationLoading
            "
            :style="{
              padding: '8px 16px',
              backgroundColor:
                !(
                  isSuperAdmin ||
                  (permissions.canAssignRoles && role !== 'super_admin')
                ) || operationLoading
                  ? '#95a5a6'
                  : selectedUser.groups.includes(role)
                    ? '#e74c3c'
                    : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor:
                (isSuperAdmin ||
                  (permissions.canAssignRoles && role !== 'super_admin')) &&
                !operationLoading
                  ? 'pointer'
                  : 'not-allowed',
              opacity:
                isSuperAdmin ||
                (permissions.canAssignRoles && role !== 'super_admin')
                  ? 1
                  : 0.5,
            }"
            @click="
              handleToggleRole(
                selectedUser.username,
                role,
                selectedUser.groups.includes(role),
              )
            "
          >
            {{
              operationLoading
                ? '...'
                : selectedUser.groups.includes(role)
                  ? 'Quitar'
                  : 'Asignar'
            }}
          </button>
        </div>

        <button
          style="
            margin-top: 16px;
            padding: 12px;
            background-color: #6c757d;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
          "
          @click="showRoleModal = false"
        >
          Cerrar
        </button>
      </div>
    </SimpleModal>

    <!-- Modal resetear contraseña -->
    <SimpleModal
      v-if="showResetPasswordModal && selectedUser"
      title="🔄 Resetear Contraseña"
      @close="
        () => {
          showResetPasswordModal = false
          newPassword = ''
          selectedUser = null
        }
      "
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div
          style="
            padding: 12px;
            background-color: #e3f2fd;
            border-radius: 8px;
            margin-bottom: 8px;
          "
        >
          <p style="margin: 0; color: #1565c0">
            <strong>Usuario:</strong>
            {{
              selectedUser.preferredUsername ||
              selectedUser.name ||
              selectedUser.username
            }}
          </p>
          <p style="margin: 4px 0 0 0; color: #1565c0; font-size: 0.9rem">
            <strong>Email:</strong> {{ selectedUser.email }}
          </p>
        </div>

        <div
          v-if="selectedUser.status === 'FORCE_CHANGE_PASSWORD'"
          style="
            padding: 12px;
            background-color: #fff3cd;
            border-radius: 8px;
            color: #856404;
          "
        >
          ⚠️ Este usuario tiene pendiente un cambio de contraseña obligatorio.
          Al resetear la contraseña, podrá iniciar sesión normalmente.
        </div>

        <div>
          <label :style="labelStyle">Nueva contraseña *</label>
          <input
            v-model="newPassword"
            type="password"
            :style="inputStyle"
            placeholder="Mínimo 8 caracteres"
          />
          <small style="color: #666; font-size: 0.85rem">
            El usuario podrá iniciar sesión con esta contraseña inmediatamente.
          </small>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 16px">
          <button
            :disabled="operationLoading || !newPassword"
            :style="{
              flex: 1,
              padding: '12px',
              backgroundColor: operationLoading ? '#95a5a6' : '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: operationLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }"
            @click="handleResetPassword"
          >
            {{ operationLoading ? 'Reseteando...' : 'Resetear Contraseña' }}
          </button>
          <button
            style="
              padding: 12px 24px;
              background-color: #e9ecef;
              color: #333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
            "
            @click="
              () => {
                showResetPasswordModal = false
                newPassword = ''
                selectedUser = null
              }
            "
          >
            Cancelar
          </button>
        </div>
      </div>
    </SimpleModal>

    <!-- Modal credenciales -->
    <SimpleModal
      v-if="showCredentialsModal && createdUserCredentials"
      title="✅ Usuario Creado Exitosamente"
      @close="
        () => {
          showCredentialsModal = false
          createdUserCredentials = null
        }
      "
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div
          style="
            padding: 16px;
            background-color: #d4edda;
            border-radius: 8px;
            color: #155724;
          "
        >
          <p style="margin: 0; font-weight: bold">
            ¡Usuario creado! Comparte estas credenciales con el usuario:
          </p>
        </div>

        <div
          style="
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 2px dashed #dee2e6;
          "
        >
          <div style="margin-bottom: 12px">
            <span style="font-weight: bold; color: #666">Nombre: </span>
            <span style="font-size: 1.1rem">{{
              createdUserCredentials.username
            }}</span>
          </div>
          <div style="margin-bottom: 12px">
            <span style="font-weight: bold; color: #666"
              >Email (para iniciar sesión): </span
            >
            <span
              style="
                font-size: 1.1rem;
                font-family: monospace;
                background-color: #e9ecef;
                padding: 2px 8px;
                border-radius: 4px;
              "
            >
              {{ createdUserCredentials.email }}
            </span>
          </div>
          <div>
            <span style="font-weight: bold; color: #666"
              >Contraseña temporal: </span
            >
            <span
              style="
                font-size: 1.1rem;
                font-family: monospace;
                background-color: #fff3cd;
                padding: 2px 8px;
                border-radius: 4px;
                font-weight: bold;
              "
            >
              {{ createdUserCredentials.temporaryPassword }}
            </span>
          </div>
        </div>

        <div
          style="
            padding: 12px;
            background-color: #cce5ff;
            border-radius: 8px;
            color: #004085;
            font-size: 0.9rem;
          "
        >
          ⚠️ <strong>Importante:</strong> El usuario deberá cambiar esta
          contraseña en su primer inicio de sesión.
        </div>

        <button
          style="
            padding: 12px;
            background-color: #6c757d;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          "
          @click="copyCredentials"
        >
          📋 Copiar Credenciales
        </button>

        <button
          style="
            padding: 12px;
            background-color: #27ae60;
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          "
          @click="
            () => {
              showCredentialsModal = false
              createdUserCredentials = null
            }
          "
        >
          Cerrar
        </button>
      </div>
    </SimpleModal>

    <!-- Modal asignar vacaciones -->
    <SimpleModal
      v-if="showBalanceModal && selectedUser"
      title="🏖️ Asignar Días de Vacaciones"
      @close="
        () => {
          showBalanceModal = false
          selectedUser = null
          balanceDays = 0
        }
      "
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div
          style="
            padding: 12px;
            background-color: #e3f2fd;
            border-radius: 8px;
            color: #1565c0;
          "
        >
          <p style="margin: 0">
            <strong>Usuario:</strong>
            {{
              selectedUser.preferredUsername ||
              selectedUser.name ||
              selectedUser.username
            }}
          </p>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem">
            {{ selectedUser.email }}
          </p>
        </div>

        <div
          v-if="userBalances[selectedUser.username]"
          style="
            padding: 12px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #e9ecef;
          "
        >
          <p style="margin: 0 0 8px 0; font-weight: bold">Balance actual:</p>
          <div
            style="
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px;
              font-size: 0.9rem;
            "
          >
            <div>
              <span style="color: #666">Total asignado:</span>
              <strong style="margin-left: 8px"
                >{{ userBalances[selectedUser.username].totalDays }} días</strong
              >
            </div>
            <div>
              <span style="color: #666">Usados:</span>
              <strong style="margin-left: 8px; color: #dc2626"
                >{{ userBalances[selectedUser.username].usedDays }} días</strong
              >
            </div>
            <div>
              <span style="color: #666">Pendientes:</span>
              <strong style="margin-left: 8px; color: #f59e0b"
                >{{
                  userBalances[selectedUser.username].pendingDays
                }}
                días</strong
              >
            </div>
            <div>
              <span style="color: #666">Disponibles:</span>
              <strong style="margin-left: 8px; color: #059669"
                >{{
                  userBalances[selectedUser.username].availableDays
                }}
                días</strong
              >
            </div>
          </div>
        </div>

        <div>
          <label :style="labelStyle">
            Días totales de vacaciones para el año {{ currentYear }}
          </label>
          <input
            v-model.number="balanceDays"
            type="number"
            min="0"
            max="365"
            :style="inputStyle"
          />
          <p style="margin: 8px 0 0 0; font-size: 0.8rem; color: #666">
            Este es el total de días que el usuario puede solicitar durante el
            año.
          </p>
        </div>

        <div
          v-if="
            userBalances[selectedUser.username] &&
            balanceDays < userBalances[selectedUser.username].usedDays
          "
          style="
            padding: 12px;
            background-color: #fee2e2;
            border-radius: 8px;
            color: #dc2626;
            font-size: 0.9rem;
          "
        >
          ⚠️ No puedes asignar menos días de los que el usuario ya ha usado ({{
            userBalances[selectedUser.username].usedDays
          }}
          días).
        </div>

        <div style="display: flex; gap: 12px; margin-top: 8px">
          <button
            :disabled="
              operationLoading ||
              (!!userBalances[selectedUser.username] &&
                balanceDays < userBalances[selectedUser.username].usedDays)
            "
            :style="{
              flex: 1,
              padding: '12px',
              backgroundColor: operationLoading ? '#95a5a6' : '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: operationLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
            }"
            @click="handleSetBalance"
          >
            {{ operationLoading ? 'Guardando...' : 'Guardar' }}
          </button>
          <button
            style="
              padding: 12px 24px;
              background-color: #e9ecef;
              color: #333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-weight: bold;
            "
            @click="
              () => {
                showBalanceModal = false
                selectedUser = null
                balanceDays = 0
              }
            "
          >
            Cancelar
          </button>
        </div>
      </div>
    </SimpleModal>
  </div>
</template>
