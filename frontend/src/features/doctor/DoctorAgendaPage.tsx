import { useState } from 'react'
import { format, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { useDoctorAppointments, useCancelAppointment, useCompleteAppointment, useNoShowAppointment } from './hooks'
import type { DoctorAppointment } from './types'
import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { DoctorAvailabilityEditor } from './DoctorAvailabilityEditor'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, "EEEE d 'de' MMMM 'a las' HH:mm", { locale: es })
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
  return modality === 'VIDEO' ? 'Video' : 'Presencial'
}

function AppointmentCard({
  appointment,
  onCancel,
  onComplete,
  onNoShow,
}: {
  appointment: DoctorAppointment
  onCancel: (id: number) => void
  onComplete: (id: number) => void
  onNoShow: (id: number) => void
}) {
  const { label, className } = formatStatus(appointment.status)
  const isPast = new Date(appointment.ends_at) < new Date()
  const canAct = (appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED') && !isPast

  return (
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

        <div className="flex flex-wrap gap-2">
          {appointment.reason && (
            <span className="text-sm text-slate-600">Motivo: {appointment.reason}</span>
          )}
          {appointment.modality === 'VIDEO' && appointment.video_url && (
            <a href={appointment.video_url} target="_blank" rel="noopener noreferrer" className="text-sm text-sky-600 hover:underline">
              Unirse a videollamada
            </a>
          )}
          {canAct && (
            <>
              <button
                onClick={() => {
                  const reason = prompt('Motivo de la cancelación (opcional):')
                  if (reason !== null) onCancel(appointment.id)
                }}
                className={buttonClasses({ variant: 'danger', size: 'sm' })}
              >
                Cancelar
              </button>
              <button
                onClick={() => onComplete(appointment.id)}
                className={buttonClasses({ size: 'sm' })}
              >
                Completar
              </button>
              <button
                onClick={() => onNoShow(appointment.id)}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                No asistió
              </button>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}

function DayAppointments({
  date,
  appointments,
  onCancel,
  onComplete,
  onNoShow,
}: {
  date: Date
  appointments: DoctorAppointment[]
  onCancel: (id: number) => void
  onComplete: (id: number) => void
  onNoShow: (id: number) => void
}) {
  const dayLabel = format(toZonedTime(date, CLINIC_TZ), "EEEE d 'de' MMMM", { locale: es })

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        <p className="text-slate-600">{dayLabel}: sin turnos agendados</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold text-sky-900">{dayLabel} ({appointments.length})</h3>
      <div className="space-y-3">
        {appointments.map(appt => (
          <AppointmentCard
            key={appt.id}
            appointment={appt}
            onCancel={onCancel}
            onComplete={onComplete}
            onNoShow={onNoShow}
          />
        ))}
      </div>
    </div>
  )
}

type ViewMode = 'agenda' | 'disponibilidad'

export function DoctorAgendaPage() {
  const [viewDate, setViewDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('agenda')
  const { data: appointments = [], isLoading, isError, refetch } = useDoctorAppointments()
  const cancelMutation = useCancelAppointment()
  const completeMutation = useCompleteAppointment()
  const noShowMutation = useNoShowAppointment()

  const handleCancel = (id: number) => {
    cancelMutation.mutate({ id })
  }

  const handleComplete = (id: number) => {
    completeMutation.mutate(id)
  }

  const handleNoShow = (id: number) => {
    noShowMutation.mutate(id)
  }

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(viewDate, { weekStartsOn: 1 })

  const days: { date: Date; appointments: DoctorAppointment[] }[] = []
  for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
    const dayAppointments = appointments.filter(a => {
      const apptDate = toZonedTime(new Date(a.starts_at), CLINIC_TZ)
      return format(apptDate, 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd')
    })
    days.push({ date: new Date(d), appointments: dayAppointments })
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-slate-500">Cargando agenda…</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-red-600">No pudimos cargar la agenda.</p>
        <button onClick={() => refetch()} className={buttonClasses({ size: 'sm', variant: 'outline', className: 'mt-4' })}>
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-sky-900">
            {viewMode === 'agenda' ? 'Agenda semanal' : 'Disponibilidad y bloqueos'}
          </h1>
          {viewMode === 'agenda' && (
            <p className="mt-1 text-slate-600">
              Semana del {format(toZonedTime(weekStart, CLINIC_TZ), "d 'de' MMMM", { locale: es })}
              {' '}al{' '}
              {format(toZonedTime(weekEnd, CLINIC_TZ), "d 'de' MMMM", { locale: es })}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setViewMode('agenda')}
            className={buttonClasses({
              variant: viewMode === 'agenda' ? 'primary' : 'outline',
              size: 'sm',
            })}
          >
            Agenda
          </button>
          <button
            onClick={() => setViewMode('disponibilidad')}
            className={buttonClasses({
              variant: viewMode === 'disponibilidad' ? 'primary' : 'outline',
              size: 'sm',
            })}
          >
            Disponibilidad
          </button>
          {viewMode === 'agenda' && (
            <>
              <button
                onClick={() => setViewDate(addDays(viewDate, -7))}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Semana anterior
              </button>
              <button
                onClick={() => setViewDate(new Date())}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Esta semana
              </button>
              <button
                onClick={() => setViewDate(addDays(viewDate, 7))}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Semana siguiente
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === 'agenda' ? (
        <div className="space-y-4">
          {days.map(({ date, appointments: dayAppointments }) => (
            <DayAppointments
              key={date.toISOString()}
              date={date}
              appointments={dayAppointments}
              onCancel={handleCancel}
              onComplete={handleComplete}
              onNoShow={handleNoShow}
            />
          ))}
        </div>
      ) : (
        <DoctorAvailabilityEditor />
      )}
    </div>
  )
}