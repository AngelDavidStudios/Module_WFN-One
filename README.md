# Module_WFN-One — Sistema A (módulo de vacaciones)

SPA del **Sistema A** del proyecto **ISWZ3206 — Desarrollo de Software Seguro (UDLA)**.
Módulo de gestión de vacaciones (repo clonado `Module-WFN-One`) **migrado de React 19 + AWS Amplify
a Vue 3 + Vite + TypeScript** en la rama `System-A-WFNOne`, ya fusionada en `main` (PR #1).

Consume el **BFF Sistema C** (`01-AuthSystem/`, NestJS) para autenticación (AWS Cognito), cifrado
(KMS), fotos de perfil (S3) y la lógica de negocio de vacaciones (DynamoDB). El frontend **no** maneja
tokens ni el SDK de AWS: la sesión es una **cookie `HttpOnly`** emitida por el BFF (patrón BFF/OIDC).

> Historial de migración y notas detalladas: **`MIGRACION.md`**. Guía de trabajo: **`CLAUDE.md`**.

## Stack

- **Vue 3.5** (`<script setup>` SFC) + **Vite 8** + **TypeScript 6**
- **Pinia** (estado de sesión) · **Vue Router** (guards de auth/roles)
- **axios** (`withCredentials`, header `X-System: A`) · **@heroicons/vue**
- Paleta clara unificada (indigo / rojo, sin dark mode)

## Requisitos

- Node + **pnpm**
- Para correr en local con auth real: el **BFF Sistema C en `:3000`** (`01-AuthSystem` → `pnpm run start:dev`)
- Demo en **Chrome** (la cookie es cross-site `SameSite=None`; Safari la bloquea)

## Comandos

```bash
pnpm install
pnpm dev       # Vite dev server — puerto 5173 (strictPort), proxy /api → :3000
pnpm build     # vue-tsc -b && vite build  (el type-check es el gate)
pnpm preview   # sirve dist/ para smoke tests
```

## Configuración de entorno

Una sola variable, **pública** (se hornea en el bundle en build time, no es secreta):

| Variable        | Local                                  | Producción (Netlify)                                      |
| --------------- | -------------------------------------- | --------------------------------------------------------- |
| `VITE_API_URL`  | *(vacía)* → usa el proxy `/api` a `:3000` | Function URL del Lambda (Sistema C), **sin** barra final ni `/api` |

- En **local** no hace falta definirla: si está vacía, el cliente axios cae al proxy `/api` (ver `vite.config.ts`).
- En **producción** Vite es un sitio estático sin servidor (no resuelve `/api`), así que la URL del backend
  **debe hornearse en build time** vía `VITE_API_URL` en `.env.production`. Si falta, el login va a
  `https://<netlify>/api/auth/login` → 404. Ver plantilla en `.env.example`.

## Arquitectura (modelo BFF, sin Amplify)

- **Auth = cookie**, no tokens en el cliente. Login: `window.location → /api/auth/login?origin=A`.
  Sesión: `GET /api/auth/session`. Todas las llamadas via axios con `withCredentials` y header `X-System: A`.
- **Roles**: los grupos Cognito `Admins / Managers / Users` son la fuente de verdad; el frontend los
  traduce a `super_admin / admin / user` en `src/auth/roles.ts`. `useAuth()` expone `roles`, `isAdmin`,
  `isSuperAdmin`, `permissions`, `checkAccess`.
- **Identidad del módulo = Cognito `username`** (no el `sub`): unifica solicitudes ↔ balances ↔ árbol
  ↔ aprobaciones. Para mostrar se prefiere `name` (federados tienen `username = google_…`).
- **NO** usar `aws-amplify`, `@aws-amplify/*` ni `@aws-sdk/*` aquí: auth, KMS y S3 viven en el BFF.

## Estructura `src/`

```
api/          client.ts (axios + cookie + X-System), auth.ts
auth/         roles.ts  → mapeo grupos Cognito → roles WFN
stores/       session.ts (Pinia)
composables/  useAuth.ts
router/       index.ts (guards requiresAuth / requiredRoles → /unauthorized)
services/     base/{httpClient,ApiFacade}, vacationApi, userManagementApi,
              organizationApi, auditApi, profilePictureService
types/        auth, vacation, organization, audit
components/    ui/ (UI kit SFC), nav/, org/TreeNode.vue, SimpleModal.vue
views/        Login, Home, Dashboard, Profile, Unauthorized, PostLogin,
              vacation/*, organization/*, audit/*, UserManagement
```

## Despliegue

Desplegado en **Netlify**: <https://wfn-one.netlify.app>. `netlify.toml` define el build y un
**redirect SPA** (`/* → /index.html 200`) para que las rutas profundas de Vue Router no den 404 al recargar.
Backend (Sistema C) en AWS Lambda Function URL — su origen debe estar en `ALLOWED_ORIGINS` / `FRONTEND_URL_A`
del Lambda y en las *sign-out URLs* del App Client de Cognito.

## Estado

Funciona end-to-end contra el BFF live: login → Cognito (TOTP MFA, federación Google) → vuelta al frontend,
módulo de vacaciones (solicitudes, balances, árbol organizacional, aprobaciones, auditoría), gestión de
usuarios (Cognito Admin API) y fotos de perfil en S3.
