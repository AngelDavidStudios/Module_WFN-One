<script setup lang="ts">
import { computed, ref } from 'vue'
import { LockClosedIcon, ShieldCheckIcon } from '@heroicons/vue/24/outline'
import { Alert, Button, Card, Input, Select } from '../components/ui'
import type { SelectOption } from '../components/ui'
import { messagesApi } from '../services/messagesApi'
import {
  CONFIDENTIALITY_LEVEL_LABELS,
  MESSAGE_TYPE_LABELS,
  type ConfidentialityLevel,
  type MessageType,
} from '../types/messages'

interface FormState {
  subject: string
  type: MessageType
  employee: string
  eventDate: string
  confidentialityLevel: ConfidentialityLevel
  description: string
}

const emptyForm = (): FormState => ({
  subject: '',
  type: 'incident',
  employee: '',
  eventDate: '',
  confidentialityLevel: 'confidential',
  description: '',
})

const form = ref<FormState>(emptyForm())
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const sentRef = ref<string | null>(null)

const typeOptions: SelectOption[] = Object.entries(MESSAGE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
)
const levelOptions: SelectOption[] = Object.entries(
  CONFIDENTIALITY_LEVEL_LABELS,
).map(([value, label]) => ({ value, label }))

const today = new Date().toISOString().split('T')[0]

const isValid = computed(
  () =>
    form.value.subject.trim() !== '' &&
    form.value.employee.trim() !== '' &&
    form.value.eventDate !== '' &&
    form.value.description.trim() !== '',
)

async function handleSubmit(): Promise<void> {
  if (!isValid.value || isSubmitting.value) return
  isSubmitting.value = true
  error.value = null

  const response = await messagesApi.sendReport({
    subject: form.value.subject.trim(),
    type: form.value.type,
    employee: form.value.employee.trim(),
    eventDate: form.value.eventDate,
    confidentialityLevel: form.value.confidentialityLevel,
    description: form.value.description.trim(),
  })

  isSubmitting.value = false

  if (response.error || !response.data) {
    error.value = response.error ?? 'No se pudo enviar el reporte.'
    return
  }
  sentRef.value = response.data.messageId.slice(0, 8)
}

function resetForm(): void {
  form.value = emptyForm()
  sentRef.value = null
  error.value = null
}
</script>

<template>
  <div style="max-width: 720px; margin: 0 auto; padding: 24px 16px">
    <div style="margin-bottom: 24px">
      <h1
        style="
          margin: 0 0 6px;
          color: #0f172a;
          font-size: 1.6rem;
          font-weight: 700;
        "
      >
        Reporte Confidencial
      </h1>
      <p style="margin: 0; color: #64748b; font-size: 0.95rem">
        RR.HH. (Sistema A) → Dirección (Sistema B). El contenido se cifra con
        AWS KMS en el servidor; solo la bandeja segura de Dirección puede
        descifrarlo.
      </p>
    </div>

    <!-- Estado: enviado con éxito -->
    <Card v-if="sentRef" padding="lg">
      <template #icon>
        <ShieldCheckIcon style="width: 22px; height: 22px; color: #fff" />
      </template>
      <Alert
        type="success"
        :message="`Reporte cifrado y enviado. Referencia: ${sentRef}`"
      />
      <p style="margin: 16px 0 20px; color: #475569; font-size: 0.9rem">
        El reporte viajó cifrado (envelope encryption con KMS) y ya está
        disponible en la bandeja segura de Dirección. Nadie con acceso directo a
        la base de datos puede leer el empleado ni la descripción.
      </p>
      <Button variant="primary" @click="resetForm">Enviar otro reporte</Button>
    </Card>

    <!-- Estado: formulario -->
    <Card v-else padding="lg" iconBg="linear-gradient(135deg,#4f46e5,#7c3aed)">
      <template #icon>
        <LockClosedIcon style="width: 22px; height: 22px; color: #fff" />
      </template>

      <form
        style="display: flex; flex-direction: column; gap: 18px"
        @submit.prevent="handleSubmit"
      >
        <Input
          v-model="form.subject"
          label="Asunto"
          placeholder="Ej. Incidente en área de producción"
          required
        />

        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          "
        >
          <Select
            v-model="form.type"
            label="Tipo"
            :options="typeOptions"
            required
          />
          <Select
            v-model="form.confidentialityLevel"
            label="Nivel de confidencialidad"
            :options="levelOptions"
            required
          />
        </div>

        <div
          style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18px;
          "
        >
          <Input
            v-model="form.employee"
            label="Empleado involucrado"
            placeholder="Ej. Juan Pérez"
            required
          />
          <div style="display: flex; flex-direction: column; gap: 6px">
            <label style="font-weight: 600; color: #374151; font-size: 0.9rem">
              Fecha del evento <span style="color: #dc2626">*</span>
            </label>
            <input
              v-model="form.eventDate"
              type="date"
              :max="today"
              style="
                width: 100%;
                padding: 12px 14px;
                border-radius: 10px;
                border: 1px solid #e5e7eb;
                font-size: 0.95rem;
                font-family: inherit;
                box-sizing: border-box;
                outline: none;
                background-color: #fff;
              "
            />
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px">
          <label
            style="font-weight: 600; color: #374151; font-size: 0.9rem"
          >
            Descripción <span style="color: #dc2626">*</span>
          </label>
          <textarea
            v-model="form.description"
            rows="5"
            placeholder="Describe el evento confidencial…"
            style="
              width: 100%;
              padding: 12px 14px;
              border-radius: 10px;
              border: 1px solid #e5e7eb;
              font-size: 0.95rem;
              font-family: inherit;
              box-sizing: border-box;
              resize: vertical;
              outline: none;
            "
          ></textarea>
        </div>

        <Alert v-if="error" type="error" :message="error" />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :loading="isSubmitting"
          :disabled="!isValid"
        >
          {{ isSubmitting ? 'Cifrando y enviando…' : 'Enviar reporte cifrado' }}
        </Button>
      </form>
    </Card>
  </div>
</template>
