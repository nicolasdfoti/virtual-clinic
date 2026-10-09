import type { AppointmentModality, AppointmentStatus } from '../doctor/types'

export type AppointmentSlot = {
  start: string
  end: string
}

export type Appointment = {
  id: number
  doctor_id: number
  doctor_name: string | null
  patient_id: number
  patient_name: string | null
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

export type BookAppointmentRequest = {
  doctor_id: number
  starts_at: string
  reason?: string | null
  modality: AppointmentModality
}

export type CancelAppointmentRequest = {
  reason?: string | null
}

export type AppointmentActionResponse = {
  id: number
  status: AppointmentStatus
}