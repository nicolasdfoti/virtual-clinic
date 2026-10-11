import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

import { Avatar, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { ApiError } from '../../services/api'
import { DoctorProfileRequired } from './DoctorProfileRequired'
import { useDoctorAppointments, useDoctorPatients } from './hooks'
import type { DoctorAppointment } from './types'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

function isActiveAppointment(appointment: DoctorAppointment): boolean {
  return appointment.status === 'SCHEDULED' || appointment.status === 'CONFIRMED'
}

function formatAppointmentDateTime(value: string): string {
  const zoned = toZonedTime(new Date(value), CLINIC_TZ)
  return format(zoned, "EEE d 'de' MMMM 'a las' HH:mm", { locale: es })
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card variant="outlined" padding="lg">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-sky-900">{value}</p>
    </Card>
  )
}

export function DoctorDashboard() {
  const patientsQuery = useDoctorPatients('', { limit: 1 })
  const appointmentsQuery = useDoctorAppointments()

  const missingDoctorProfile =
    (patientsQuery.error instanceof ApiError &&
      patientsQuery.error.status === 403) ||
    (appointmentsQuery.error instanceof ApiError &&
      appointmentsQuery.error.status === 403)

  if (missingDoctorProfile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <DoctorProfileRequired />
      </div>
    )
  }

  const isLoading = patientsQuery.isLoading || appointmentsQuery.isLoading
  const isError = patientsQuery.isError || appointmentsQuery.isError

  const totalPatients = patientsQuery.data?.total ?? 0
  const appointments = appointmentsQuery.data ?? []

  const todayKey = format(toZonedTime(new Date(), CLINIC_TZ), 'yyyy-MM-dd')
  const todayAppointments = appointments.filter(
    (appointment) =>
      isActiveAppointment(appointment) &&
      format(
        toZonedTime(new Date(appointment.starts_at), CLINIC_TZ),
        'yyyy-MM-dd',
      ) === todayKey,
  )
  const upcoming = appointments
    .filter(
      (appointment) =>
        isActiveAppointment(appointment) &&
        new Date(appointment.starts_at) >= new Date(),
    )
    .sort(
      (a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
    )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Panel del médico
        </h1>
        <p className="mt-1 text-slate-600">
          Resumen de tu actividad y accesos rápidos.
        </p>
      </header>

      {isLoading && (
        <p role="status" className="mt-6 text-slate-500">
          Cargando panel…
        </p>
      )}

      {isError && !isLoading && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          No pudimos cargar el panel. Recargá la página e intentá de nuevo.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          <section
            className="mt-6 grid gap-4 sm:grid-cols-3"
            aria-label="Resumen"
          >
            <StatCard label="Pacientes vinculados" value={totalPatients} />
            <StatCard label="Turnos de hoy" value={todayAppointments.length} />
            <StatCard label="Próximos turnos" value={upcoming.length} />
          </section>

          <section className="mt-8" aria-label="Próximos turnos">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-sky-900">
                Próximos turnos
              </h2>
              <Link
                to="/app/medico/agenda"
                className="text-sm font-medium text-sky-700 hover:underline"
              >
                Ver agenda
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <Card variant="outlined" padding="lg" className="mt-3 text-center">
                <p className="text-slate-600">No tenés turnos próximos.</p>
              </Card>
            ) : (
              <ul className="mt-3 space-y-2">
                {upcoming.slice(0, 3).map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      to={`/app/medico/turnos/${appointment.id}`}
                      className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-300 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="flex items-center gap-3 font-medium text-sky-900">
                        <Avatar
                          name={appointment.patient_name || 'Paciente'}
                          src={appointment.patient_photo ?? undefined}
                          size="sm"
                        />
                        {appointment.patient_name || 'Paciente'}
                      </span>
                      <span className="text-sm text-slate-600">
                        {formatAppointmentDateTime(appointment.starts_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8" aria-label="Accesos rápidos">
            <h2 className="text-lg font-semibold text-sky-900">
              Accesos rápidos
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/app/medico/pacientes"
                className={buttonClasses({ variant: 'outline' })}
              >
                Ver pacientes
              </Link>
              <Link
                to="/app/medico/agenda"
                className={buttonClasses({ variant: 'outline' })}
              >
                Ver agenda
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
