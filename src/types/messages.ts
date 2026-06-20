// Tipos para los mensajes seguros (Reporte Confidencial de RR.HH., demo KMS A → B).
// Espejan el contrato del backend (Sistema C, módulo `messages/`).

export const MESSAGE_TYPES = [
  'incident',
  'evaluation',
  'alert',
  'special-request',
] as const
export type MessageType = (typeof MESSAGE_TYPES)[number]

export const CONFIDENTIALITY_LEVELS = [
  'normal',
  'confidential',
  'very-confidential',
] as const
export type ConfidentialityLevel = (typeof CONFIDENTIALITY_LEVELS)[number]

export type MessageStatus = 'unread' | 'read'

/** Etiquetas legibles (ES) para los selects del formulario. */
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  incident: 'Incidente',
  evaluation: 'Evaluación de desempeño',
  alert: 'Alerta',
  'special-request': 'Solicitud especial',
}

export const CONFIDENTIALITY_LEVEL_LABELS: Record<ConfidentialityLevel, string> =
  {
    normal: 'Normal',
    confidential: 'Confidencial',
    'very-confidential': 'Muy confidencial',
  }

/** Datos que captura el formulario de Sistema A (lo que se cifra). */
export interface SendReportInput {
  subject: string
  type: MessageType
  employee: string
  eventDate: string
  confidentialityLevel: ConfidentialityLevel
  description: string
}

/** Respuesta de `action: 'send'`. */
export interface SendReportResult {
  messageId: string
  sentAt: string
}
