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
