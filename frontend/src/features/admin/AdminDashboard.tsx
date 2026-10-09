import { useAdminStats } from './hooks'
import { EnableDoctorProfileCard } from './EnableDoctorProfileCard'
import { StatsCards } from './StatsCards'

export function AdminDashboard() {
  const { data, isLoading, isError } = useAdminStats()

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Panel de administración
        </h1>
        <p className="mt-1 text-slate-600">
          Resumen de la actividad de la clínica.
        </p>
      </header>

      <section className="mt-6" aria-label="Estadísticas">
        {isLoading && (
          <p role="status" className="text-slate-500">
            Cargando estadísticas…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar las estadísticas. Recargá la página e intentá de
            nuevo.
          </p>
        )}

        {data && <StatsCards stats={data} />}
      </section>

      <section className="mt-8" aria-label="Perfil de médico">
        <EnableDoctorProfileCard />
      </section>
    </div>
  )
}
