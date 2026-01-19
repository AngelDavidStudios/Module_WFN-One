import { uploadData, getUrl, remove } from 'aws-amplify/storage';

/**
 * Servicio para gestionar fotos de perfil usando S3
 */

export interface ProfilePictureResult {
    success: boolean;
    url?: string;
    error?: string;
}

// Clave para guardar la extensión de la foto en localStorage
const PROFILE_PIC_EXT_KEY = 'profile_picture_ext';

/**
 * Sube una foto de perfil para el usuario actual
 * @param userId - ID del usuario
 * @param file - Archivo de imagen a subir
 */
export const uploadProfilePicture = async (
    userId: string,
    file: File
): Promise<ProfilePictureResult> => {
    try {
        if (!userId) {
            return {
                success: false,
                error: 'No se pudo obtener la identidad del usuario.',
            };
        }

        // Validar tipo de archivo
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return {
                success: false,
                error: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, GIF, WEBP',
            };
        }

        // Validar tamaño (máximo 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return {
                success: false,
                error: 'El archivo es demasiado grande. Máximo 5MB permitido.',
            };
        }

        // Siempre usamos la misma extensión para sobrescribir
        const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `profile-pictures/${userId}/avatar.${fileExtension}`;

        // Subir archivo
        await uploadData({
            path: fileName,
            data: file,
            options: {
                contentType: file.type,
            },
        }).result;

        // Guardar la extensión en localStorage para recuperarla después
        localStorage.setItem(PROFILE_PIC_EXT_KEY, fileExtension);

        // Obtener URL de la imagen
        const urlResult = await getUrl({
            path: fileName,
            options: {
                expiresIn: 3600,
            },
        });

        return {
            success: true,
            url: urlResult.url.toString(),
        };
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return {
            success: false,
            error: 'Error al subir la imagen. Por favor intenta de nuevo.',
        };
    }
};

/**
 * Obtiene la URL de la foto de perfil del usuario actual
 * @param userId - ID del usuario
 */
export const getProfilePictureUrl = async (userId: string): Promise<string | null> => {
    try {
        if (!userId) {
            return null;
        }

        // Intentar obtener la extensión guardada en localStorage
        const savedExt = localStorage.getItem(PROFILE_PIC_EXT_KEY);
        const extensions = savedExt ? [savedExt] : ['jpg', 'png', 'jpeg', 'gif', 'webp'];

        for (const ext of extensions) {
            try {
                const urlResult = await getUrl({
                    path: `profile-pictures/${userId}/avatar.${ext}`,
                    options: {
                        expiresIn: 3600,
                        validateObjectExistence: true,
                    },
                });
                // Si funciona, guardar la extensión
                localStorage.setItem(PROFILE_PIC_EXT_KEY, ext);
                return urlResult.url.toString();
            } catch {
                // Continuar con la siguiente extensión
            }
        }

        return null;
    } catch {
        return null;
    }
};

/**
 * Elimina la foto de perfil del usuario
 * @param userId - ID del usuario
 */
export const deleteProfilePicture = async (userId: string): Promise<boolean> => {
    try {
        if (!userId) {
            return false;
        }

        // Obtener la extensión guardada
        const savedExt = localStorage.getItem(PROFILE_PIC_EXT_KEY);
        const extensions = savedExt ? [savedExt] : ['jpg', 'png', 'jpeg', 'gif', 'webp'];

        for (const ext of extensions) {
            try {
                await remove({
                    path: `profile-pictures/${userId}/avatar.${ext}`,
                });
                // Limpiar localStorage
                localStorage.removeItem(PROFILE_PIC_EXT_KEY);
                return true;
            } catch {
                // Continuar con la siguiente extensión
            }
        }

        return true;
    } catch (error) {
        console.error('Error deleting profile picture:', error);
        return false;
    }
};

/**
 * Obtiene la URL de la foto de perfil de cualquier usuario (para admins)
 * No usa localStorage ya que puede ser para múltiples usuarios
 * @param userId - ID del usuario
 */
export const getAnyUserProfilePictureUrl = async (userId: string): Promise<string | null> => {
    try {
        if (!userId) {
            return null;
        }

        const extensions = ['jpg', 'png', 'jpeg', 'gif', 'webp'];

        for (const ext of extensions) {
            try {
                const urlResult = await getUrl({
                    path: `profile-pictures/${userId}/avatar.${ext}`,
                    options: {
                        expiresIn: 3600,
                        validateObjectExistence: true,
                    },
                });
                return urlResult.url.toString();
            } catch {
                // Continuar con la siguiente extensión
            }
        }

        return null;
    } catch {
        return null;
    }
};

