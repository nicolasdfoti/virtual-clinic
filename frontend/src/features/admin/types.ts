/** Espejos de los schemas del backend para la administración. */

export type AdminStats = {
  total_patients: number
  active_patients: number
  new_patients_this_month: number
  active_doctors: number
}

export type AdminPatient = {
  id: number
  first_name: string
  last_name: string
  email: string
  dni: string | null
  insurance_provider: string | null
  is_active: boolean
  created_at: string
}

export type PatientSort = 'created_at' | 'last_name' | 'email'

export type AdminPatientFilters = {
  q?: string
  insurance_provider?: string
  is_active?: boolean
  doctor_id?: number
  created_from?: string
  created_to?: string
  sort?: PatientSort
  order?: 'asc' | 'desc'
}

export type Doctor = {
  id: number
  user_id: number
  email: string
  first_name: string
  last_name: string
  specialty: string
  license_number: string
  bio: string | null
  is_active: boolean
  created_at: string
}

export type DoctorCreated = Doctor & {
  /** Contraseña temporal: el backend la devuelve una sola vez en el alta. */
  temporary_password: string
}

export type DoctorInput = {
  email: string
  first_name: string
  last_name: string
  specialty: string
  license_number: string
  bio?: string | null
}

export type DoctorUpdateInput = Partial<
  Pick<
    Doctor,
    'first_name' | 'last_name' | 'specialty' | 'license_number' | 'bio'
  >
>

export type DoctorProfileInput = {
  specialty: string
  license_number: string
  bio?: string | null
}
