import { endOfWeek, format, startOfWeek } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

import type { DoctorAppointment } from './types'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

export interface AgendaWeek {
  start: Date
  end: Date
  days: { date: Date; appointments: DoctorAppointment[] }[]
}

// Arma la grilla semanal en horario de la clinica (no del navegador). Tanto los
// dias de la grilla como la fecha de cada turno se calculan con el mismo
// criterio, asi los turnos de la madrugada (hora argentina) caen en el dia
// correcto y no fuera de la semana mostrada.
export function buildAgendaWeek(
  viewDate: Date,
  appointments: DoctorAppointment[],
): AgendaWeek {
  const clinicViewDate = toZonedTime(viewDate, CLINIC_TZ)
  const start = startOfWeek(clinicViewDate, { weekStartsOn: 1 })
  const end = endOfWeek(clinicViewDate, { weekStartsOn: 1 })

  const days: { date: Date; appointments: DoctorAppointment[] }[] = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayKey = format(d, 'yyyy-MM-dd')
    const dayAppointments = appointments.filter(a => {
      const apptDate = toZonedTime(new Date(a.starts_at), CLINIC_TZ)
      return format(apptDate, 'yyyy-MM-dd') === dayKey
    })
    days.push({ date: new Date(d), appointments: dayAppointments })
  }

  return { start, end, days }
}
