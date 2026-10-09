import { z } from 'zod'
import type { AppointmentModality } from '../doctor/types'

export const bookAppointmentSchema = z.object({
  doctor_id: z.number().min(1, 'Seleccioná un médico'),
  starts_at: z.string().min(1, 'Seleccioná un horario'),
  reason: z.string().max(500, 'El motivo no puede superar los 500 caracteres').optional().nullable(),
  modality: z.enum(['VIDEO', 'IN_PERSON'] as [AppointmentModality, ...AppointmentModality[]]),
})

export type BookAppointmentForm = z.infer<typeof bookAppointmentSchema>

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500, 'El motivo no puede superar los 500 caracteres').optional().nullable(),
})

export type CancelAppointmentForm = z.infer<typeof cancelAppointmentSchema>