import { api } from '../../services/api'
import type { 
  DoctorAppointment, 
  DoctorAvailability, 
  DoctorTimeOff, 
  DoctorPatient, 
  DoctorPatientDetail, 
  LinkPatientInput,
  Prescription,
  MedicalOrder,
  CreatePrescriptionRequest,
  CreateMedicalOrderRequest,
} from './types'

export function fetchDoctorPatients(q: string, page: { limit?: number; offset?: number } = {}): Promise<{ items: DoctorPatient[]; total: number; limit: number; offset: number }> {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (page.limit !== undefined) params.set('limit', String(page.limit))
  if (page.offset !== undefined) params.set('offset', String(page.offset))
  const query = params.toString()
  return api.get<{ items: DoctorPatient[]; total: number; limit: number; offset: number }>(`/doctor/patients${query ? `?${query}` : ''}`)
}

export function fetchDoctorPatient(id: number): Promise<DoctorPatientDetail> {
  return api.get<DoctorPatientDetail>(`/doctor/patients/${id}`)
}

export function linkPatient(input: LinkPatientInput): Promise<DoctorPatientDetail> {
  return api.post<DoctorPatientDetail>('/doctor/patients', input)
}

export const doctorAppointmentApi = {
  getMine: (): Promise<DoctorAppointment[]> =>
    api.get<DoctorAppointment[]>('/appointments/mine'),

  getDetail: (id: number): Promise<DoctorAppointment> =>
    api.get<DoctorAppointment>(`/doctor/appointments/${id}`),

  cancel: (id: number, reason?: string): Promise<{ id: number; status: string }> =>
    api.patch<{ id: number; status: string }>(`/appointments/${id}/cancel`, { reason }),

  complete: (id: number): Promise<{ id: number; status: string }> =>
    api.patch<{ id: number; status: string }>(`/appointments/${id}/complete`),

  noShow: (id: number): Promise<{ id: number; status: string }> =>
    api.patch<{ id: number; status: string }>(`/appointments/${id}/no-show`),

  getAvailability: (): Promise<DoctorAvailability[]> =>
    api.get<DoctorAvailability[]>('/doctor/availability'),

  createAvailability: (data: { weekday: number; start_time: string; end_time: string }): Promise<DoctorAvailability> =>
    api.post<DoctorAvailability>('/doctor/availability', data),

  deleteAvailability: (id: number): Promise<void> =>
    api.delete<void>(`/doctor/availability/${id}`),

  getTimeOff: (): Promise<DoctorTimeOff[]> =>
    api.get<DoctorTimeOff[]>('/doctor/time-off'),

  createTimeOff: (data: { starts_at: string; ends_at: string; reason?: string }): Promise<DoctorTimeOff> =>
    api.post<DoctorTimeOff>('/doctor/time-off', data),

  deleteTimeOff: (id: number): Promise<void> =>
    api.delete<void>(`/doctor/time-off/${id}`),

  // Recetas
  getPrescriptions: (patientId: number): Promise<Prescription[]> =>
    api.get<Prescription[]>(`/doctor/patients/${patientId}/prescriptions`),

  createPrescription: (patientId: number, data: CreatePrescriptionRequest): Promise<Prescription> =>
    api.post<Prescription>(`/doctor/patients/${patientId}/prescriptions`, data),

  cancelPrescription: (patientId: number, prescriptionId: number, reason: string): Promise<Prescription> =>
    api.patch<Prescription>(`/doctor/patients/${patientId}/prescriptions/${prescriptionId}/cancel`, { cancel_reason: reason }),

  // Ordenes medicas
  getOrders: (patientId: number): Promise<MedicalOrder[]> =>
    api.get<MedicalOrder[]>(`/doctor/patients/${patientId}/orders`),

  createOrder: (patientId: number, data: CreateMedicalOrderRequest): Promise<MedicalOrder> =>
    api.post<MedicalOrder>(`/doctor/patients/${patientId}/orders`, data),

  cancelOrder: (patientId: number, orderId: number, reason: string): Promise<MedicalOrder> =>
    api.patch<MedicalOrder>(`/doctor/patients/${patientId}/orders/${orderId}/cancel`, { cancel_reason: reason }),
}