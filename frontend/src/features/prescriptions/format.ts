import type { MedicalOrderType } from './types'

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
})

/** Fecha y hora de emisión en la zona de la clínica. */
export function formatIssuedAt(iso: string): string {
  const date = new Date(iso)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}

export const ORDER_TYPE_LABELS: Record<MedicalOrderType, string> = {
  LAB: 'Laboratorio',
  IMAGING: 'Imágenes',
  REFERRAL: 'Interconsulta',
  OTHER: 'Otro',
}
