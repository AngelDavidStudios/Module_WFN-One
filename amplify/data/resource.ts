import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== SCHEMA DEL SISTEMA DE VACACIONES =====================================
Incluye:
- OrganizationNode: Árbol jerárquico organizacional
- VacationRequest: Solicitudes de vacaciones
- AuditLog: Registro de auditoría
=========================================================================*/
const schema = a.schema({
    // Árbol Jerárquico Organizacional
    OrganizationNode: a
        .model({
            userId: a.string().required(),           // ID del usuario en Cognito
            userEmail: a.string().required(),        // Email del usuario
            userName: a.string().required(),         // Nombre visible
            supervisorId: a.string(),                // ID del nodo supervisor (null para raíz)
            position: a.string().required(),         // Cargo/Posición
            department: a.string().required(),       // Departamento
            level: a.integer().required(),           // Nivel en la jerarquía (0 = raíz)
        })
        .secondaryIndexes((index) => [
            index('userId'),
            index('supervisorId'),
        ])
        .authorization((allow) => [
            allow.groups(['super_admin']).to(['create', 'update', 'delete', 'read']),
            allow.groups(['admin', 'user']).to(['read']),
        ]),

    // Solicitudes de Vacaciones
    VacationRequest: a
        .model({
            requesterId: a.string().required(),      // ID del solicitante
            requesterEmail: a.string().required(),   // Email del solicitante
            requesterName: a.string().required(),    // Nombre del solicitante
            supervisorId: a.string().required(),     // ID del supervisor asignado
            supervisorEmail: a.string().required(),  // Email del supervisor
            startDate: a.date().required(),          // Fecha inicio
            endDate: a.date().required(),            // Fecha fin
            totalDays: a.integer().required(),       // Total días solicitados
            type: a.enum(['VACATION', 'PERSONAL_LEAVE', 'SICK_LEAVE', 'MATERNITY', 'OTHER']),
            reason: a.string(),                      // Motivo/Descripción
            status: a.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']),
            supervisorComment: a.string(),           // Comentario del supervisor
            resolvedAt: a.datetime(),                // Fecha de resolución
        })
        .secondaryIndexes((index) => [
            index('requesterId'),
            index('supervisorId'),
            index('status'),
        ])
        .authorization((allow) => [
            allow.groups(['super_admin']).to(['create', 'update', 'delete', 'read']),
            allow.groups(['admin']).to(['read', 'update']),
            allow.owner().to(['create', 'read', 'update']),
        ]),

    // Registro de Auditoría
    AuditLog: a
        .model({
            action: a.enum([
                'REQUEST_CREATED',
                'REQUEST_APPROVED',
                'REQUEST_REJECTED',
                'REQUEST_CANCELLED',
                'HIERARCHY_CREATED',
                'HIERARCHY_UPDATED',
                'HIERARCHY_DELETED',
                'USER_ASSIGNED',
                'BALANCE_CREATED',
                'BALANCE_UPDATED',
            ]),
            entityType: a.string().required(),       // Tipo de entidad afectada
            entityId: a.string().required(),         // ID de la entidad
            userId: a.string().required(),           // Usuario que realizó la acción
            userEmail: a.string().required(),        // Email del usuario
            details: a.json(),                       // Detalles adicionales (JSON)
        })
        .secondaryIndexes((index) => [
            index('userId'),
            index('entityType'),
            index('action'),
        ])
        .authorization((allow) => [
            allow.groups(['super_admin']).to(['create', 'read']),
            allow.groups(['admin']).to(['create']),
            allow.groups(['user']).to(['create']),
        ]),

    // Balance de Vacaciones por Usuario
    VacationBalance: a
        .model({
            userId: a.string().required(),           // ID del usuario en Cognito
            userEmail: a.string().required(),        // Email del usuario
            userName: a.string().required(),         // Nombre del usuario
            totalDays: a.integer().required(),       // Días totales asignados
            usedDays: a.integer().required(),        // Días usados
            pendingDays: a.integer().required(),     // Días en solicitudes pendientes
            availableDays: a.integer().required(),   // Días disponibles (total - used - pending)
            year: a.integer().required(),            // Año del balance
            lastUpdated: a.datetime().required(),    // Última actualización
            updatedBy: a.string().required(),        // Quién actualizó (userId)
        })
        .secondaryIndexes((index) => [
            index('userId'),
            index('year'),
        ])
        .authorization((allow) => [
            allow.groups(['super_admin']).to(['create', 'update', 'delete', 'read']),
            allow.groups(['admin']).to(['read']),
            allow.groups(['user']).to(['read']),
        ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
    schema,
    authorizationModes: {
        defaultAuthorizationMode: 'userPool',
    },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
