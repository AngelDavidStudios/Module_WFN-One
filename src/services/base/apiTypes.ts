export interface ApiResponse<T> {
    data?: T;
    error?: string;
    success: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
    total?: number;
    page?: number;
    pageSize?: number;
}

/**
 * Crea una respuesta exitosa
 */
export const successResponse = <T>(data: T): ApiResponse<T> => ({
    data,
    success: true,
});

/**
 * Crea una respuesta de error
 */
export const errorResponse = <T>(error: string): ApiResponse<T> => ({
    error,
    success: false,
});

/**
 * Wrapper para llamadas async con manejo de errores
 */
export const safeAsync = async <T>(
    fn: () => Promise<T>,
    errorMessage = 'Ocurrió un error'
): Promise<ApiResponse<T>> => {
    try {
        const data = await fn();
        return successResponse(data);
    } catch (error) {
        console.error(errorMessage, error);
        return errorResponse((error as Error).message || errorMessage);
    }
};
