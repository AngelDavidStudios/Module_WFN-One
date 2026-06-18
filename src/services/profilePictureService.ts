/**
 * Servicio de fotos de perfil — S3 vía el BFF (Sistema C).
 *
 * La versión Amplify subía a S3 con aws-amplify/storage; el stub intermedio
 * guardaba un data URL en localStorage. Ahora el flujo es el patrón BFF:
 *
 *   1. El BFF firma una presigned URL (POST /storage { action:'getUploadUrl' }).
 *   2. El navegador hace PUT del archivo DIRECTO a S3 con esa URL (axios crudo,
 *      sin cookie ni base /api: va autorizado por la firma).
 *   3. Para mostrar/leer, el BFF firma una GET URL (action:'get' | 'getByUser')
 *      que se usa tal cual en <img src>.
 *
 * El bucket es privado; el BFF es el único que tiene credenciales AWS. La
 * identidad es el `username` Cognito (la key vive en profile-pictures/<user>),
 * así que el backend deriva la key de la sesión: un usuario solo escribe la
 * suya. Las firmas exportadas no cambian (las vistas no se tocan).
 */
import axios from 'axios'
import { ApiFacade } from './base/ApiFacade'

export interface ProfilePictureResult {
  success: boolean
  url?: string
  error?: string
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024

/** Sube la foto de perfil del usuario actual a S3 (presigned PUT). */
export const uploadProfilePicture = async (
  userId: string,
  file: File,
): Promise<ProfilePictureResult> => {
  if (!userId) {
    return { success: false, error: 'No se pudo obtener la identidad del usuario.' }
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      success: false,
      error: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WEBP',
    }
  }
  if (file.size > MAX_SIZE) {
    return {
      success: false,
      error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
    }
  }

  // 1) Pedir la presigned PUT URL al BFF.
  const presign = await ApiFacade.storage.postAction<{
    uploadUrl: string
    contentType: string
  }>('getUploadUrl', { contentType: file.type })
  if (!presign.success || !presign.data) {
    return { success: false, error: presign.error ?? 'No se pudo iniciar la subida.' }
  }

  // 2) PUT directo a S3 (sin cookie ni headers del BFF: solo Content-Type, que
  //    debe coincidir con el firmado). axios crudo, no la instancia `api`.
  try {
    await axios.put(presign.data.uploadUrl, file, {
      headers: { 'Content-Type': file.type },
    })
  } catch (error) {
    console.error('Error uploading to S3:', error)
    return { success: false, error: 'Error al subir la imagen a S3.' }
  }

  // 3) Obtener la GET URL de visualización ya firmada.
  const url = await getProfilePictureUrl(userId)
  return { success: true, url: url ?? undefined }
}

/** GET URL firmada de la foto del usuario actual (null si no tiene). */
export const getProfilePictureUrl = async (
  userId: string,
): Promise<string | null> => {
  if (!userId) return null
  const res = await ApiFacade.storage.postAction<{ url: string | null }>('get')
  return res.success && res.data ? res.data.url : null
}

/** Elimina la foto de perfil del usuario actual. */
export const deleteProfilePicture = async (userId: string): Promise<boolean> => {
  if (!userId) return false
  const res = await ApiFacade.storage.postAction('delete')
  return res.success
}

/** GET URL firmada de la foto de cualquier usuario (para admins/managers). */
export const getAnyUserProfilePictureUrl = async (
  userId: string,
): Promise<string | null> => {
  if (!userId) return null
  const res = await ApiFacade.storage.postAction<{ url: string | null }>(
    'getByUser',
    { username: userId },
  )
  return res.success && res.data ? res.data.url : null
}
