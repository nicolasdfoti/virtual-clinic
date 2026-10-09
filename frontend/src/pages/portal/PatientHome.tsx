import { Card } from '../../components/ui'
import { useAuth } from '../../context/useAuth'
import { ProfileIncompleteBanner } from '../../features/patient/ProfileIncompleteBanner'
import { QuickAccess } from './QuickAccess'
import { useMyAppointments } from '../../features/appointment/hooks'
import { NextAppointmentCard } from '../../features/appointment/NextAppointmentCard'

/** Home del paciente: resumen de una sola pantalla en desktop. */
export function PatientHome() {
  const { user } = useAuth()
  const { data: appointments } = useMyAppointments()

  if (!user) {
    return null
  }

  const futureAppointments = appointments?.filter(
    a => new Date(a.starts_at) >= new Date() && (a.status === 'SCHEDULED' || a.status === 'CONFIRMED')
  ) ?? []

  const nextAppointment = futureAppointments.sort(
    (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
  )[0] ?? null

  return (
    <div className="mx-auto flex h-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Hola, {user.first_name}
        </h1>
        <p className="mt-1 text-slate-600">
          Este es el resumen de tu actividad en la clínica.
        </p>
      </div>

      <ProfileIncompleteBanner />

      <NextAppointmentCard appointment={nextAppointment} />

      <section aria-labelledby="accesos-rapidos">
        <h2
          id="accesos-rapidos"
          className="text-lg font-semibold text-sky-900"
        >
          Accesos rápidos
        </h2>

        <div className="mt-3">
          <QuickAccess />
        </div>
      </section>

      <section aria-labelledby="ultimos-movimientos">
        <h2
          id="ultimos-movimientos"
          className="text-lg font-semibold text-sky-900"
        >
          Últimos movimientos
        </h2>

        <Card variant="outlined" padding="md" className="mt-3">
          <p className="text-slate-500">
            Todavía no tenés movimientos para mostrar.
          </p>
        </Card>
      </section>
    </div>
  )
}
