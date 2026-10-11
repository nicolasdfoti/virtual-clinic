/**
 * Política de visibilidad de perfiles (frontend).
 * Replica la lógica del backend para decisiones de UX.
 * La seguridad real la aplica el backend; esto es solo UX.
 */
export function canViewProfile(viewerRole: string, targetRole: string): boolean {
  // Propio perfil: siempre visible (se maneja en /app/perfil, no en /app/perfiles/:id)
  
  // PATIENT solo ve DOCTOR
  if (viewerRole === 'PATIENT') {
    return targetRole === 'DOCTOR'
  }

  // DOCTOR y ADMIN ven todos
  if (viewerRole === 'DOCTOR' || viewerRole === 'ADMIN') {
    return true
  }

  return false
}