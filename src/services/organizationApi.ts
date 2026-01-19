/**
 * API de Árbol Organizacional
 * Usa el patrón Facade para simplificar las llamadas
 */

import { ApiFacade } from './base';
import type { ApiResponse } from './base/apiTypes';
import type { OrganizationNode, CreateOrganizationNodeInput, UpdateOrganizationNodeInput } from '../types/organization';

export const organizationApi = {
    /**
     * Crear un nuevo nodo en el árbol organizacional
     */
    async createNode(input: CreateOrganizationNodeInput): Promise<ApiResponse<{ message: string; node: OrganizationNode }>> {
        return ApiFacade.organization.postAction('createNode', { ...input });
    },

    /**
     * Actualizar un nodo existente
     */
    async updateNode(input: UpdateOrganizationNodeInput): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.organization.postAction('updateNode', { ...input });
    },

    /**
     * Eliminar un nodo
     */
    async deleteNode(id: string): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.organization.postAction('deleteNode', { id });
    },

    /**
     * Obtener un nodo por ID
     */
    async getNode(id: string): Promise<ApiResponse<{ node: OrganizationNode }>> {
        return ApiFacade.organization.postAction('getNode', { id });
    },

    /**
     * Obtener el árbol completo
     */
    async getTree(): Promise<ApiResponse<{ nodes: OrganizationNode[]; tree: OrganizationNode[] }>> {
        return ApiFacade.organization.postAction('getTree');
    },

    /**
     * Obtener nodo por userId
     */
    async getNodeByUserId(userId: string): Promise<ApiResponse<{ node: OrganizationNode }>> {
        return ApiFacade.organization.postAction('getNodeByUserId', { userId });
    },

    /**
     * Obtener subordinados directos de un nodo
     */
    async getSubordinates(nodeId: string): Promise<ApiResponse<{ subordinates: OrganizationNode[] }>> {
        return ApiFacade.organization.postAction('getSubordinates', { id: nodeId });
    },

    /**
     * Asignar un supervisor a un nodo
     */
    async assignSupervisor(nodeId: string, supervisorId: string): Promise<ApiResponse<{ message: string }>> {
        return ApiFacade.organization.postAction('assignSupervisor', { id: nodeId, supervisorId });
    },
};
