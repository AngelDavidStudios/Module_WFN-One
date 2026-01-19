// Tipos para el sistema de organización jerárquica

export interface OrganizationNode {
    id: string;
    userId: string;
    userEmail: string;
    userName: string;
    supervisorId: string; // 'ROOT' para nodos raíz, ID del supervisor para otros
    position: string;
    department: string;
    level: number;
    createdAt?: string;
    updatedAt?: string;
    // Campos calculados para el árbol
    children?: OrganizationNode[];
    supervisor?: OrganizationNode;
}

export interface TreeNode extends OrganizationNode {
    children: TreeNode[];
    isExpanded?: boolean;
}

export interface UserHierarchy {
    user: OrganizationNode;
    supervisor: OrganizationNode | null;
    subordinates: OrganizationNode[];
    path: OrganizationNode[]; // Camino desde la raíz hasta el usuario
}

export interface CreateOrganizationNodeInput {
    userId: string;
    userEmail: string;
    userName: string;
    supervisorId?: string;
    position: string;
    department: string;
}

export interface UpdateOrganizationNodeInput {
    id: string;
    supervisorId?: string;
    position?: string;
    department?: string;
}

// Departamentos predefinidos
export const DEPARTMENTS = [
    'Dirección General',
    'Recursos Humanos',
    'Tecnología',
    'Finanzas',
    'Operaciones',
    'Ventas',
    'Marketing',
    'Legal',
    'Administración',
] as const;

export type Department = typeof DEPARTMENTS[number] | string;
