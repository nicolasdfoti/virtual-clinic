/** Tipos para el perfil del médico y admin. */

export type DoctorProfile = {
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  specialty: string
  license_number: string
  bio: string | null
  is_active: boolean
  created_at: string
}

export type AdminProfile = {
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  created_at: string
}

/** Entrada para actualizar la bio del médico. */
export type DoctorBioInput = {
  bio: string | null
}