/** Espejo de PublicDoctorResponse del backend. El directorio publico no expone
 *  ids ni datos de contacto: solo nombre, especialidad, matricula y bio. */
export type PublicDoctor = {
  name: string
  specialty: string
  license_number: string
  bio: string | null
}
