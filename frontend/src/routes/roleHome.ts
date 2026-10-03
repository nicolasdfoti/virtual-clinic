import type { Role } from '../services/auth'

/** A donde cae cada rol despues de loguearse.
 *
 *  Hoy solo hay area de paciente. Cuando entren las areas de doctor y admin,
 *  alcanza con sumar la entrada: ProtectedRoute y el redirect post-login
 *  leen este mapa y no hay que tocar mas archivos.
 */
export const ROLE_HOME: Record<Role, string> = {
  PATIENT: '/pacientes',
  DOCTOR: '/doctors',
  ADMIN: '/admin',
}

export const DEFAULT_ROLE_HOME = '/pacientes'

export function homeForRole(role: Role | undefined | null): string {
  if (!role) {
    return DEFAULT_ROLE_HOME
  }

  return ROLE_HOME[role] ?? DEFAULT_ROLE_HOME
}