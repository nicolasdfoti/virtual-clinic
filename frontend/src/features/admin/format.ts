const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'America/Argentina/Buenos_Aires',
})

/** Fecha de alta en la zona de la clínica. */
export function formatDate(iso: string): string {
  const date = new Date(iso)

  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date)
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Argentina/Buenos_Aires',
})

/** Fecha y hora en la zona de la clínica, para el log de auditoría. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)

  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date)
}
