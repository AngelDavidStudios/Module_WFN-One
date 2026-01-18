import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
  name: 'wfnOneStorage',
  access: (allow) => ({
    // Carpeta de fotos de perfil - usuarios de todos los grupos pueden gestionar sus fotos
    'profile-pictures/*': [
      allow.groups(['super_admin', 'admin', 'user']).to(['read', 'write', 'delete']),
    ],
    // Carpeta pública para recursos compartidos
    'public/*': [
      allow.groups(['super_admin', 'admin', 'user']).to(['read', 'write']),
      allow.guest.to(['read']),
    ],
  }),
});
