import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { useMyAppointments, useCancelAppointment } from './hooks'
import type { Appointment } from './types'
import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
}

function formatStatus(status: Appointment['status']): { label: string; className: string } {
  switch (status) {
    case 'SCHEDULED':
      return { label: 'Pendiente', className: 'bg-amber-100 text-amber-800' }
    case 'CONFIRMED':
      return { label: 'Confirmado', className: 'bg-green-100 text-green-800' }
    case 'CANCELLED':
      return { label: 'Cancelado', className: 'bg-red-100 text-red-800' }
    case 'COMPLETED':
      return { label: 'Completado', className: 'bg-blue-100 text-blue-800' }
    case 'NO_SHOW':
      return { label: 'No asistió', className: 'bg-slate-100 text-slate-800' }
    default:
      return { label: status, className: 'bg-slate-100 text-slate-800' }
  }
}

function formatModality(modality: Appointment['modality']): string {
  return modality === 'VIDEO' ? 'Video' : 'Presencial'
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { label, className } = formatStatus(appointment.status)
  const isPast = new Date(appointment.ends_at) < new Date()
  const canCancel = (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && !isPast
  const cancelMutation = useCancelAppointment()

  const handleCancel = () => {
    const reason = prompt('Motivo de la cancelación (opcional):')
    if (reason === null) return
    cancelMutation.mutate({ id: appointment.id, data: { reason } })
  }

  return (
    <Card variant="outlined" padding="lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex flex-col gap-1">
            <span className="font-bold text-sky-900">{appointment.doctor_name || 'Médico'}</span>
            <span className="text-sm text-slate-600">{formatDateTime(appointment.starts_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
              {label}
            </span>
            <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-sky-100 text-sky-800">
              {formatModality(appointment.modality)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {appointment.reason && (
            <span className="text-sm text-slate-600">Motivo: {appointment.reason}</span>
          )}
          {appointment.modality === 'VIDEO' && appointment.video_url && (
            <a href={appointment.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 hover:underline">
              Unirse a videollamada
            </a>
          )}
          {canCancel && (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className={buttonClasses({ variant: 'danger', size: 'sm' })}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar'}
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}

export function PatientAppointmentsPage() {
  const { data: appointments, isLoading, isError, refetch } = useMyAppointments()

  if (isLoading) {
    return (
      <div className="mx-auto flex h-[40vh] max-w-3xl items-center justify-center px-4">
        <p className="text-slate-500">Cargando tus turnos…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-red-600">No pudimos cargar tus turnos.</p>
        <button onClick={() => refetch()} className={buttonClasses({ size: 'sm', variant: 'outline', className: 'mt-4' })}>
          Reintentar
        </button>
      </div>
    )
  }

  const future = appointments?.filter(a => new Date(a.starts_at) >= new Date()) || []
  const past = appointments?.filter(a => new Date(a.starts_at) < new Date()) || []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-sky-900">Mis turnos</h1>
        <a href="/app/turnos/nuevo" className={buttonClasses({ size: 'md' })}>
          Sacar nuevo turno
        </a>
      </div>

      {future.length === 0 && past.length === 0 ? (
        <Card variant="outlined" padding="lg" className="text-center">
          <p className="text-slate-600">No tenés turnos agendados.</p>
          <a href="/app/turnos/nuevo" className={buttonClasses({ className: 'mt-4' })}>
            Sacá tu primer turno
          </a>
        </Card>
      ) : (
        <>
          {future.length > 0 && (
            <section className="mb-8" aria-labelledby="proximos-turnos">
              <h2 id="proximos-turnos" className="mb-4 text-lg font-semibold text-sky-900">
                Próximos turnos ({future.length})
              </h2>
              <div className="flex flex-col gap-4">
                {future.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="historial-turnos">
              <h2 id="historial-turnos" className="mb-4 text-lg font-semibold text-sky-900">
                Historial ({past.length})
              </h2>
              <div className="flex flex-col gap-4">
                {past.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}