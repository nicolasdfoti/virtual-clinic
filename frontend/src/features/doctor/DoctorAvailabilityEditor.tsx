import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import { doctorAppointmentApi } from './api'
import type { DoctorAvailability, DoctorTimeOff } from './types'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { ApiError } from '../../services/api'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

const WEEKDAYS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
]

const fieldClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

/** La disponibilidad semanal guarda horas de pared ("08:00:00"). */
function formatWeeklyTime(timeStr: string): string {
  const [hour, minute] = timeStr.split(':')
  return `${hour}:${minute}`
}

/** Los bloqueos guardan instantes en UTC; se muestran en hora de Buenos Aires. */
function formatBlockDateTime(value: string): string {
  const hasZone = /[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)
  const zoned = toZonedTime(new Date(hasZone ? value : `${value}Z`), CLINIC_TZ)
  return format(zoned, 'dd/MM/yyyy HH:mm')
}

function describeError(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export function DoctorAvailabilityEditor() {
  const queryClient = useQueryClient()

  const { data: availability = [], isLoading: loadingAvail } = useQuery({
    queryKey: ['doctor', 'availability'],
    queryFn: doctorAppointmentApi.getAvailability,
    staleTime: 30_000,
  })

  const { data: timeOff = [], isLoading: loadingTimeOff } = useQuery({
    queryKey: ['doctor', 'time-off'],
    queryFn: doctorAppointmentApi.getTimeOff,
    staleTime: 30_000,
  })

  const createAvailMutation = useMutation({
    mutationFn: doctorAppointmentApi.createAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })

  const updateAvailMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number
      data: { start_time?: string; end_time?: string }
    }) => doctorAppointmentApi.updateAvailability(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
      setEditingId(null)
    },
  })

  const deleteAvailMutation = useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })

  const createTimeOffMutation = useMutation({
    mutationFn: doctorAppointmentApi.createTimeOff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'time-off'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })

  const deleteTimeOffMutation = useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.deleteTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'time-off'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })

  const [showAvailForm, setShowAvailForm] = useState(false)
  const [showTimeOffForm, setShowTimeOffForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const availForm = useForm({
    defaultValues: {
      weekday: 0,
      start_time: '08:00',
      end_time: '14:00',
    },
  })

  const editForm = useForm({
    defaultValues: {
      start_time: '08:00',
      end_time: '14:00',
    },
  })

  const timeOffForm = useForm({
    defaultValues: {
      starts_at: '',
      ends_at: '',
      reason: '',
    },
  })

  const handleAvailSubmit = (data: { weekday: number; start_time: string; end_time: string }) => {
    createAvailMutation.mutate(data)
    availForm.reset()
    setShowAvailForm(false)
  }

  const handleEditSubmit = (data: { start_time: string; end_time: string }) => {
    if (editingId === null) return
    updateAvailMutation.mutate({ id: editingId, data })
  }

  const handleTimeOffSubmit = (data: { starts_at: string; ends_at: string; reason?: string }) => {
    createTimeOffMutation.mutate(data)
    timeOffForm.reset()
    setShowTimeOffForm(false)
  }

  const startEdit = (avail: DoctorAvailability) => {
    setEditingId(avail.id)
    editForm.reset({
      start_time: avail.start_time.slice(0, 5),
      end_time: avail.end_time.slice(0, 5),
    })
  }

  const mutationError =
    createAvailMutation.error ||
    updateAvailMutation.error ||
    deleteAvailMutation.error ||
    createTimeOffMutation.error ||
    deleteTimeOffMutation.error

  if (loadingAvail || loadingTimeOff) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 text-center">
        <p className="text-slate-500">Cargando disponibilidad…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
      {mutationError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {describeError(mutationError, 'No pudimos completar la operación.')}
        </div>
      )}

      <section aria-labelledby="disponibilidad-semanal">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="disponibilidad-semanal" className="text-xl font-bold text-sky-900">
            Disponibilidad semanal
          </h2>
          <button
            type="button"
            onClick={() => setShowAvailForm(!showAvailForm)}
            className={buttonClasses({ size: 'sm' })}
          >
            {showAvailForm ? 'Cancelar' : 'Agregar franja'}
          </button>
        </div>

        {showAvailForm && (
          <form
            onSubmit={availForm.handleSubmit(handleAvailSubmit)}
            className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="weekday" className="block text-sm font-medium text-slate-700">
                  Día de la semana
                </label>
                <select
                  id="weekday"
                  {...availForm.register('weekday', { valueAsNumber: true })}
                  className={fieldClasses}
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="start_time" className="block text-sm font-medium text-slate-700">
                  Hora de inicio
                </label>
                <input
                  id="start_time"
                  type="time"
                  {...availForm.register('start_time')}
                  className={fieldClasses}
                />
              </div>
              <div>
                <label htmlFor="end_time" className="block text-sm font-medium text-slate-700">
                  Hora de fin
                </label>
                <input
                  id="end_time"
                  type="time"
                  {...availForm.register('end_time')}
                  className={fieldClasses}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAvailForm(false)}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createAvailMutation.isPending}
                className={buttonClasses({ size: 'sm' })}
              >
                {createAvailMutation.isPending ? 'Guardando…' : 'Guardar franja'}
              </button>
            </div>
          </form>
        )}

        {availability.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No hay franjas de disponibilidad configuradas.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <ul className="space-y-2" role="list">
              {availability.map((avail: DoctorAvailability) => (
                <li
                  key={avail.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-slate-200"
                >
                  {editingId === avail.id ? (
                    <form
                      onSubmit={editForm.handleSubmit(handleEditSubmit)}
                      className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="font-medium text-sky-900">
                        {WEEKDAYS[avail.weekday]?.label || `Día ${avail.weekday}`}
                      </span>
                      <input
                        type="time"
                        aria-label="Hora de inicio"
                        {...editForm.register('start_time')}
                        className={fieldClasses}
                      />
                      <input
                        type="time"
                        aria-label="Hora de fin"
                        {...editForm.register('end_time')}
                        className={fieldClasses}
                      />
                      <div className="flex gap-2 sm:ml-auto">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className={buttonClasses({ variant: 'outline', size: 'sm' })}
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={updateAvailMutation.isPending}
                          className={buttonClasses({ size: 'sm' })}
                        >
                          {updateAvailMutation.isPending ? 'Guardando…' : 'Guardar'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                        <span className="font-medium text-sky-900">
                          {WEEKDAYS[avail.weekday]?.label || `Día ${avail.weekday}`}
                        </span>
                        <span className="text-sm text-slate-600">
                          {formatWeeklyTime(avail.start_time)} – {formatWeeklyTime(avail.end_time)}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(avail)}
                          className={buttonClasses({ variant: 'outline', size: 'sm' })}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('¿Eliminar esta franja de disponibilidad?')) {
                              deleteAvailMutation.mutate(avail.id)
                            }
                          }}
                          disabled={deleteAvailMutation.isPending && deleteAvailMutation.variables === avail.id}
                          className={buttonClasses({ variant: 'danger', size: 'sm' })}
                        >
                          {deleteAvailMutation.isPending && deleteAvailMutation.variables === avail.id
                            ? 'Eliminando…'
                            : 'Eliminar'}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section aria-labelledby="bloqueos-tiempo">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="bloqueos-tiempo" className="text-xl font-bold text-sky-900">
            Bloqueos de tiempo (vacaciones, congresos, etc.)
          </h2>
          <button
            type="button"
            onClick={() => setShowTimeOffForm(!showTimeOffForm)}
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            {showTimeOffForm ? 'Cancelar' : 'Agregar bloqueo'}
          </button>
        </div>

        {showTimeOffForm && (
          <form
            onSubmit={timeOffForm.handleSubmit(handleTimeOffSubmit)}
            className="mb-6 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="starts_at" className="block text-sm font-medium text-slate-700">
                  Inicio
                </label>
                <input
                  id="starts_at"
                  type="datetime-local"
                  {...timeOffForm.register('starts_at')}
                  className={fieldClasses}
                />
              </div>
              <div>
                <label htmlFor="ends_at" className="block text-sm font-medium text-slate-700">
                  Fin
                </label>
                <input
                  id="ends_at"
                  type="datetime-local"
                  {...timeOffForm.register('ends_at')}
                  className={fieldClasses}
                />
              </div>
              <div className="sm:col-span-3">
                <label htmlFor="reason" className="block text-sm font-medium text-slate-700">
                  Motivo (opcional)
                </label>
                <input
                  id="reason"
                  type="text"
                  {...timeOffForm.register('reason')}
                  className={fieldClasses}
                  placeholder="Ej: Congreso, vacaciones, licencia"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowTimeOffForm(false)}
                className={buttonClasses({ variant: 'outline', size: 'sm' })}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createTimeOffMutation.isPending}
                className={buttonClasses({ size: 'sm' })}
              >
                {createTimeOffMutation.isPending ? 'Guardando…' : 'Guardar bloqueo'}
              </button>
            </div>
          </form>
        )}

        {timeOff.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="text-slate-600">No hay bloqueos de tiempo configurados.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <ul className="space-y-2" role="list">
              {timeOff.map((block: DoctorTimeOff) => (
                <li
                  key={block.id}
                  className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border border-slate-200"
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                    <span className="font-medium text-sky-900">
                      {formatBlockDateTime(block.starts_at)} – {formatBlockDateTime(block.ends_at)}
                    </span>
                    {block.reason && (
                      <span className="text-sm text-slate-600">{block.reason}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar este bloqueo de tiempo?')) {
                        deleteTimeOffMutation.mutate(block.id)
                      }
                    }}
                    disabled={deleteTimeOffMutation.isPending && deleteTimeOffMutation.variables === block.id}
                    className={buttonClasses({ variant: 'danger', size: 'sm' })}
                  >
                    {deleteTimeOffMutation.isPending && deleteTimeOffMutation.variables === block.id
                      ? 'Eliminando…'
                      : 'Eliminar'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  )
}
