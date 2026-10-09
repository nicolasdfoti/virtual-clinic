/** Espejo de PublicDoctorResponse del backend. Incluye id para reserva de turnos. */
export type PublicDoctor = {
  id: number
  name: string
  specialty: string
  license_number: string
  bio: string | null
}
