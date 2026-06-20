/**
 * API de Mensajes Seguros (Reporte Confidencial de RR.HH., demo KMS A → B).
 *
 * Sistema A solo ENVÍA: el BFF (Sistema C) cifra el payload con KMS (envelope
 * encryption) y lo guarda en DynamoDB. El remitente (`sentBy`/`sentByName`) lo
 * resuelve el backend desde la sesión — el formulario no lo manda.
 * La lectura/descifrado vive en Sistema B (bandeja estilo Outlook).
 */

import { ApiFacade } from './base'
import type { ApiResponse } from './base/apiTypes'
import type { SendReportInput, SendReportResult } from '../types/messages'

export const messagesApi = {
  /** Envía un reporte confidencial; el BFF lo cifra con KMS antes de persistir. */
  async sendReport(
    input: SendReportInput,
  ): Promise<ApiResponse<SendReportResult>> {
    return ApiFacade.messages.postAction('send', { ...input })
  },
}
