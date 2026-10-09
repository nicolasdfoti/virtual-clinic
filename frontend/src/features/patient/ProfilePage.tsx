import { Badge } from '../../components/ui'
import { ProfileForm } from './ProfileForm'
import { usePatientProfile } from './usePatientProfile'

export function ProfilePage() {
  const { data, isLoading, isError } = usePatientProfile()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
            Mi perfil
          </h1>
          <p className="mt-1 text-slate-600">
            Tus datos personales, cobertura y contacto de emergencia. Los ve solo
            el profesional que te atiende.
          </p>
        </div>

        {data && (
          <Badge variant={data.is_complete ? 'success' : 'warning'} dot>
            {data.is_complete ? 'Perfil completo' : 'Perfil incompleto'}
          </Badge>
        )}
      </header>

      <div className="mt-6">
        {isLoading && (
          <p role="status" className="text-slate-500">
            Cargando tu perfil…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar tu perfil. Recargá la página e intentá de nuevo.
          </p>
        )}

        {data && <ProfileForm profile={data} />}
      </div>
    </div>
  )
}
