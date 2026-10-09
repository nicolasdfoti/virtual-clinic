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

export type AuditLogEntry = {
  id: number
  actor_user_id: number | null
  actor_email: string | null
  actor_name: string | null
  action: string
  entity_type: string
  entity_id: number | null
  ip: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export type AuditLogFilters = {
  actor_user_id?: number
  action?: string
  entity_type?: string
  created_from?: string
  created_to?: string
}

export type AdminPrescription = {
  id: number
  folio: string
  doctor_id: number
  doctor_name: string | null
  patient_id: number
  patient_name: string | null
  patient_dni: string | null
  issued_at: string
  status: 'ACTIVE' | 'CANCELLED'
  cancel_reason: string | null
  item_count: number
}

export type AdminMedicalOrder = {
  id: number
  folio: string
  doctor_id: number
  doctor_name: string | null
  patient_id: number
  patient_name: string | null
  patient_dni: string | null
  type: 'LAB' | 'IMAGING' | 'REFERRAL' | 'OTHER'
  issued_at: string
  status: 'ACTIVE' | 'CANCELLED'
  cancel_reason: string | null
}

export type PrescriptionFilters = {
  q?: string
  status?: 'ACTIVE' | 'CANCELLED'
  from?: string
  to?: string
}

export type MedicalOrderFilters = {
  q?: string
  status?: 'ACTIVE' | 'CANCELLED'
  type?: AdminMedicalOrder['type']
  from?: string
  to?: string
}

export type DoctorActivity = {
  doctor_id: number
  doctor_name: string
  prescriptions_issued: number
  prescriptions_cancelled: number
  orders_issued: number
  orders_cancelled: number
  patients_attended: number
}

export type DoctorActivityFilters = {
  from?: string
  to?: string
}
