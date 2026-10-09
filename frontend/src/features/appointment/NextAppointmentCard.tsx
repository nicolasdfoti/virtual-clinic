import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useCancelAppointment } from './hooks'
import type { Appointment } from './types'

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

interface NextAppointmentCardProps {
  appointment: Appointment | null
}

export function NextAppointmentCard({ appointment }: NextAppointmentCardProps) {
  const cancelMutation = useCancelAppointment()

  if (!appointment) {
    return (
      <Card variant="outlined" padding="lg">
        <h2 className="text-lg font-semibold text-sky-900">Tu próximo turno</h2>
        <div className="mt-4 flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-slate-600">No tenés turnos agendados por ahora.</p>
          <Link to="/app/turnos/nuevo" className={buttonClasses({ size: 'md' })}>
            Sacá un turno
          </Link>
        </div>
      </Card>
    )
  }

  const { label, className } = formatStatus(appointment.status)
  const isPast = new Date(appointment.ends_at) < new Date()

  const handleCancel = () => {
    const reason = prompt('Motivo de la cancelación (opcional):')
    if (reason === null) return
    cancelMutation.mutate({ id: appointment.id, data: { reason } })
  }

  return (
    <Card variant="outlined" padding="lg">
      <h2 className="text-lg font-semibold text-sky-900">Tu próximo turno</h2>

      <div className="mt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${className}`}>
            {label}
          </span>
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-sky-100 text-sky-800">
            {formatModality(appointment.modality)}
          </span>
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Médico</dt>
            <dd className="font-medium text-slate-900">{appointment.doctor_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Fecha y hora</dt>
            <dd className="font-medium text-slate-900">{formatDateTime(appointment.starts_at)}</dd>
          </div>
          {appointment.reason && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Motivo</dt>
              <dd className="font-medium text-slate-900">{appointment.reason}</dd>
            </div>
          )}
          {appointment.modality === 'VIDEO' && appointment.video_url && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Enlace</dt>
              <dd className="font-medium text-slate-900">
                <a href={appointment.video_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                  Unirse a la videollamada
                </a>
              </dd>
            </div>
          )}
        </dl>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link to="/app/turnos" className={buttonClasses({ variant: 'outline', size: 'sm' })}>
            Ver todos mis turnos
          </Link>
          {appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED' ? (
            <>
{isPast ? (
            <span className="self-center text-sm text-slate-500">Turno finalizado</span>
          ) : (
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className={buttonClasses({ variant: 'danger', size: 'sm' })}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar'}
            </button>
          )}
            </>
          ) : null}
        </div>
      </div>
    </Card>
  )
}