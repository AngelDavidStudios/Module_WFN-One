// Mapeo entre los grupos Cognito del Sistema C (fuente de verdad, NO se
// modifican) y el vocabulario de roles que usa la app WFN. Centralizado aquí
// para que ajustar el mapeo sea un cambio de una sola línea.
//
//   Cognito group  ->  rol WFN
//   Admins         ->  super_admin
//   Managers       ->  admin
//   Users          ->  user

export type UserRole = 'super_admin' | 'admin' | 'user'

const GROUP_TO_ROLE: Record<string, UserRole> = {
  Admins: 'super_admin',
  Managers: 'admin',
  Users: 'user',
}

/** Traduce los grupos Cognito (session.user.groups) a roles WFN. */
export function rolesFromGroups(groups: string[] | undefined): UserRole[] {
  if (!groups || groups.length === 0) return ['user']
  const roles = groups
    .map((g) => GROUP_TO_ROLE[g])
    .filter((r): r is UserRole => Boolean(r))
  return roles.length > 0 ? roles : ['user']
}

/** ¿El conjunto de roles cubre al menos uno de los requeridos? super_admin todo. */
export function hasAccess(
  userRoles: UserRole[],
  requiredRoles: UserRole[],
): boolean {
  if (requiredRoles.length === 0) return true
  if (userRoles.includes('super_admin')) return true
  return userRoles.some((role) => requiredRoles.includes(role))
}
