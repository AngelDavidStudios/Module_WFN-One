<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { vacationApi } from '../../services/vacationApi'
import {
  type VacationRequest,
  VACATION_TYPE_LABELS,
  VACATION_STATUS_COLORS,
} from '../../types/vacation'

const { userId, email } = useAuth()

const requests = ref<VacationRequest[]>([])
const isLoading = ref(true)
const error = ref<string | null>(null)
const processingId = ref<string | null>(null)
const comment = ref('')
const showCommentModal = ref<{ id: string; action: 'approve' | 'reject' } | null>(
  null,
)

const fmt = (d: string): string => new Date(d).toLocaleDateString()

async function loadRequests(): Promise<void> {
  if (!userId.value) return
  isLoading.value = true
  error.value = null
  const response = await vacationApi.getPendingApprovals(userId.value)
  if (response.error) {
    error.value = response.error
  } else if (response.data) {
    requests.value = response.data.requests
  }
  isLoading.value = false
}

onMounted(loadRequests)
watch(userId, loadRequests)

async function handleAction(
  requestId: string,
  action: 'approve' | 'reject',
  actionComment?: string,
): Promise<void> {
  if (!userId.value || !email.value) return
  processingId.value = requestId
  const response =
    action === 'approve'
      ? await vacationApi.approveRequest(
          requestId,
          userId.value,
          email.value,
          actionComment,
        )
      : await vacationApi.rejectRequest(
          requestId,
          userId.value,
          email.value,
          actionComment,
        )
  processingId.value = null
  if (response.error) {
    alert(`Error: ${response.error}`)
    return
  }
  showCommentModal.value = null
  comment.value = ''
  loadRequests()
  alert(
    `Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} exitosamente.`,
  )
}

function closeModal(): void {
  showCommentModal.value = null
  comment.value = ''
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
    Cargando solicitudes pendientes...
  </div>

  <div v-else style="padding: 32px; max-width: 1200px; margin: 0 auto">
    <div style="margin-bottom: 32px">
      <h1 style="font-size: 2rem; margin-bottom: 8px">
        ✅ Aprobaciones Pendientes
      </h1>
      <p style="color: #666">
        Revisa y gestiona las solicitudes de vacaciones de tu equipo.
      </p>
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
      v-if="requests.length === 0"
      style="
        text-align: center;
        padding: 48px;
        background-color: #fff;
        border-radius: 12px;
        color: #666;
      "
    >
      🎉 No tienes solicitudes pendientes de aprobación.
    </div>

    <div v-else style="display: grid; gap: 16px">
      <div
        v-for="request in requests"
        :key="request.id"
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-left: 4px solid #ffa502;
        "
      >
        <div
          style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          "
        >
          <div style="flex: 1">
            <div
              style="
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 12px;
              "
            >
              <span style="font-size: 1.1rem; font-weight: bold">
                👤 {{ request.requesterName }}
              </span>
              <span
                :style="{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                  backgroundColor: VACATION_STATUS_COLORS.PENDING.bg,
                  color: VACATION_STATUS_COLORS.PENDING.text,
                }"
              >
                Pendiente
              </span>
            </div>

            <div
              style="
                display: inline-block;
                padding: 8px 16px;
                background-color: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 12px;
              "
            >
              <strong>{{ VACATION_TYPE_LABELS[request.type] }}</strong>
            </div>

            <div style="color: #666; margin-bottom: 8px">
              📅 <strong>Fechas:</strong> {{ fmt(request.startDate) }} -
              {{ fmt(request.endDate) }}
              <span
                style="
                  margin-left: 12px;
                  padding: 2px 8px;
                  background-color: #e3f2fd;
                  border-radius: 4px;
                  font-weight: bold;
                "
              >
                {{ request.totalDays }} día(s)
              </span>
            </div>

            <div v-if="request.reason" style="color: #666; font-size: 0.95rem">
              💬 <strong>Motivo:</strong> {{ request.reason }}
            </div>

            <div style="color: #888; font-size: 0.85rem; margin-top: 12px">
              📧 {{ request.requesterEmail }} · Solicitado el
              {{ fmt(request.createdAt) }}
            </div>
          </div>

          <div style="display: flex; gap: 8px; margin-left: 16px">
            <button
              :disabled="processingId === request.id"
              style="
                padding: 10px 20px;
                background-color: #27ae60;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              "
              @click="showCommentModal = { id: request.id, action: 'approve' }"
            >
              ✅ Aprobar
            </button>
            <button
              :disabled="processingId === request.id"
              style="
                padding: 10px 20px;
                background-color: #e74c3c;
                color: #fff;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: bold;
              "
              @click="showCommentModal = { id: request.id, action: 'reject' }"
            >
              ❌ Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de comentario -->
    <div
      v-if="showCommentModal"
      style="
        position: fixed;
        inset: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
      "
      @click="closeModal"
    >
      <div
        style="
          background-color: #fff;
          border-radius: 12px;
          padding: 24px;
          min-width: 400px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        "
        @click.stop
      >
        <h2 style="margin-bottom: 16px">
          {{
            showCommentModal.action === 'approve'
              ? '✅ Aprobar Solicitud'
              : '❌ Rechazar Solicitud'
          }}
        </h2>

        <div style="margin-bottom: 16px">
          <label style="display: block; margin-bottom: 8px; font-weight: bold">
            Comentario (opcional)
          </label>
          <textarea
            v-model="comment"
            :placeholder="
              showCommentModal.action === 'approve'
                ? 'Añade un comentario de aprobación...'
                : 'Explica el motivo del rechazo...'
            "
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

        <div style="display: flex; gap: 12px">
          <button
            :disabled="processingId !== null"
            :style="{
              flex: 1,
              padding: '12px',
              backgroundColor:
                showCommentModal.action === 'approve' ? '#27ae60' : '#e74c3c',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
            }"
            @click="
              handleAction(
                showCommentModal.id,
                showCommentModal.action,
                comment,
              )
            "
          >
            {{ processingId ? 'Procesando...' : 'Confirmar' }}
          </button>
          <button
            style="
              padding: 12px 24px;
              background-color: #e9ecef;
              color: #333;
              border: none;
              border-radius: 8px;
              cursor: pointer;
            "
            @click="closeModal"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
