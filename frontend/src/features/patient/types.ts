/** Espejo de PatientProfileResponse del backend. */
export type PatientProfile = {
  id: number | null
  user_id: number
  dni: string | null
  birth_date: string | null
  sex: string | null
  phone: string | null
  address: string | null
  city: string | null
  insurance_provider: string | null
  insurance_plan: string | null
  insurance_member_number: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  is_complete: boolean
  created_at: string | null
  updated_at: string | null
}

/** Campos editables del perfil. Se mandan siempre como texto; el backend
 *  normaliza las cadenas vacias a NULL. */
export type PatientProfileInput = {
  dni: string
  birth_date: string
  sex: string
  phone: string
  address: string
  city: string
  insurance_provider: string
  insurance_plan: string
  insurance_member_number: string
  emergency_contact_name: string
  emergency_contact_phone: string
}
