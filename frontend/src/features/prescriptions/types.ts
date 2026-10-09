/** Tipos de recetas/indicaciones y órdenes médicas del portal del paciente. */

export type PrescriptionStatus = 'ACTIVE' | 'CANCELLED'

export type PrescriptionItem = {
  id: number
  prescription_id: number
  medication: string
  dose: string
  frequency: string
  duration: string
  instructions: string | null
  created_at: string
}

export type Prescription = {
  id: number
  folio: string
  patient_id: number
  doctor_id: number
  appointment_id: number | null
  issued_at: string
  status: PrescriptionStatus
  cancel_reason: string | null
  items: PrescriptionItem[]
  created_at?: string
}

export type MedicalOrderType = 'LAB' | 'IMAGING' | 'REFERRAL' | 'OTHER'
export type MedicalOrderStatus = 'ACTIVE' | 'CANCELLED'

export type MedicalOrder = {
  id: number
  folio: string
  patient_id: number
  doctor_id: number
  appointment_id: number | null
  type: MedicalOrderType
  studies: string
  presumptive_diagnosis: string | null
  issued_at: string
  status: MedicalOrderStatus
  cancel_reason: string | null
  created_at?: string
}
