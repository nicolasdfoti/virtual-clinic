import type { Role } from '../services/auth'

/** A donde cae cada rol despues de loguearse.
 *
 *  Las tres areas del portal ya existen como paginas reales (aunque hoy sean
 *  placeholders), asi que ningun rol cae en el catch-all.
 */
export const ROLE_HOME: Record<Role, string> = {
  PATIENT: '/app',
  DOCTOR: '/app/medico',
  ADMIN: '/app/admin',
}

export const DEFAULT_ROLE_HOME = '/app'

export function homeForRole(role: Role | undefined | null): string {
  if (!role) {
    return DEFAULT_ROLE_HOME
  }

  return ROLE_HOME[role] ?? DEFAULT_ROLE_HOME
}
