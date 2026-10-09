import type { Role } from '../services/auth'

export type PortalNavItem = {
  label: string
  href: string
}

/** Secciones del portal por rol. Es la unica fuente de verdad de la navbar
 *  privada; sumar una seccion es agregar una entrada aca y su ruta. */
export const PORTAL_NAV: Record<Role, PortalNavItem[]> = {
  PATIENT: [
    { label: 'Inicio', href: '/app' },
    { label: 'Turnos', href: '/app/turnos' },
    { label: 'Recetas', href: '/app/recetas' },
    { label: 'Órdenes', href: '/app/ordenes' },
  ],
  DOCTOR: [
    { label: 'Panel', href: '/app/medico' },
    { label: 'Agenda', href: '/app/medico/agenda' },
    { label: 'Pacientes', href: '/app/medico/pacientes' },
  ],
  ADMIN: [
    { label: 'Panel', href: '/app/admin' },
    { label: 'Médicos', href: '/app/admin/medicos' },
    { label: 'Pacientes', href: '/app/admin/pacientes' },
  ],
}
