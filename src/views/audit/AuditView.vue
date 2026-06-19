<script setup lang="ts">
import { ref, computed, onMounted, watch, type CSSProperties } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { auditApi } from '../../services/auditApi'
import {
  type AuditLog,
  type AuditAction,
  type AuditEntityType,
  AUDIT_ACTION_LABELS,
  AUDIT_ACTION_ICONS,
} from '../../types/audit'

const { isSuperAdmin } = useAuth()

const logs = ref<AuditLog[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const actionFilter = ref('')
const entityFilter = ref('')

const actionOptions = Object.entries(AUDIT_ACTION_LABELS)

const tableHeaderStyle: CSSProperties = {
  padding: '16px 12px',
  textAlign: 'left',
  fontWeight: 'bold',
  color: '#495057',
}
const tableCellStyle: CSSProperties = {
  padding: '16px 12px',
  verticalAlign: 'top',
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getActionColor(action: AuditAction): string {
  switch (action) {
    case 'REQUEST_APPROVED':
      return '#27ae60'
    case 'REQUEST_REJECTED':
      return '#e74c3c'
    case 'REQUEST_CANCELLED':
      return '#95a5a6'
    case 'REQUEST_CREATED':
      return '#3498db'
    case 'HIERARCHY_CREATED':
    case 'HIERARCHY_UPDATED':
      return '#9b59b6'
    case 'HIERARCHY_DELETED':
      return '#e74c3c'
    case 'USER_ASSIGNED':
      return '#f39c12'
    default:
      return '#666'
  }
}

async function loadLogs(): Promise<void> {
  isLoading.value = true
  error.value = null
  const response = await auditApi.getAuditLogs({
    action: (actionFilter.value as AuditAction) || undefined,
    entityType: (entityFilter.value as AuditEntityType) || undefined,
  })
  if (response.error) {
    error.value = response.error
  } else if (response.data) {
    logs.value = response.data.logs
  }
  isLoading.value = false
}

onMounted(loadLogs)
watch([actionFilter, entityFilter], loadLogs)

function clearFilters(): void {
  actionFilter.value = ''
  entityFilter.value = ''
}

const statCards = computed(() => [
  {
    title: 'Solicitudes Creadas',
    count: logs.value.filter((l) => l.action === 'REQUEST_CREATED').length,
    icon: '📝',
    color: '#3498db',
  },
  {
    title: 'Solicitudes Aprobadas',
    count: logs.value.filter((l) => l.action === 'REQUEST_APPROVED').length,
    icon: '✅',
    color: '#27ae60',
  },
  {
    title: 'Solicitudes Rechazadas',
    count: logs.value.filter((l) => l.action === 'REQUEST_REJECTED').length,
    icon: '❌',
    color: '#e74c3c',
  },
  {
    title: 'Cambios en Jerarquía',
    count: logs.value.filter((l) => l.action.startsWith('HIERARCHY_')).length,
    icon: '🏢',
    color: '#9b59b6',
  },
])
</script>

<template>
  <div v-if="!isSuperAdmin" style="padding: 32px; text-align: center">
    <h1>⛔ Acceso Denegado</h1>
    <p>Solo el Super Admin puede acceder al registro de auditoría.</p>
  </div>

  <div v-else style="padding: 32px; max-width: 1400px; margin: 0 auto">
    <div style="margin-bottom: 32px">
      <h1 style="font-size: 2rem; margin-bottom: 8px">
        📋 Registro de Auditoría
      </h1>
      <p style="color: #666">
        Visualiza todas las acciones realizadas en el sistema de vacaciones.
      </p>
    </div>

    <!-- Filtros -->
    <div
      style="
        display: flex;
        gap: 16px;
        margin-bottom: 24px;
        padding: 16px;
        background-color: #fff;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        flex-wrap: wrap;
        align-items: center;
      "
    >
      <div>
        <label
          style="
            display: block;
            margin-bottom: 4px;
            font-weight: bold;
            font-size: 0.9rem;
          "
        >
          Filtrar por acción
        </label>
        <select
          v-model="actionFilter"
          style="
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
            min-width: 200px;
          "
        >
          <option value="">Todas las acciones</option>
          <option v-for="[value, label] in actionOptions" :key="value" :value="value">
            {{ label }}
          </option>
        </select>
      </div>

      <div>
        <label
          style="
            display: block;
            margin-bottom: 4px;
            font-weight: bold;
            font-size: 0.9rem;
          "
        >
          Filtrar por tipo
        </label>
        <select
          v-model="entityFilter"
          style="
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #ddd;
            min-width: 200px;
          "
        >
          <option value="">Todos los tipos</option>
          <option value="VacationRequest">Solicitudes de Vacaciones</option>
          <option value="OrganizationNode">Árbol Organizacional</option>
          <option value="User">Usuarios</option>
        </select>
      </div>

      <button
        style="
          padding: 8px 16px;
          background-color: #6c757d;
          color: #fff;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 20px;
        "
        @click="clearFilters"
      >
        🔄 Limpiar filtros
      </button>

      <div style="margin-left: auto; margin-top: 20px; color: #666">
        {{ logs.length }} registro(s)
      </div>
    </div>

    <div
      v-if="error"
      style="
        padding: 12px;
        background-color: #f8d7da;
        color: #721c24;
        border-radius: 8px;
        margin-bottom: 24px;
      "
    >
      ⚠️ {{ error }}
    </div>

    <div
      v-if="isLoading"
      style="text-align: center; padding: 48px; color: #666"
    >
      Cargando registros de auditoría...
    </div>
    <div
      v-else-if="logs.length === 0"
      style="
        text-align: center;
        padding: 48px;
        background-color: #fff;
        border-radius: 12px;
        color: #666;
      "
    >
      No hay registros de auditoría.
    </div>
    <div
      v-else
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
            <th :style="tableHeaderStyle">Fecha/Hora</th>
            <th :style="tableHeaderStyle">Acción</th>
            <th :style="tableHeaderStyle">Tipo</th>
            <th :style="tableHeaderStyle">Usuario</th>
            <th :style="tableHeaderStyle">Detalles</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="log in logs"
            :key="log.id"
            style="border-bottom: 1px solid #e9ecef"
          >
            <td :style="tableCellStyle">
              <div style="font-size: 0.9rem; color: #666">
                {{ formatDate(log.createdAt) }}
              </div>
            </td>
            <td :style="tableCellStyle">
              <span
                :style="{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  backgroundColor: `${getActionColor(log.action)}15`,
                  color: getActionColor(log.action),
                  borderRadius: '16px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }"
              >
                {{ AUDIT_ACTION_ICONS[log.action] }}
                {{ AUDIT_ACTION_LABELS[log.action] }}
              </span>
            </td>
            <td :style="tableCellStyle">
              <span
                style="
                  padding: 4px 8px;
                  background-color: #e9ecef;
                  border-radius: 4px;
                  font-size: 0.85rem;
                "
              >
                {{ log.entityType }}
              </span>
            </td>
            <td :style="tableCellStyle">
              <div style="font-weight: bold; font-size: 0.9rem">
                {{ log.userEmail }}
              </div>
              <div
                style="font-size: 0.8rem; color: #888; font-family: monospace"
              >
                {{ log.userId.substring(0, 20) }}...
              </div>
            </td>
            <td :style="tableCellStyle">
              <details v-if="log.details" style="font-size: 0.85rem">
                <summary style="cursor: pointer; color: #3498db">
                  Ver detalles
                </summary>
                <pre
                  style="
                    background-color: #f8f9fa;
                    padding: 8px;
                    border-radius: 4px;
                    font-size: 0.8rem;
                    overflow: auto;
                    max-width: 300px;
                    margin-top: 8px;
                  "
                  >{{ JSON.stringify(log.details, null, 2) }}</pre
                >
              </details>
              <span v-else style="color: #888; font-size: 0.85rem">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Estadísticas rápidas -->
    <div
      style="
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-top: 32px;
      "
    >
      <div
        v-for="card in statCards"
        :key="card.title"
        :style="{
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderLeft: `4px solid ${card.color}`,
        }"
      >
        <div style="display: flex; align-items: center; gap: 12px">
          <span style="font-size: 2rem">{{ card.icon }}</span>
          <div>
            <div :style="{ fontSize: '1.5rem', fontWeight: 'bold', color: card.color }">
              {{ card.count }}
            </div>
            <div style="font-size: 0.9rem; color: #666">{{ card.title }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
