/** Espejos de los schemas del backend para el portal del médico. */

export type DoctorPatient = {
  id: number
  first_name: string
  last_name: string
  dni: string | null
  insurance_provider: string | null
  next_appointment: string | null
}

export type DoctorPatientDetail = {
  id: number
  first_name: string
  last_name: string
  email: string
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
}

export type LinkPatientInput = {
  dni?: string
  email?: string
}
