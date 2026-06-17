/**
 * Servicio de fotos de perfil — STUB local.
 *
 * La versión Amplify subía a S3 (aws-amplify/storage). Eso ya no existe en el
 * modelo BFF. Como puente hasta que el backend NestJS exponga almacenamiento,
 * la imagen se guarda como data URL (base64) en localStorage por usuario, de
 * modo que el avatar sigue funcionando localmente sin AWS. Mismas firmas que
 * antes para no tocar las páginas.
 */

export interface ProfilePictureResult {
  success: boolean
  url?: string
  error?: string
}

const STORAGE_PREFIX = 'profile_picture:'

const keyFor = (userId: string): string => `${STORAGE_PREFIX}${userId}`

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'))
    reader.readAsDataURL(file)
  })

/** Sube (guarda local) la foto de perfil del usuario actual. */
export const uploadProfilePicture = async (
  userId: string,
  file: File,
): Promise<ProfilePictureResult> => {
  try {
    if (!userId) {
      return {
        success: false,
        error: 'No se pudo obtener la identidad del usuario.',
      }
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WEBP',
      }
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
      }
    }

    const dataUrl = await readFileAsDataUrl(file)
    localStorage.setItem(keyFor(userId), dataUrl)

    return { success: true, url: dataUrl }
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return {
      success: false,
      error: 'Error al subir la imagen. Por favor intenta de nuevo.',
    }
  }
}

/** Obtiene la URL (data URL) de la foto de perfil del usuario actual. */
export const getProfilePictureUrl = async (
  userId: string,
): Promise<string | null> => {
  if (!userId) return null
  return localStorage.getItem(keyFor(userId))
}

/** Elimina la foto de perfil del usuario. */
export const deleteProfilePicture = async (
  userId: string,
): Promise<boolean> => {
  if (!userId) return false
  localStorage.removeItem(keyFor(userId))
  return true
}

/** Obtiene la URL de la foto de cualquier usuario (para admins). */
export const getAnyUserProfilePictureUrl = async (
  userId: string,
): Promise<string | null> => {
  if (!userId) return null
  return localStorage.getItem(keyFor(userId))
}
