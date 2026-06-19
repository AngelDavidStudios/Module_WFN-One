<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  CalendarDaysIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { useAuth } from '../../composables/useAuth'
import { vacationApi } from '../../services/vacationApi'
import {
  type VacationRequest,
  type VacationType,
  type VacationBalance,
  VACATION_TYPE_LABELS,
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS,
  calculateDays,
} from '../../types/vacation'

const { userId, name, email, username } = useAuth()

const requests = ref<VacationRequest[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const isSubmitting = ref(false)
const balance = ref<VacationBalance | null>(null)

const newRequest = ref({
  startDate: '',
  endDate: '',
  type: 'VACATION' as VacationType,
  reason: '',
})

const typeOptions = Object.entries(VACATION_TYPE_LABELS)
const currentYear = new Date().getFullYear()
const today = new Date().toISOString().split('T')[0]
const fmt = (d: string): string => new Date(d).toLocaleDateString()

const totalDays = computed(() =>
  newRequest.value.startDate && newRequest.value.endDate
    ? calculateDays(newRequest.value.startDate, newRequest.value.endDate)
    : 0,
)
const canCreateRequest = computed(
  () =>
    !!balance.value &&
    balance.value.availableDays >= totalDays.value &&
    totalDays.value > 0,
)

async function loadRequests(): Promise<void> {
  if (!userId.value) return
  isLoading.value = true
  error.value = null
  const response = await vacationApi.getMyRequests(userId.value)
  if (response.error) {
    error.value = response.error
  } else if (response.data) {
    requests.value = response.data.requests
  }
  const balanceResponse = await vacationApi.getBalance(userId.value)
  if (balanceResponse.data?.balance) {
    balance.value = balanceResponse.data.balance
  }
  isLoading.value = false
}

onMounted(loadRequests)
watch(userId, loadRequests)

async function handleCreateRequest(): Promise<void> {
  if (!newRequest.value.startDate || !newRequest.value.endDate) {
    alert('Por favor selecciona las fechas de inicio y fin')
    return
  }
  if (new Date(newRequest.value.startDate) > new Date(newRequest.value.endDate)) {
    alert('La fecha de inicio no puede ser posterior a la fecha de fin')
    return
  }
  if (!userId.value || !email.value || !username.value) {
    alert('Error de autenticación. Por favor inicia sesión nuevamente.')
    return
  }
  if (!balance.value) {
    alert('No tienes días de vacaciones asignados. Contacta al administrador.')
    return
  }
  if (balance.value.availableDays < totalDays.value) {
    alert(
      `No tienes suficientes días disponibles. Disponibles: ${balance.value.availableDays}, Solicitados: ${totalDays.value}`,
    )
    return
  }

  isSubmitting.value = true
  const response = await vacationApi.createRequest(
    {
      startDate: newRequest.value.startDate,
      endDate: newRequest.value.endDate,
      type: newRequest.value.type,
      reason: newRequest.value.reason,
    },
    userId.value,
    email.value,
    // userName legible para mostrar en "últimas solicitudes"/aprobaciones; se
    // prefiere `name` sobre `username` (que en federados es `google_…`).
    name.value || username.value,
  )
  isSubmitting.value = false

  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  newRequest.value = {
    startDate: '',
    endDate: '',
    type: 'VACATION',
    reason: '',
  }
  showCreateModal.value = false
  loadRequests()
  alert('Solicitud creada exitosamente. Tu supervisor ha sido notificado.')
}

async function handleCancelRequest(requestId: string): Promise<void> {
  if (!confirm('¿Estás seguro de que deseas cancelar esta solicitud?')) return
  if (!userId.value) return
  const response = await vacationApi.cancelRequest(requestId, userId.value)
  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  loadRequests()
  alert('Solicitud cancelada exitosamente.')
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
    "
  >
    Cargando solicitudes...
  </div>

  <div v-else style="padding: 32px; max-width: 1200px; margin: 0 auto">
    <div
      style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 32px;
      "
    >
      <div>
        <h1 style="font-size: 2rem; margin-bottom: 8px">🏖️ Mis Vacaciones</h1>
        <p style="color: #666">
          Gestiona tus solicitudes de vacaciones y permisos.
        </p>
      </div>
      <button
        :disabled="!balance || balance.availableDays === 0"
        :style="{
          padding: '12px 24px',
          backgroundColor:
            !balance || balance.availableDays === 0 ? '#95a5a6' : '#27ae60',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor:
            !balance || balance.availableDays === 0
              ? 'not-allowed'
              : 'pointer',
          fontWeight: 'bold',
          fontSize: '1rem',
        }"
        @click="showCreateModal = true"
      >
        ➕ Nueva Solicitud
      </button>
    </div>

    <!-- Balance -->
    <div
      style="
        background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 24px;
        color: #fff;
      "
    >
      <div
        style="
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        "
      >
        <CalendarDaysIcon style="width: 28px; height: 28px" />
        <h2 style="margin: 0; font-size: 1.2rem; color: #fff">
          Mi Balance de Vacaciones {{ currentYear }}
        </h2>
      </div>

      <div
        v-if="balance"
        style="
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        "
      >
        <div
          style="
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
          "
        >
          <div style="font-size: 2rem; font-weight: 700">
            {{ balance.totalDays }}
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9">Total Asignados</div>
        </div>
        <div
          style="
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
          "
        >
          <div style="font-size: 2rem; font-weight: 700">
            {{ balance.usedDays }}
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9">Usados</div>
        </div>
        <div
          style="
            background-color: rgba(255, 255, 255, 0.15);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
          "
        >
          <div style="font-size: 2rem; font-weight: 700">
            {{ balance.pendingDays }}
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9">Pendientes</div>
        </div>
        <div
          style="
            background-color: rgba(255, 255, 255, 0.25);
            border-radius: 12px;
            padding: 16px;
            text-align: center;
            border: 2px solid rgba(255, 255, 255, 0.5);
          "
        >
          <div style="font-size: 2rem; font-weight: 700">
            {{ balance.availableDays }}
          </div>
          <div style="font-size: 0.85rem; opacity: 0.9">Disponibles</div>
        </div>
      </div>

      <div
        v-else
        style="
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        "
      >
        <ExclamationTriangleIcon style="width: 24px; height: 24px" />
        <div>
          <p style="margin: 0; font-weight: 600">Sin días asignados</p>
          <p style="margin: 4px 0 0 0; font-size: 0.9rem; opacity: 0.9">
            Contacta al administrador para que te asigne días de vacaciones.
          </p>
        </div>
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

    <!-- Lista de solicitudes -->
    <div style="display: grid; gap: 16px">
      <div
        v-if="requests.length === 0"
        style="
          text-align: center;
          padding: 48px;
          background-color: #fff;
          border-radius: 12px;
          color: #666;
        "
      >
        No tienes solicitudes de vacaciones. ¡Crea una nueva!
      </div>
      <div
        v-for="request in requests"
        v-else
        :key="request.id"
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        "
      >
        <div style="flex: 1">
          <div
            style="
              display: flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 8px;
            "
          >
            <span style="font-size: 1.25rem; font-weight: bold">
              {{ VACATION_TYPE_LABELS[request.type] }}
            </span>
            <span
              :style="{
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 'bold',
                backgroundColor: VACATION_STATUS_COLORS[request.status].bg,
                color: VACATION_STATUS_COLORS[request.status].text,
              }"
            >
              {{ VACATION_STATUS_LABELS[request.status] }}
            </span>
          </div>
          <div style="color: #666; margin-bottom: 4px">
            📅 {{ fmt(request.startDate) }} - {{ fmt(request.endDate) }}
            <span style="margin-left: 12px">({{ request.totalDays }} días)</span>
          </div>
          <div v-if="request.reason" style="color: #888; font-size: 0.9rem">
            💬 {{ request.reason }}
          </div>
          <div
            v-if="request.supervisorComment"
            style="
              color: #666;
              font-size: 0.9rem;
              margin-top: 8px;
              font-style: italic;
            "
          >
            📝 Comentario del supervisor: {{ request.supervisorComment }}
          </div>
        </div>
        <div style="display: flex; gap: 8px">
          <button
            v-if="request.status === 'PENDING'"
            style="
              padding: 8px 16px;
              background-color: #e74c3c;
              color: #fff;
              border: none;
              border-radius: 6px;
              cursor: pointer;
            "
            @click="handleCancelRequest(request.id)"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de crear solicitud -->
    <div
      v-if="showCreateModal"
      style="
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      "
      @click="showCreateModal = false"
    >
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          min-width: 450px;
          max-width: 500px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        "
        @click.stop
      >
        <h2 style="margin-bottom: 20px">🏖️ Nueva Solicitud de Vacaciones</h2>

        <div style="display: flex; flex-direction: column; gap: 16px">
          <div>
            <label
              style="display: block; margin-bottom: 4px; font-weight: bold"
            >
              Tipo de solicitud
            </label>
            <select
              v-model="newRequest.type"
              style="
                width: 100%;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #ddd;
                font-size: 1rem;
              "
            >
              <option v-for="[value, label] in typeOptions" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </div>

          <div
            style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px"
          >
            <div>
              <label
                style="display: block; margin-bottom: 4px; font-weight: bold"
              >
                Fecha inicio
              </label>
              <input
                v-model="newRequest.startDate"
                type="date"
                :min="today"
                style="
                  width: 100%;
                  padding: 10px;
                  border-radius: 6px;
                  border: 1px solid #ddd;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              />
            </div>
            <div>
              <label
                style="display: block; margin-bottom: 4px; font-weight: bold"
              >
                Fecha fin
              </label>
              <input
                v-model="newRequest.endDate"
                type="date"
                :min="newRequest.startDate || today"
                style="
                  width: 100%;
                  padding: 10px;
                  border-radius: 6px;
                  border: 1px solid #ddd;
                  font-size: 1rem;
                  box-sizing: border-box;
                "
              />
            </div>
          </div>

          <div
            v-if="totalDays > 0"
            :style="{
              padding: '12px',
              backgroundColor: canCreateRequest ? '#d4edda' : '#f8d7da',
              borderRadius: '8px',
              fontWeight: 'bold',
              color: canCreateRequest ? '#155724' : '#721c24',
            }"
          >
            <div
              style="
                display: flex;
                justify-content: space-between;
                align-items: center;
              "
            >
              <span>Días solicitados: {{ totalDays }}</span>
              <span>Disponibles: {{ balance?.availableDays || 0 }}</span>
            </div>
            <div
              v-if="!canCreateRequest && balance"
              style="margin-top: 8px; font-size: 0.9rem"
            >
              ⚠️ No tienes suficientes días disponibles para esta solicitud.
            </div>
            <div v-if="!balance" style="margin-top: 8px; font-size: 0.9rem">
              ⚠️ No tienes días de vacaciones asignados. Contacta al
              administrador.
            </div>
          </div>

          <div>
            <label
              style="display: block; margin-bottom: 4px; font-weight: bold"
            >
              Motivo (opcional)
            </label>
            <textarea
              v-model="newRequest.reason"
              placeholder="Describe el motivo de tu solicitud..."
              :rows="3"
              style="
                width: 100%;
                padding: 10px;
                border-radius: 6px;
                border: 1px solid #ddd;
                font-size: 1rem;
                resize: vertical;
                box-sizing: border-box;
              "
            />
          </div>

          <div style="display: flex; gap: 12px; margin-top: 8px">
            <button
              :disabled="isSubmitting || !canCreateRequest"
              :style="{
                flex: 1,
                padding: '12px',
                backgroundColor:
                  isSubmitting || !canCreateRequest ? '#95a5a6' : '#27ae60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor:
                  isSubmitting || !canCreateRequest
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: 'bold',
              }"
              @click="handleCreateRequest"
            >
              {{ isSubmitting ? 'Enviando...' : 'Enviar Solicitud' }}
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
              @click="showCreateModal = false"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
