import { Link } from 'react-router-dom'

import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useAuth } from '../../context/useAuth'
import { QuickAccess } from './QuickAccess'

/** Home del paciente: resumen de una sola pantalla en desktop.
 *
 *  Todavia no hay endpoints de turnos/recetas, asi que se muestran estados
 *  vacios reales. Nunca datos mock: si no hay informacion, se dice que no hay.
 */
export function PatientHome() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

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

      <Card variant="outlined" padding="lg">
        <h2 className="text-lg font-semibold text-sky-900">Tu próximo turno</h2>

        <div className="mt-4 flex flex-col items-start gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <p className="text-slate-600">
            No tenés turnos agendados por ahora.
          </p>

          <Link to="/app/turnos" className={buttonClasses({ size: 'md' })}>
            Sacá un turno
          </Link>
        </div>
      </Card>

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
