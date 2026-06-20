import { HttpClient, createHttpClient } from './httpClient'

/**
 * API Facade — interfaz unificada para las APIs de negocio.
 *
 * En la versión Amplify cada dominio apuntaba a una URL de Lambda distinta
 * (leídas de amplify_outputs.json). Ahora todo pasa por el cliente axios del
 * BFF (`/api`) y cada dominio se enruta a un basePath que el futuro backend
 * NestJS expondrá:
 *
 *   userManagement -> /users
 *   organization   -> /organization
 *   vacation       -> /vacation   (también sirve los logs de auditoría)
 *   storage        -> /storage    (fotos de perfil; presigned URLs de S3)
 *   messages       -> /messages   (reportes confidenciales cifrados con KMS, A → B)
 *
 * Estos paths son el contrato pendiente con el backend NestJS (último paso).
 */
const userManagementClient = createHttpClient({ basePath: '/users' })
const organizationClient = createHttpClient({ basePath: '/organization' })
const vacationClient = createHttpClient({ basePath: '/vacation' })
const storageClient = createHttpClient({ basePath: '/storage' })
const messagesClient = createHttpClient({ basePath: '/messages' })

export const ApiFacade = {
  get userManagement(): HttpClient {
    return userManagementClient
  },

  get organization(): HttpClient {
    return organizationClient
  },

  get vacation(): HttpClient {
    return vacationClient
  },

  get storage(): HttpClient {
    return storageClient
  },

  get messages(): HttpClient {
    return messagesClient
  },
}

export default ApiFacade
