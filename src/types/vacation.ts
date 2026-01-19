// Tipos para el sistema de vacaciones

export type VacationType =
    | 'VACATION'        // Vacaciones
    | 'PERSONAL_LEAVE'  // Permiso personal
    | 'SICK_LEAVE'      // Licencia médica
    | 'MATERNITY'       // Maternidad/Paternidad
    | 'OTHER';          // Otro

export type VacationStatus =
    | 'PENDING'    // Pendiente de aprobación
    | 'APPROVED'   // Aprobada
    | 'REJECTED'   // Rechazada
    | 'CANCELLED'; // Cancelada

export interface VacationRequest {
    id: string;
    requesterId: string;
    requesterEmail: string;
    requesterName: string;
    supervisorId: string;
    supervisorEmail: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    type: VacationType;
    reason?: string;
    status: VacationStatus;
    supervisorComment?: string;
    createdAt: string;
    updatedAt?: string;
    resolvedAt?: string;
}

export interface CreateVacationRequestInput {
    startDate: string;
    endDate: string;
    type: VacationType;
    reason?: string;
}

export interface UpdateVacationRequestInput {
    id: string;
    status: VacationStatus;
    supervisorComment?: string;
}

// Labels para mostrar en UI
export const VACATION_TYPE_LABELS: Record<VacationType, string> = {
    VACATION: 'Vacaciones',
    PERSONAL_LEAVE: 'Permiso Personal',
    SICK_LEAVE: 'Licencia Médica',
    MATERNITY: 'Maternidad/Paternidad',
    OTHER: 'Otro',
};

export const VACATION_STATUS_LABELS: Record<VacationStatus, string> = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    REJECTED: 'Rechazada',
    CANCELLED: 'Cancelada',
};

export const VACATION_STATUS_COLORS: Record<VacationStatus, { bg: string; text: string }> = {
    PENDING: { bg: '#fff3cd', text: '#856404' },
    APPROVED: { bg: '#d4edda', text: '#155724' },
    REJECTED: { bg: '#f8d7da', text: '#721c24' },
    CANCELLED: { bg: '#e9ecef', text: '#495057' },
};

// Calcular días entre dos fechas
export function calculateDays(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días
    return diffDays;
}
