<script setup lang="ts">
import { ref, computed, onMounted, watch, type Component } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  SunIcon,
  DocumentPlusIcon,
  Cog6ToothIcon,
  CalendarDaysIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '../composables/useAuth'
import { vacationApi } from '../services/vacationApi'
import { organizationApi } from '../services/organizationApi'
import type { VacationRequest } from '../types/vacation'
import type { OrganizationNode } from '../types/organization'
import {
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS,
  VACATION_TYPE_LABELS,
} from '../types/vacation'

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalDaysUsed: number
  pendingApprovals: number
}

const { userId, name, username, email, roles, isAdmin, isSuperAdmin } =
  useAuth()

const stats = ref<DashboardStats>({
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  totalDaysUsed: 0,
  pendingApprovals: 0,
})
const recentRequests = ref<VacationRequest[]>([])
const pendingApprovals = ref<VacationRequest[]>([])
const supervisor = ref<OrganizationNode | null>(null)
const isLoading = ref(true)

const isManager = computed(() => isAdmin.value || isSuperAdmin.value)

interface StatCard {
  title: string
  value: number
  icon: Component
  color: string
  link?: string
}

const statCards = computed<StatCard[]>(() => {
  const cards: StatCard[] = [
    {
      title: 'Mis Solicitudes',
      value: stats.value.totalRequests,
      icon: ClipboardDocumentListIcon,
      color: '#3b82f6',
    },
    {
      title: 'Pendientes',
      value: stats.value.pendingRequests,
      icon: ClockIcon,
      color: '#f59e0b',
    },
    {
      title: 'Aprobadas',
      value: stats.value.approvedRequests,
      icon: CheckCircleIcon,
      color: '#10b981',
    },
    {
      title: 'Días Usados',
      value: stats.value.totalDaysUsed,
      icon: SunIcon,
      color: '#8b5cf6',
    },
  ]
  if (isManager.value) {
    cards.push({
      title: 'Por Aprobar',
      value: stats.value.pendingApprovals,
      icon: DocumentPlusIcon,
      color: '#ef4444',
      link: '/approvals',
    })
  }
  return cards
})

interface QuickAction {
  to: string
  icon: Component
  label: string
  color: string
}

const quickActions = computed<QuickAction[]>(() => {
  const actions: QuickAction[] = [
    {
      to: '/vacations',
      icon: CalendarDaysIcon,
      label: 'Solicitar Vacaciones',
      color: '#10b981',
    },
    {
      to: '/vacations',
      icon: ClipboardDocumentListIcon,
      label: 'Mis Solicitudes',
      color: '#3b82f6',
    },
  ]
  if (isManager.value) {
    actions.push({
      to: '/approvals',
      icon: CheckCircleIcon,
      label: 'Aprobar Solicitudes',
      color: '#f59e0b',
    })
  }
  actions.push({
    to: '/profile',
    icon: Cog6ToothIcon,
    label: 'Mi Perfil',
    color: '#6b7280',
  })
  return actions
})

const infoRows = computed(() => {
  const rows = [
    { label: 'Email', value: email.value || '-' },
    { label: 'Usuario', value: name.value || username.value || '-' },
    { label: 'Roles', value: roles.value.join(', ') || 'Usuario' },
  ]
  if (supervisor.value) {
    rows.push({
      label: 'Supervisor',
      value: `${supervisor.value.userName} (${supervisor.value.position})`,
    })
  }
  return rows
})

function fmt(date: string): string {
  return new Date(date).toLocaleDateString()
}

async function loadDashboardData(): Promise<void> {
  if (!userId.value) return
  isLoading.value = true
  try {
    const myRequestsRes = await vacationApi.getMyRequests(userId.value)
    if (myRequestsRes.data) {
      const requests = myRequestsRes.data.requests
      recentRequests.value = requests.slice(0, 5)
      const approved = requests.filter((r) => r.status === 'APPROVED')
      const totalDays = approved.reduce((sum, r) => sum + r.totalDays, 0)
      stats.value = {
        ...stats.value,
        totalRequests: requests.length,
        pendingRequests: requests.filter((r) => r.status === 'PENDING').length,
        approvedRequests: approved.length,
        rejectedRequests: requests.filter((r) => r.status === 'REJECTED')
          .length,
        totalDaysUsed: totalDays,
      }
    }

    if (isManager.value) {
      const approvalsRes = await vacationApi.getPendingApprovals(userId.value)
      if (approvalsRes.data) {
        pendingApprovals.value = approvalsRes.data.requests.slice(0, 3)
        stats.value = {
          ...stats.value,
          pendingApprovals: approvalsRes.data.requests.length,
        }
      }
    }

    const orgRes = await organizationApi.getNodeByUserId(userId.value)
    if (
      orgRes.data?.node?.supervisorId &&
      orgRes.data.node.supervisorId !== 'ROOT'
    ) {
      const supervisorRes = await organizationApi.getNode(
        orgRes.data.node.supervisorId,
      )
      if (supervisorRes.data?.node) {
        supervisor.value = supervisorRes.data.node
      }
    }
  } catch (error) {
    console.error('Error loading dashboard:', error)
  }
  isLoading.value = false
}

onMounted(loadDashboardData)
watch(userId, loadDashboardData)

function onActionEnter(e: MouseEvent, color: string): void {
  const t = e.currentTarget as HTMLElement
  t.style.borderColor = color
  t.style.transform = 'translateY(-4px)'
  t.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)'
}
function onActionLeave(e: MouseEvent): void {
  const t = e.currentTarget as HTMLElement
  t.style.borderColor = 'transparent'
  t.style.transform = 'translateY(0)'
  t.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
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
    style="padding: 32px; max-width: 1200px; margin: 0 auto; color: #212529"
  >
    <!-- Header -->
    <div
      style="
        margin-bottom: 32px;
        padding: 24px;
        background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
        border-radius: 12px;
        color: #fff;
      "
    >
      <h1 style="font-size: 2rem; margin-bottom: 8px; color: #fff">
        👋 ¡Hola, {{ name || username || email?.split('@')[0] }}!
      </h1>
      <p style="color: rgba(255, 255, 255, 0.9); margin: 0">
        Rol: <strong>{{ roles.join(', ') || 'Usuario' }}</strong>
        <span v-if="supervisor" style="margin-left: 16px">
          | Supervisor: <strong>{{ supervisor.userName }}</strong>
        </span>
      </p>
    </div>

    <!-- Estadísticas -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      "
    >
      <component
        :is="card.link ? RouterLink : 'div'"
        v-for="card in statCards"
        :key="card.title"
        :to="card.link"
        :style="{ textDecoration: 'none' }"
      >
        <div
          :style="{
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${card.color}`,
            transition: 'all 0.2s ease',
          }"
        >
          <div style="display: flex; align-items: center; gap: 16px">
            <div
              :style="{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: `${card.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: card.color,
              }"
            >
              <component :is="card.icon" style="width: 28px; height: 28px" />
            </div>
            <div>
              <div style="font-size: 1.75rem; font-weight: 700; color: #1f2937">
                {{ card.value }}
              </div>
              <div
                style="font-size: 0.875rem; color: #6b7280; font-weight: 500"
              >
                {{ card.title }}
              </div>
            </div>
          </div>
        </div>
      </component>
    </div>

    <!-- Acciones rápidas -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 16px;
        margin-bottom: 32px;
      "
    >
      <RouterLink
        v-for="action in quickActions"
        :key="action.label + action.to"
        :to="action.to"
        style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          background-color: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          text-decoration: none;
          border: 2px solid transparent;
          transition: all 0.2s ease;
        "
        @mouseenter="onActionEnter($event, action.color)"
        @mouseleave="onActionLeave"
      >
        <div
          :style="{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            backgroundColor: `${action.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: action.color,
            marginBottom: '12px',
          }"
        >
          <component :is="action.icon" style="width: 32px; height: 32px" />
        </div>
        <span
          style="
            color: #1f2937;
            font-weight: 600;
            font-size: 0.875rem;
            text-align: center;
            line-height: 1.3;
          "
        >
          {{ action.label }}
        </span>
      </RouterLink>
    </div>

    <!-- Contenido principal -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 24px;
      "
    >
      <!-- Mis solicitudes recientes -->
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
            🏖️ Mis Solicitudes Recientes
          </h2>
          <RouterLink
            to="/vacations"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
          >
            Ver todas →
          </RouterLink>
        </div>

        <div
          v-if="recentRequests.length === 0"
          style="text-align: center; padding: 32px; color: #666"
        >
          <p>No tienes solicitudes de vacaciones</p>
          <RouterLink
            to="/vacations"
            style="
              display: inline-block;
              padding: 10px 20px;
              background-color: #27ae60;
              color: #fff;
              border-radius: 8px;
              text-decoration: none;
              font-weight: bold;
              margin-top: 12px;
            "
          >
            Crear Solicitud
          </RouterLink>
        </div>

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
                  {{ VACATION_TYPE_LABELS[request.type] }}
                </div>
                <div style="font-size: 0.85rem; color: #666">
                  {{ fmt(request.startDate) }} - {{ fmt(request.endDate) }}
                  <span style="margin-left: 8px"
                    >({{ request.totalDays }} días)</span
                  >
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

      <!-- Aprobaciones pendientes -->
      <div
        v-if="isManager"
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
            📝 Solicitudes por Aprobar
          </h2>
          <RouterLink
            to="/approvals"
            style="color: #3498db; text-decoration: none; font-size: 0.9rem"
          >
            Ver todas →
          </RouterLink>
        </div>

        <div
          v-if="pendingApprovals.length === 0"
          style="text-align: center; padding: 32px; color: #666"
        >
          <p>🎉 No tienes solicitudes pendientes</p>
        </div>

        <div v-else style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="request in pendingApprovals"
            :key="request.id"
            style="
              padding: 12px;
              background-color: #fff3cd;
              border-radius: 8px;
              border-left: 4px solid #f39c12;
            "
          >
            <div style="font-weight: bold; color: #212529">
              {{ request.requesterName }}
            </div>
            <div style="font-size: 0.85rem; color: #666">
              {{ VACATION_TYPE_LABELS[request.type] }} · {{ request.totalDays }}
              días
            </div>
            <div style="font-size: 0.8rem; color: #856404">
              {{ fmt(request.startDate) }} - {{ fmt(request.endDate) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Información del usuario -->
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        "
      >
        <h2
          style="
            font-size: 1.25rem;
            margin: 0 0 16px 0;
            color: #212529;
          "
        >
          👤 Mi Información
        </h2>
        <div style="display: flex; flex-direction: column; gap: 12px">
          <div
            v-for="row in infoRows"
            :key="row.label"
            style="
              display: flex;
              justify-content: space-between;
              padding: 8px 12px;
              background-color: #f8f9fa;
              border-radius: 6px;
            "
          >
            <span style="color: #666; font-weight: bold">{{ row.label }}</span>
            <span style="color: #212529">{{ row.value }}</span>
          </div>
        </div>
        <RouterLink
          to="/profile"
          style="
            display: block;
            text-align: center;
            padding: 10px;
            background-color: #f8f9fa;
            color: #3498db;
            border-radius: 8px;
            text-decoration: none;
            margin-top: 16px;
            font-weight: bold;
          "
        >
          ⚙️ Editar Perfil
        </RouterLink>
      </div>
    </div>
  </div>
</template>
