<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  BuildingOffice2Icon,
  PlusIcon,
  UserGroupIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BriefcaseIcon,
  UserIcon,
  ArrowPathIcon,
} from '@heroicons/vue/24/outline'
import { BuildingOffice2Icon as BuildingOffice2IconSolid } from '@heroicons/vue/24/solid'
import { useAuth } from '../../composables/useAuth'
import { organizationApi } from '../../services/organizationApi'
import { type OrganizationNode, DEPARTMENTS } from '../../types/organization'
import {
  userManagementApi,
  type CognitoUser,
} from '../../services/userManagementApi'
import { getAnyUserProfilePictureUrl } from '../../services/profilePictureService'
import { UserAvatar } from '../../components/ui'
import TreeNode from '../../components/org/TreeNode.vue'

const { isSuperAdmin } = useAuth()

const nodes = ref<OrganizationNode[]>([])
const tree = ref<OrganizationNode[]>([])
const cognitoUsers = ref<CognitoUser[]>([])
const userPhotos = ref<Record<string, string | null>>({})
const isLoading = ref(true)
const error = ref<string | null>(null)
const showAddModal = ref(false)
const isSubmitting = ref(false)

const newNode = ref({
  userId: '',
  userEmail: '',
  userName: '',
  position: '',
  department: DEPARTMENTS[0] as string,
  supervisorId: '',
})

const availableUsers = computed(() =>
  cognitoUsers.value.filter(
    (user) => !nodes.value.some((node) => node.userId === user.username),
  ),
)

async function loadData(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    const [treeResponse, usersResponse] = await Promise.all([
      organizationApi.getTree(),
      userManagementApi.listUsers(),
    ])
    if (treeResponse.error) {
      error.value = treeResponse.error
    } else if (treeResponse.data) {
      nodes.value = treeResponse.data.nodes
      tree.value = treeResponse.data.tree
    }
    if (usersResponse.data) {
      cognitoUsers.value = usersResponse.data.users
    }
  } catch (err) {
    error.value = (err as Error).message
  }
  isLoading.value = false
}

onMounted(loadData)

watch(nodes, async (list) => {
  if (list.length === 0) return
  const photos: Record<string, string | null> = {}
  for (const node of list) {
    photos[node.userId] = await getAnyUserProfilePictureUrl(node.userId)
  }
  userPhotos.value = photos
})

function handleUserSelect(userId: string): void {
  const user = cognitoUsers.value.find((u) => u.username === userId)
  if (user) {
    newNode.value = {
      ...newNode.value,
      userId: user.username,
      userEmail: user.email || '',
      userName:
        user.preferredUsername ||
        user.name ||
        user.email?.split('@')[0] ||
        user.username,
    }
  }
}

async function handleAddNode(): Promise<void> {
  if (
    !newNode.value.userId ||
    !newNode.value.position ||
    !newNode.value.department
  ) {
    alert('Por favor completa todos los campos requeridos')
    return
  }
  isSubmitting.value = true
  const response = await organizationApi.createNode({
    userId: newNode.value.userId,
    userEmail: newNode.value.userEmail,
    userName: newNode.value.userName,
    position: newNode.value.position,
    department: newNode.value.department,
    supervisorId: newNode.value.supervisorId || undefined,
  })
  isSubmitting.value = false
  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  newNode.value = {
    userId: '',
    userEmail: '',
    userName: '',
    position: '',
    department: DEPARTMENTS[0],
    supervisorId: '',
  }
  showAddModal.value = false
  loadData()
  alert('Nodo agregado exitosamente al árbol organizacional.')
}

async function handleDeleteNode(nodeId: string, nodeName: string): Promise<void> {
  if (
    !confirm(
      `¿Estás seguro de eliminar a "${nodeName}" del árbol organizacional?`,
    )
  )
    return
  const response = await organizationApi.deleteNode(nodeId)
  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  loadData()
  alert('Nodo eliminado exitosamente.')
}
</script>

<template>
  <div
    v-if="!isSuperAdmin"
    style="
      padding: 64px 32px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    "
  >
    <div
      style="
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: #fef2f2;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <ExclamationTriangleIcon
        style="width: 40px; height: 40px; color: #dc2626"
      />
    </div>
    <h1 style="font-size: 1.5rem; color: #1f2937; margin: 0">
      Acceso Denegado
    </h1>
    <p style="color: #6b7280; margin: 0">
      Solo el Super Admin puede gestionar el árbol organizacional.
    </p>
  </div>

  <div
    v-else-if="isLoading"
    style="
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: calc(100vh - 100px);
      gap: 16px;
    "
  >
    <ArrowPathIcon
      style="
        width: 40px;
        height: 40px;
        color: #3b82f6;
        animation: spin 1s linear infinite;
      "
    />
    <span style="color: #6b7280">Cargando estructura organizacional...</span>
  </div>

  <div v-else style="padding: 32px; max-width: 1400px; margin: 0 auto">
    <!-- Header -->
    <div
      style="
        background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
        border-radius: 16px;
        padding: 28px 32px;
        margin-bottom: 32px;
        color: #fff;
        display: flex;
        justify-content: space-between;
        align-items: center;
      "
    >
      <div style="display: flex; align-items: center; gap: 16px">
        <div
          style="
            width: 56px;
            height: 56px;
            border-radius: 14px;
            background-color: rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
          "
        >
          <BuildingOffice2IconSolid
            style="width: 32px; height: 32px; color: #fff"
          />
        </div>
        <div>
          <h1 style="font-size: 1.75rem; margin: 0; font-weight: 700; color: #fff">
            Árbol Organizacional
          </h1>
          <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 0.95rem">
            Define la estructura jerárquica de la organización
          </p>
        </div>
      </div>

      <div style="display: flex; gap: 12px">
        <button
          title="Refrescar datos"
          style="
            padding: 12px;
            background-color: rgba(255, 255, 255, 0.2);
            color: #fff;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background-color 0.2s;
          "
          @click="loadData"
        >
          <ArrowPathIcon style="width: 20px; height: 20px" />
        </button>
        <button
          :disabled="availableUsers.length === 0"
          :style="{
            padding: '12px 20px',
            backgroundColor:
              availableUsers.length === 0
                ? 'rgba(255,255,255,0.3)'
                : '#fff',
            color:
              availableUsers.length === 0
                ? 'rgba(255,255,255,0.7)'
                : '#6366f1',
            border: 'none',
            borderRadius: '10px',
            cursor: availableUsers.length === 0 ? 'not-allowed' : 'pointer',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s',
          }"
          @click="showAddModal = true"
        >
          <PlusIcon style="width: 20px; height: 20px" />
          Agregar al Árbol
        </button>
      </div>
    </div>

    <div
      v-if="error"
      style="
        padding: 14px 18px;
        background-color: #fef2f2;
        color: #991b1b;
        border-radius: 10px;
        margin-bottom: 24px;
        border: 1px solid #fecaca;
        display: flex;
        align-items: center;
        gap: 10px;
      "
    >
      <ExclamationTriangleIcon
        style="width: 20px; height: 20px; flex-shrink: 0"
      />
      {{ error }}
    </div>

    <!-- Vista del árbol -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px">
      <!-- Árbol visual -->
      <div
        style="
          background-color: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
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
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <BuildingOffice2Icon style="width: 22px; height: 22px; color: #fff" />
          </div>
          <div>
            <h2
              style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
            >
              Estructura Jerárquica
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 0.8rem">
              Vista en árbol de la organización
            </p>
          </div>
        </div>

        <div
          v-if="tree.length === 0"
          style="
            text-align: center;
            padding: 48px 24px;
            background-color: #f9fafb;
            border-radius: 12px;
            border: 2px dashed #e5e7eb;
          "
        >
          <UserGroupIcon
            style="width: 48px; height: 48px; color: #9ca3af; margin: 0 auto 12px"
          />
          <p style="color: #6b7280; margin: 0; font-size: 0.95rem">
            No hay nodos en el árbol.
          </p>
          <p style="color: #9ca3af; margin: 4px 0 0 0; font-size: 0.85rem">
            Agrega usuarios para comenzar a construir la estructura.
          </p>
        </div>
        <div v-else style="max-height: 500px; overflow-y: auto">
          <TreeNode
            v-for="node in tree"
            :key="node.id"
            :node="node"
            :level="0"
            :user-photos="userPhotos"
            @delete="handleDeleteNode"
          />
        </div>
      </div>

      <!-- Lista de miembros -->
      <div
        style="
          background-color: #fff;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
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
              width: 40px;
              height: 40px;
              border-radius: 10px;
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              display: flex;
              align-items: center;
              justify-content: center;
            "
          >
            <UserGroupIcon style="width: 22px; height: 22px; color: #fff" />
          </div>
          <div>
            <h2
              style="margin: 0; color: #1f2937; font-size: 1.1rem; font-weight: 600"
            >
              Todos los Miembros
            </h2>
            <p style="margin: 0; color: #6b7280; font-size: 0.8rem">
              {{ nodes.length }} miembro{{ nodes.length !== 1 ? 's' : '' }} en la
              organización
            </p>
          </div>
        </div>

        <div
          style="
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 500px;
            overflow-y: auto;
          "
        >
          <div
            v-if="nodes.length === 0"
            style="
              text-align: center;
              padding: 48px 24px;
              background-color: #f9fafb;
              border-radius: 12px;
              border: 2px dashed #e5e7eb;
            "
          >
            <UserIcon
              style="
                width: 48px;
                height: 48px;
                color: #9ca3af;
                margin: 0 auto 12px;
              "
            />
            <p style="color: #6b7280; margin: 0">No hay miembros registrados.</p>
          </div>
          <div
            v-for="node in nodes"
            v-else
            :key="node.id"
            style="
              padding: 14px 16px;
              background-color: #f9fafb;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 12px;
              border: 1px solid #f3f4f6;
              transition: all 0.2s;
            "
          >
            <UserAvatar
              :name="node.userName"
              :photo-url="userPhotos[node.userId]"
              size="md"
              :show-border="true"
            />
            <div style="flex: 1">
              <div style="font-weight: 600; color: #1f2937; font-size: 0.95rem">
                {{ node.userName }}
              </div>
              <div
                style="
                  font-size: 0.8rem;
                  color: #6b7280;
                  display: flex;
                  align-items: center;
                  gap: 6px;
                "
              >
                <BriefcaseIcon style="width: 12px; height: 12px" />
                {{ node.position }} · {{ node.department }}
              </div>
            </div>
            <span
              :style="{
                padding: '4px 10px',
                backgroundColor: node.level === 0 ? '#dbeafe' : '#f0fdf4',
                color: node.level === 0 ? '#1d4ed8' : '#166534',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
              }"
            >
              Nivel {{ node.level }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de agregar -->
    <div
      v-if="showAddModal"
      style="
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
      "
      @click="showAddModal = false"
    >
      <div
        style="
          background-color: #fff;
          border-radius: 16px;
          padding: 28px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        "
        @click.stop
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          "
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <div
              style="
                width: 44px;
                height: 44px;
                border-radius: 12px;
                background: linear-gradient(135deg, #10b981 0%, #059669 100%);
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              <PlusIcon style="width: 24px; height: 24px; color: #fff" />
            </div>
            <div>
              <h2
                style="margin: 0; font-size: 1.25rem; font-weight: 600; color: #1f2937"
              >
                Agregar al Árbol
              </h2>
              <p style="margin: 0; font-size: 0.85rem; color: #6b7280">
                Asigna un usuario a la estructura
              </p>
            </div>
          </div>
          <button
            style="
              width: 36px;
              height: 36px;
              border-radius: 10px;
              border: none;
              background-color: #f3f4f6;
              color: #6b7280;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            "
            @click="showAddModal = false"
          >
            <XMarkIcon style="width: 20px; height: 20px" />
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 18px">
          <div>
            <label
              style="
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 0.9rem;
              "
            >
              Usuario *
            </label>
            <select
              :value="newNode.userId"
              style="
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                font-size: 0.95rem;
                background-color: #fff;
                cursor: pointer;
              "
              @change="
                handleUserSelect(($event.target as HTMLSelectElement).value)
              "
            >
              <option value="">Seleccionar usuario...</option>
              <option
                v-for="user in availableUsers"
                :key="user.username"
                :value="user.username"
              >
                {{ user.preferredUsername || user.name || user.email }} ({{
                  user.email
                }})
              </option>
            </select>
          </div>

          <div>
            <label
              style="
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 0.9rem;
              "
            >
              Cargo/Posición *
            </label>
            <input
              v-model="newNode.position"
              type="text"
              placeholder="Ej: Gerente de Proyectos"
              style="
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                font-size: 0.95rem;
                box-sizing: border-box;
              "
            />
          </div>

          <div>
            <label
              style="
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 0.9rem;
              "
            >
              Departamento *
            </label>
            <select
              v-model="newNode.department"
              style="
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                font-size: 0.95rem;
                background-color: #fff;
                cursor: pointer;
              "
            >
              <option v-for="dept in DEPARTMENTS" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
          </div>

          <div>
            <label
              style="
                display: block;
                margin-bottom: 6px;
                font-weight: 600;
                color: #374151;
                font-size: 0.9rem;
              "
            >
              Supervisor (Jefe directo)
            </label>
            <select
              v-model="newNode.supervisorId"
              style="
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                font-size: 0.95rem;
                background-color: #fff;
                cursor: pointer;
              "
            >
              <option value="">Sin supervisor (nivel raíz)</option>
              <option v-for="node in nodes" :key="node.id" :value="node.id">
                {{ node.userName }} - {{ node.position }}
              </option>
            </select>
            <p style="color: #9ca3af; font-size: 0.8rem; margin: 6px 0 0 0">
              Si no seleccionas supervisor, este usuario será nivel raíz.
            </p>
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px">
            <button
              style="
                flex: 1;
                padding: 14px;
                background-color: #f3f4f6;
                color: #374151;
                border: none;
                border-radius: 10px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.95rem;
              "
              @click="showAddModal = false"
            >
              Cancelar
            </button>
            <button
              :disabled="isSubmitting"
              :style="{
                flex: 1,
                padding: '14px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '0.95rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }"
              @click="handleAddNode"
            >
              <template v-if="isSubmitting">
                <ArrowPathIcon
                  style="
                    width: 18px;
                    height: 18px;
                    animation: spin 1s linear infinite;
                  "
                />
                Guardando...
              </template>
              <template v-else>
                <CheckCircleIcon style="width: 18px; height: 18px" />
                Agregar
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
