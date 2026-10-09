/** Profesional tal como lo va a proveer la API del directorio (Fase 4).
 *
 *  Hoy la lista está vacía a propósito: no hay datos reales y está prohibido
 *  mostrar nombres, matrículas, reseñas o precios inventados. Los componentes
 *  quedan listos para consumir estos campos cuando exista el backend.
 */
export type Professional = {
  id: string
  name: string
  specialty: string
  licenseNumber: string
  bio: string
}

export const professionals: Professional[] = []