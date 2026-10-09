/** Espejos de los schemas del backend para el portal del médico. */

export type DoctorNextAppointment = {
  id: number
  starts_at: string
  ends_at: string
  modality: string
  status: string
  reason: string | null
}

export type DoctorPatient = {
  id: number
  first_name: string
  last_name: string
  dni: string | null
  insurance_provider: string | null
  next_appointment: DoctorNextAppointment | null
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

/** Tipos para agenda y disponibilidad del médico */

export type AppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'
export type AppointmentModality = 'VIDEO' | 'IN_PERSON'

export type DoctorAppointment = {
  id: number
  doctor_id: number
  doctor_name: string | null
  patient_id: number
  patient_name: string | null
  patient_dni: string | null
  starts_at: string
  ends_at: string
  status: AppointmentStatus
  reason: string | null
  modality: AppointmentModality
  video_url: string | null
  cancelled_by: number | null
  cancel_reason: string | null
  created_at: string
}

export type DoctorAvailability = {
  id: number
  doctor_id: number
  weekday: number
  start_time: string
  end_time: string
}

export type DoctorTimeOff = {
  id: number
  doctor_id: number
  starts_at: string
  ends_at: string
  reason: string | null
  created_at: string
}