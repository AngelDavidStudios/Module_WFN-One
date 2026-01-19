/**
 * API de Gestión de Vacaciones
 * Usa el patrón Facade para simplificar las llamadas
 */

import { ApiFacade } from './base';
import type { ApiResponse } from './base/apiTypes';
import type { VacationRequest, CreateVacationRequestInput, VacationBalance } from '../types/vacation';

export const vacationApi = {
    /**
     * Crear una nueva solicitud de vacaciones
     */
    async createRequest(
        input: CreateVacationRequestInput,
        userId: string,
        userEmail: string,
        userName: string
    ): Promise<ApiResponse<{ message: string; request: VacationRequest }>> {
        return ApiFacade.vacation.postAction('createRequest', {
            ...input,
            userId,
            userEmail,
            userName,
        });
    },

    /**
     * Aprobar una solicitud de vacaciones
     */
    async approveRequest(
        requestId: string,
        userId: string,
        userEmail: string,
        comment?: string
    ): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.vacation.postAction('approveRequest', { id: requestId, userId, userEmail, comment });
    },

    /**
     * Rechazar una solicitud de vacaciones
     */
    async rejectRequest(
        requestId: string,
        userId: string,
        userEmail: string,
        comment?: string
    ): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.vacation.postAction('rejectRequest', { id: requestId, userId, userEmail, comment });
    },

    /**
     * Cancelar una solicitud propia
     */
    async cancelRequest(requestId: string, userId: string): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.vacation.postAction('cancelRequest', { id: requestId, userId });
    },

    /**
     * Obtener una solicitud por ID
     */
    async getRequest(requestId: string): Promise<ApiResponse<{ request: VacationRequest }>> {
        return ApiFacade.vacation.postAction('getRequest', { id: requestId });
    },

    /**
     * Obtener mis solicitudes
     */
    async getMyRequests(userId: string): Promise<ApiResponse<{ requests: VacationRequest[] }>> {
        return ApiFacade.vacation.postAction('getMyRequests', { userId });
    },

    /**
     * Obtener solicitudes pendientes de aprobación (para supervisores)
     */
    async getPendingApprovals(supervisorId: string): Promise<ApiResponse<{ requests: VacationRequest[] }>> {
        return ApiFacade.vacation.postAction('getPendingApprovals', { userId: supervisorId });
    },

    /**
     * Obtener todas las solicitudes (solo super_admin)
     */
    async getAllRequests(): Promise<ApiResponse<{ requests: VacationRequest[] }>> {
        return ApiFacade.vacation.postAction('getAllRequests');
    },

    // ==================== BALANCE DE VACACIONES ====================

    /**
     * Obtener balance de vacaciones de un usuario
     */
    async getBalance(userId: string): Promise<ApiResponse<{ balance: VacationBalance }>> {
        return ApiFacade.vacation.postAction('getBalance', { userId });
    },

    /**
     * Establecer/Actualizar balance de vacaciones (solo super_admin)
     */
    async setBalance(
        userId: string,
        userEmail: string,
        userName: string,
        totalDays: number,
        adminUserId: string
    ): Promise<ApiResponse<{ message: string; balance: VacationBalance }>> {
        return ApiFacade.vacation.postAction('setBalance', {
            userId,
            userEmail,
            userName,
            totalDays,
            adminUserId,
        });
    },

    /**
     * Obtener todos los balances (solo super_admin)
     */
    async getAllBalances(): Promise<ApiResponse<{ balances: VacationBalance[] }>> {
        return ApiFacade.vacation.postAction('getAllBalances');
    },
};
