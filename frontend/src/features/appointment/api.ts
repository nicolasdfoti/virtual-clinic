import { api } from '../../services/api'
import type { Appointment, AppointmentSlot, BookAppointmentRequest, CancelAppointmentRequest, AppointmentActionResponse } from './types'

export const appointmentApi = {
  getSlots: (doctorId: number, from: string, to: string): Promise<AppointmentSlot[]> =>
    api.get<AppointmentSlot[]>(`/doctors/${doctorId}/slots?from=${from}&to=${to}`),

  book: (data: BookAppointmentRequest): Promise<Appointment> =>
    api.post<Appointment>('/appointments', data),

  getMine: (): Promise<Appointment[]> =>
    api.get<Appointment[]>('/appointments/mine'),

  cancel: (id: number, data: CancelAppointmentRequest): Promise<AppointmentActionResponse> =>
    api.patch<AppointmentActionResponse>(`/appointments/${id}/cancel`, data),

  complete: (id: number): Promise<AppointmentActionResponse> =>
    api.patch<AppointmentActionResponse>(`/appointments/${id}/complete`),

  noShow: (id: number): Promise<AppointmentActionResponse> =>
    api.patch<AppointmentActionResponse>(`/appointments/${id}/no-show`),
}