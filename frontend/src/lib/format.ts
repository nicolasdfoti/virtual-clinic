/** Utilidades de formato compartidas. */

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: CLINIC_TZ,
})

/** Fecha y hora en la zona de la clínica. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}