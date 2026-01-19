/**
 * API de Gestión de Usuarios
 * Usa el patrón Facade para simplificar las llamadas
 */

import { ApiFacade } from './base';
import type { ApiResponse } from './base/apiTypes';

export interface CognitoUser {
    username: string;
    email?: string;
    preferredUsername?: string;
    name?: string;
    status: string;
    enabled: boolean;
    createdAt?: string;
    groups: string[];
}

export const userManagementApi = {
    /**
     * Lista todos los usuarios de Cognito
     */
    async listUsers(): Promise<ApiResponse<{ users: CognitoUser[] }>> {
        return ApiFacade.userManagement.postAction('listUsers');
    },

    /**
     * Crea un nuevo usuario en Cognito
     * Retorna la contraseña temporal para que el admin la comparta con el usuario
     */
    async createUser(
        email: string,
        username: string,
        temporaryPassword?: string
    ): Promise<ApiResponse<{ message: string; user: CognitoUser & { temporaryPassword: string } }>> {
        return ApiFacade.userManagement.postAction('createUser', { email, username, temporaryPassword });
    },

    /**
     * Elimina un usuario de Cognito
     */
    async deleteUser(username: string): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.userManagement.postAction('deleteUser', { username });
    },

    /**
     * Agrega un usuario a un grupo
     */
    async addUserToGroup(
        username: string,
        groupName: string
    ): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.userManagement.postAction('addToGroup', { username, groupName });
    },

    /**
     * Remueve un usuario de un grupo
     */
    async removeUserFromGroup(
        username: string,
        groupName: string
    ): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.userManagement.postAction('removeFromGroup', { username, groupName });
    },

    /**
     * Obtiene los grupos de un usuario
     */
    async getUserGroups(username: string): Promise<ApiResponse<{ groups: string[] }>> {
        return ApiFacade.userManagement.postAction('getUserGroups', { username });
    },

    /**
     * Resetea la contraseña de un usuario (Solo Super Admin)
     */
    async resetPassword(
        username: string,
        newPassword: string
    ): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.userManagement.postAction('resetPassword', { username, newPassword });
    },
};
