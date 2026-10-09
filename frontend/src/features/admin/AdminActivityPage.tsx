import { useState } from 'react'

import { Card } from '../../components/ui'
import { useAdminDoctors, useDoctorActivity } from './hooks'
import type { DoctorActivityFilters } from './types'

const selectClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const labelClasses = 'block text-sm font-medium text-slate-700'

type MetricProps = {
  label: string
  value: number
  tone?: 'default' | 'danger'
}

function Metric({ label, value, tone = 'default' }: MetricProps) {
  return (
    <Card variant="outlined" padding="md">
      <p className="text-sm text-slate-600">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
          tone === 'danger' ? 'text-red-600' : 'text-sky-900'
        }`}
      >
        {value}
      </p>
    </Card>
  )
}

export function AdminActivityPage() {
  const [doctorId, setDoctorId] = useState<number | undefined>(undefined)
  const [filters, setFilters] = useState<DoctorActivityFilters>({})

  const { data: doctors, isLoading: loadingDoctors } = useAdminDoctors()
  const { data, isLoading, isError } = useDoctorActivity(doctorId, filters, {})

  const activity = data?.items[0]

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Actividad médica
        </h1>
        <p className="mt-1 text-slate-600">
          Recetas y órdenes emitidas por médico en un período.
        </p>
      </header>

      <Card variant="outlined" padding="md" className="mt-6">
        <form
          className="grid gap-4 sm:grid-cols-3 lg:items-end"
          onSubmit={(event) => event.preventDefault()}
        >
          <div>
            <label htmlFor="activity-doctor" className={labelClasses}>
              Médico
            </label>
            <select
              id="activity-doctor"
              className={selectClasses}
              value={doctorId ?? ''}
              onChange={(event) =>
                setDoctorId(
                  event.target.value ? Number(event.target.value) : undefined,
                )
              }
            >
              <option value="">
                {loadingDoctors ? 'Cargando…' : 'Seleccioná un médico'}
              </option>
              {doctors?.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.last_name}, {doctor.first_name} —{' '}
                  {doctor.license_number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="activity-from" className={labelClasses}>
              Desde
            </label>
            <input
              id="activity-from"
              type="date"
              className={selectClasses}
              value={filters.from ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  from: event.target.value || undefined,
                }))
              }
            />
          </div>

          <div>
            <label htmlFor="activity-to" className={labelClasses}>
              Hasta
            </label>
            <input
              id="activity-to"
              type="date"
              className={selectClasses}
              value={filters.to ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  to: event.target.value || undefined,
                }))
              }
            />
          </div>
        </form>
      </Card>

      <div className="mt-6">
        {doctorId === undefined && (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="text-slate-600">
              Elegí un médico para ver su actividad.
            </p>
          </Card>
        )}

        {doctorId !== undefined && isLoading && (
          <p role="status" className="text-slate-500">
            Cargando la actividad…
          </p>
        )}

        {doctorId !== undefined && isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar la actividad. Recargá la página e intentá de nuevo.
          </p>
        )}

        {activity && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Metric
              label="Recetas emitidas"
              value={activity.prescriptions_issued}
            />
            <Metric
              label="Recetas anuladas"
              value={activity.prescriptions_cancelled}
              tone="danger"
            />
            <Metric label="Órdenes emitidas" value={activity.orders_issued} />
            <Metric
              label="Órdenes anuladas"
              value={activity.orders_cancelled}
              tone="danger"
            />
            <Metric
              label="Pacientes atendidos"
              value={activity.patients_attended}
            />
          </div>
        )}
      </div>
    </div>
  )
}
