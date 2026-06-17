<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import { vacationApi } from '../services/vacationApi'
import { organizationApi } from '../services/organizationApi'
import { userManagementApi } from '../services/userManagementApi'
import { auditApi } from '../services/auditApi'
import type { VacationRequest } from '../types/vacation'
import type { OrganizationNode } from '../types/organization'
import type { AuditLog } from '../types/audit'
import type { CognitoUser } from '../services/userManagementApi'
import {
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS,
} from '../types/vacation'
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_ICONS } from '../types/audit'

interface DashboardStats {
  totalUsers: number
  totalOrganizationNodes: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalRequests: number
}

const { roles, username } = useAuth()

const stats = ref<DashboardStats>({
  totalUsers: 0,
  totalOrganizationNodes: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalRequests: 0,
})
const recentRequests = ref<VacationRequest[]>([])
const recentLogs = ref<AuditLog[]>([])
const users = ref<CognitoUser[]>([])
const orgNodes = ref<OrganizationNode[]>([])
const isLoading = ref(true)

interface SuperStatCard {
  title: string
  value: number
  icon: string
  color: string
  link?: string
}

const statCards = computed<SuperStatCard[]>(() => [
  { title: 'Usuarios Totales', value: stats.value.totalUsers, icon: '👥', color: '#3498db', link: '/users' },
  { title: 'En Organización', value: stats.value.totalOrganizationNodes, icon: '🏢', color: '#9b59b6', link: '/organization' },
  { title: 'Pendientes', value: stats.value.pendingRequests, icon: '⏳', color: '#f39c12', link: '/approvals' },
  { title: 'Aprobadas', value: stats.value.approvedRequests, icon: '✅', color: '#27ae60' },
  { title: 'Rechazadas', value: stats.value.rejectedRequests, icon: '❌', color: '#e74c3c' },
  { title: 'Total Solicitudes', value: stats.value.totalRequests, icon: '📋', color: '#17a2b8', link: '/audit' },
])

const quickAccess = [
  { to: '/users', icon: '👥', title: 'Usuarios', color: '#3498db' },
  { to: '/organization', icon: '🏢', title: 'Organización', color: '#9b59b6' },
  { to: '/approvals', icon: '✅', title: 'Aprobaciones', color: '#27ae60' },
  { to: '/vacations', icon: '🏖️', title: 'Vacaciones', color: '#f39c12' },
  { to: '/audit', icon: '📋', title: 'Auditoría', color: '#e74c3c' },
  { to: '/profile', icon: '⚙️', title: 'Perfil', color: '#6c757d' },
]

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function groupBadge(group: string): { bg: string; color: string } {
  if (group === 'super_admin') return { bg: '#f8d7da', color: '#721c24' }
  if (group === 'admin') return { bg: '#fff3cd', color: '#856404' }
  return { bg: '#e3f2fd', color: '#0c5460' }
}

async function loadDashboardData(): Promise<void> {
  isLoading.value = true
  try {
    const [usersRes, orgRes, vacationsRes, auditRes] = await Promise.all([
      userManagementApi.listUsers(),
      organizationApi.getTree(),
      vacationApi.getAllRequests(),
      auditApi.getAuditLogs(),
    ])

    if (usersRes.data) users.value = usersRes.data.users
    if (orgRes.data) orgNodes.value = orgRes.data.nodes

    if (vacationsRes.data) {
      const requests = vacationsRes.data.requests
      recentRequests.value = requests.slice(0, 5)
      stats.value = {
        ...stats.value,
        totalUsers: usersRes.data?.users.length || 0,
        totalOrganizationNodes: orgRes.data?.nodes.length || 0,
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === 'PENDING').length,
        approvedRequests: requests.filter((r) => r.status === 'APPROVED')
          .length,
        rejectedRequests: requests.filter((r) => r.status === 'REJECTED')
          .length,
      }
    }

    if (auditRes.data) recentLogs.value = auditRes.data.logs.slice(0, 5)
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
  isLoading.value = false
}

onMounted(loadDashboardData)

function onAccessEnter(e: MouseEvent, color: string): void {
  const t = e.currentTarget as HTMLElement
  t.style.transform = 'translateY(-4px)'
  t.style.borderColor = color
}
function onAccessLeave(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.transform = 'translateY(0)'
  t.style.borderColor = 'transparent'
}
</script>

<template>
  <div
    v-if="isLoading"
    style="
      display: flex;
      justify-content: center;
      align-items: center;
      height: calc(100vh - 100px);
      color: #212529;
    "
  >
    Cargando dashboard...
  </div>

  <div
    v-else
    style="padding: 32px; max-width: 1400px; margin: 0 auto; color: #212529"
  >
    <!-- Header -->
    <div
      style="
        margin-bottom: 32px;
        padding: 24px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: #fff;
      "
    >
      <h1 style="font-size: 2rem; margin-bottom: 8px; color: #fff">
        👑 Panel de Super Administrador
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 0">
        Bienvenido, <strong>{{ username }}</strong> • Rol:
        <strong>{{ roles.join(', ') }}</strong>
      </p>
    </div>

    <!-- Estadísticas -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      "
    >
      <component
        :is="card.link ? RouterLink : 'div'"
        v-for="card in statCards"
        :key="card.title"
        :to="card.link"
        style="text-decoration: none"
      >
        <div
          :style="{
            backgroundColor: '#fff',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderTop: `4px solid ${card.color}`,
            cursor: card.link ? 'pointer' : 'default',
          }"
        >
          <div style="display: flex; align-items: center; gap: 12px">
            <span style="font-size: 2rem">{{ card.icon }}</span>
            <div>
              <div :style="{ fontSize: '1.75rem', fontWeight: 'bold', color: card.color }">
                {{ card.value }}
              </div>
              <div style="font-size: 0.85rem; color: #666">
                {{ card.title }}
              </div>
            </div>
          </div>
        </div>
      </component>
    </div>

    <!-- Accesos rápidos -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      "
    >
      <RouterLink
        v-for="qa in quickAccess"
        :key="qa.to + qa.title"
        :to="qa.to"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-color: #fff;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          border: 2px solid transparent;
          transition: all 0.2s;
        "
        @mouseenter="onAccessEnter($event, qa.color)"
        @mouseleave="onAccessLeave"
      >
        <span style="font-size: 2rem; margin-bottom: 8px">{{ qa.icon }}</span>
        <span
          style="
            color: #212529;
            font-weight: bold;
            font-size: 0.9rem;
            text-align: center;
          "
          >{{ qa.title }}</span
        >
      </RouterLink>
    </div>

    <!-- Contenido en grid -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 24px;
      "
    >
      <!-- Últimas solicitudes -->
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h2 style="font-size: 1.25rem; margin: 0; color: #212529">
            🏖️ Últimas Solicitudes
          </h2>
          <RouterLink
            to="/audit"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
            >Ver todas →</RouterLink
          >
        </div>

        <p
          v-if="recentRequests.length === 0"
          style="color: #666; text-align: center; padding: 20px"
        >
          No hay solicitudes
        </p>
        <div v-else style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="request in recentRequests"
            :key="request.id"
            :style="{
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              borderLeft: `4px solid ${VACATION_STATUS_COLORS[request.status].text}`,
            }"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <div>
                <div style="font-weight: bold; color: #212529">
                  {{ request.requesterName }}
                </div>
                <div style="font-size: 0.85rem; color: #666">
                  {{ new Date(request.startDate).toLocaleDateString() }} ({{
                    request.totalDays
                  }}
                  días)
                </div>
              </div>
              <span
                :style="{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  backgroundColor: VACATION_STATUS_COLORS[request.status].bg,
                  color: VACATION_STATUS_COLORS[request.status].text,
                }"
              >
                {{ VACATION_STATUS_LABELS[request.status] }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actividad reciente -->
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h2 style="font-size: 1.25rem; margin: 0; color: #212529">
            📋 Actividad Reciente
          </h2>
          <RouterLink
            to="/audit"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
            >Ver todo →</RouterLink
          >
        </div>

        <p
          v-if="recentLogs.length === 0"
          style="color: #666; text-align: center; padding: 20px"
        >
          No hay actividad
        </p>
        <div v-else style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="log in recentLogs"
            :key="log.id"
            style="
              padding: 12px;
              background-color: #f8f9fa;
              border-radius: 8px;
              display: flex;
              align-items: center;
              gap: 12px;
            "
          >
            <span style="font-size: 1.5rem">{{
              AUDIT_ACTION_ICONS[log.action] || '📝'
            }}</span>
            <div style="flex: 1">
              <div
                style="font-weight: bold; color: #212529; font-size: 0.9rem"
              >
                {{ AUDIT_ACTION_LABELS[log.action] || log.action }}
              </div>
              <div style="font-size: 0.8rem; color: #666">
                {{ log.userEmail }} · {{ formatDate(log.createdAt) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Usuarios -->
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h2 style="font-size: 1.25rem; margin: 0; color: #212529">
            👥 Usuarios
          </h2>
          <RouterLink
            to="/users"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
            >Gestionar →</RouterLink
          >
        </div>

        <div style="display: flex; flex-direction: column; gap: 8px">
          <div
            v-for="user in users.slice(0, 5)"
            :key="user.username"
            style="
              padding: 10px 12px;
              background-color: #f8f9fa;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            "
          >
            <div>
              <div style="font-weight: bold; color: #212529">
                {{
                  user.preferredUsername ||
                  user.name ||
                  user.email?.split('@')[0]
                }}
              </div>
              <div style="font-size: 0.8rem; color: #666">{{ user.email }}</div>
            </div>
            <div style="display: flex; gap: 4px">
              <span
                v-for="group in user.groups.slice(0, 2)"
                :key="group"
                :style="{
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  backgroundColor: groupBadge(group).bg,
                  color: groupBadge(group).color,
                }"
              >
                {{ group }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Organización -->
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          "
        >
          <h2 style="font-size: 1.25rem; margin: 0; color: #212529">
            🏢 Organización
          </h2>
          <RouterLink
            to="/organization"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
            >Gestionar →</RouterLink
          >
        </div>

        <div
          v-if="orgNodes.length === 0"
          style="text-align: center; padding: 20px"
        >
          <p style="color: #666; margin-bottom: 16px">Sin estructura definida</p>
          <RouterLink
            to="/organization"
            style="
              padding: 10px 20px;
              background-color: #9b59b6;
              color: #fff;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
            "
          >
            Crear Estructura
          </RouterLink>
        </div>
        <div v-else style="display: flex; flex-direction: column; gap: 8px">
          <div
            v-for="node in orgNodes.slice(0, 5)"
            :key="node.id"
            :style="{
              padding: '10px 12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderLeft: `4px solid ${node.level === 0 ? '#9b59b6' : '#dee2e6'}`,
            }"
          >
            <div>
              <div style="font-weight: bold; color: #212529">
                {{ node.userName }}
              </div>
              <div style="font-size: 0.8rem; color: #666">
                {{ node.position }}
              </div>
            </div>
            <span
              style="
                padding: 2px 8px;
                background-color: #e9ecef;
                border-radius: 4px;
                font-size: 0.75rem;
                color: #495057;
              "
            >
              {{ node.department }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
