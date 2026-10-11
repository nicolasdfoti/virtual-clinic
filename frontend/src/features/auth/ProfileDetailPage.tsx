import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { Badge } from '../../components/ui'
import { ApiError } from '../../services/api'
import { profileApi } from './profileApi'

export function ProfileDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const userIdNum = Number(userId)

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['profile', userIdNum],
    queryFn: () => profileApi.getProfile(userIdNum),
    enabled: !!userIdNum,
  })

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <p role="status" className="text-center text-slate-500">
          Cargando perfil…
        </p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-lg text-red-600">
            {error instanceof ApiError && error.status === 404
              ? 'Perfil no disponible'
              : 'No pudimos cargar el perfil. Recargá la página e intentá de nuevo.'}
          </p>
        </div>
      </div>
    )
  }

  const profile = data

  if (!profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600">Perfil no disponible</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Perfil de {profile.first_name} {profile.last_name}
        </h1>
        <div className="mt-2 flex items-center gap-2">
          <Badge variant={
            profile.type === 'doctor' ? 'success' :
            profile.type === 'admin' ? 'warning' : 'info'
          } dot>
            {profile.type === 'doctor' ? 'Médico' : profile.type === 'admin' ? 'Admin' : 'Paciente'}
          </Badge>
        </div>
      </header>

      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden p-6">
          <h2 className="text-lg font-semibold text-sky-900 mb-4">
            Datos de contacto
          </h2>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Nombre completo</dt>
              <dd className="mt-0.5 text-slate-900 font-medium">
                {profile.first_name} {profile.last_name}
              </dd>
            </div>
            {profile.type !== 'admin' && profile.type !== 'patient' && (
              <div>
                <dt className="text-sm font-medium text-slate-500">Email</dt>
                <dd className="mt-0.5 text-slate-900">
                  {profile.email}
                </dd>
              </div>
            )}
            {profile.type === 'doctor' && (
              <>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Especialidad</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.specialty}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Matrícula</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.license_number}
                  </dd>
                </div>
              </>
            )}
            {profile.bio && (
              <>
                <dt className="text-sm font-medium text-slate-500 sm:col-span-2">Presentación</dt>
                <dd className="mt-1 text-slate-900 whitespace-pre-wrap sm:col-span-2">
                  {profile.bio}
                </dd>
              </>
            )}
            {profile.type === 'patient' && (
              <>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-slate-500">Email</dt>
                  <dd className="mt-0.5 text-slate-900">{profile.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">DNI</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.dni ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Fecha de nacimiento</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('es-AR') : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Sexo</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.sex ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Teléfono</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.phone ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Dirección</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.address ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Localidad</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.city ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Obra social</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.insurance_provider ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Plan</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.insurance_plan ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">N° afiliado</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.insurance_member_number ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Contacto emergencia</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.emergency_contact_name ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-slate-500">Tel. emergencia</dt>
                  <dd className="mt-0.5 text-slate-900">
                    {profile.emergency_contact_phone ?? '—'}
                  </dd>
                </div>
              </>
            )}
          </dl>
        </div>
      </div>
    </div>
  )
}

export default ProfileDetailPage