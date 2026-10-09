import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { doctorAppointmentApi } from './api'
import type { DoctorAppointment } from './types'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, "EEEE d 'de' MMMM", { locale: es })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, 'HH:mm', { locale: es })
}

function formatStatus(status: DoctorAppointment['status']): { label: string; className: string } {
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

function formatModality(modality: DoctorAppointment['modality']): string {
  return modality === 'VIDEO' ? 'Videollamada' : 'Presencial'
}

export function DoctorAppointmentDetailPage() {
  const { appointmentId } = useParams<{ appointmentId: string }>()

  const { data: appointment, isLoading, isError, refetch } = useQuery({
    queryKey: ['doctor', 'appointment', appointmentId],
    queryFn: () => doctorAppointmentApi.getDetail(Number(appointmentId)),
    enabled: !!appointmentId,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-500">Cargando turno…</p>
      </div>
    )
  }

  if (isError || !appointment) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-red-600">No pudimos cargar el turno.</p>
        <button
          onClick={() => refetch()}
          className={buttonClasses({ size: 'sm', variant: 'outline', className: 'mt-4' })}
        >
          Reintentar
        </button>
      </div>
    )
  }

  const { label, className } = formatStatus(appointment.status)
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/app/medico/agenda"
          className={buttonClasses({ variant: 'outline', size: 'sm' })}
        >
          Volver a la agenda
        </Link>
      </div>

      <Card variant="outlined" padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-col gap-1">
              <span className="font-bold text-sky-900">{appointment.patient_name || 'Paciente'}</span>
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
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Paciente</dt>
            <dd className="font-medium text-slate-900">{appointment.patient_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">DNI</dt>
            <dd className="font-medium text-slate-900">{appointment.patient_dni || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Día</dt>
            <dd className="font-medium text-slate-900">{formatDate(appointment.starts_at)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Horario</dt>
            <dd className="font-medium text-slate-900">
              {formatTime(appointment.starts_at)} — {formatTime(appointment.ends_at)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Modalidad</dt>
            <dd className="font-medium text-slate-900">{formatModality(appointment.modality)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Estado</dt>
            <dd className="font-medium text-slate-900">{label}</dd>
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

        {appointment.cancel_reason && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 border border-red-200">
            <dt className="text-sm text-red-700">Motivo de cancelación</dt>
            <dd className="font-medium text-red-900">{appointment.cancel_reason}</dd>
          </div>
        )}

        {appointment.cancelled_by && (
          <div className="mt-4 p-4 rounded-lg bg-slate-50 border border-slate-200">
            <dt className="text-sm text-slate-500">Cancelado por</dt>
            <dd className="font-medium text-slate-900">Usuario ID: {appointment.cancelled_by}</dd>
          </div>
        )}
      </Card>
    </div>
  )
}