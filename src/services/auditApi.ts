/**
 * API de Auditoría
 * Usa el patrón Facade para simplificar las llamadas
 */

import { ApiFacade } from './base';
import type { ApiResponse } from './base/apiTypes';
import type { AuditLog, AuditLogFilters } from '../types/audit';

export const auditApi = {
    /**
     * Obtener todos los logs de auditoría (solo super_admin)
     */
    async getAuditLogs(filters?: AuditLogFilters): Promise<ApiResponse<{ logs: AuditLog[] }>> {
        // Convertir nombres de filtros para que coincidan con el handler
        const params: Record<string, unknown> = {};
        if (filters?.action) {
            params.actionFilter = filters.action;
        }
        if (filters?.entityType) {
            params.entityType = filters.entityType;
        }
        return ApiFacade.vacation.postAction('getAuditLogs', params);
    },
};
