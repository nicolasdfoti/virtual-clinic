import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { api } from '../services/api'

type PublicDoctorDetail = {
  id: number
  name: string
  specialty: string
  license_number: string
  bio: string | null
}

export function ProfessionalProfilePage() {
  const { id } = useParams<{ id: string }>()
  const doctorId = Number(id)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['professional', doctorId],
    queryFn: () =>
      api.get<PublicDoctorDetail>(`/public/doctors/${doctorId}`),
    enabled: !!doctorId,
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

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-lg text-red-600">
            Perfil no disponible
          </p>
        </div>
      </div>
    )
  }

  const initials = data.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-sky-100">
            <span className="text-2xl font-bold text-sky-700">
              {initials}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
              Dr. {data.name}
            </h1>
            <p className="mt-1 text-slate-600">
              {data.specialty}
            </p>
            <p className="text-sm text-slate-500">
              Matrícula: {data.license_number}
            </p>
          </div>
        </div>
      </header>

      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-sky-900">
              Presentación profesional
            </h2>
          </div>
          <div className="p-6">
            {data.bio ? (
              <p className="whitespace-pre-wrap text-slate-700">{data.bio}</p>
            ) : (
              <p className="text-slate-500 italic">
                Este profesional aún no ha agregado una presentación.
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-semibold text-sky-900">
              Información profesional
            </h2>
          </div>
          <div className="p-6">
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-slate-500">Especialidad</dt>
                <dd className="mt-0.5 text-slate-900">{data.specialty}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-500">Matrícula</dt>
                <dd className="mt-0.5 text-slate-900">{data.license_number}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalProfilePage