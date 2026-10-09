import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Badge, Card } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useDoctorPatient } from './hooks'
import type { DoctorPatientDetail } from './types'

const TABS = ['Perfil', 'Recetas', 'Órdenes', 'Turnos'] as const
type Tab = (typeof TABS)[number]

function value(value: string | null): string {
  return value ?? '—'
}

function ProfileTab({ patient }: { patient: DoctorPatientDetail }) {
  const rows: Array<[string, string]> = [
    ['DNI', value(patient.dni)],
    ['Fecha de nacimiento', value(patient.birth_date)],
    ['Sexo', value(patient.sex)],
    ['Teléfono', value(patient.phone)],
    ['Email', patient.email],
    ['Domicilio', value(patient.address)],
    ['Ciudad', value(patient.city)],
    ['Obra social', value(patient.insurance_provider)],
    ['Plan', value(patient.insurance_plan)],
    ['N° de afiliado', value(patient.insurance_member_number)],
    ['Contacto de emergencia', value(patient.emergency_contact_name)],
    ['Teléfono de emergencia', value(patient.emergency_contact_phone)],
  ]

  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, content]) => (
        <div key={label}>
          <dt className="text-sm font-medium text-slate-500">{label}</dt>
          <dd className="mt-0.5 text-slate-900">{content}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DoctorPatientDetailPage() {
  const { patientId } = useParams()
  const id = Number(patientId)

  const [tab, setTab] = useState<Tab>('Perfil')

  const { data, isLoading, isError, error } = useDoctorPatient(id)

  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/app/medico/pacientes"
        className="text-sm font-medium text-sky-700 hover:underline"
      >
        ← Volver a mis pacientes
      </Link>

      {isLoading && (
        <p role="status" className="mt-6 text-slate-500">
          Cargando el perfil…
        </p>
      )}

      {isError && (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {notFound
            ? 'No encontramos ese paciente entre los que atendés.'
            : 'No pudimos cargar el perfil. Recargá la página e intentá de nuevo.'}
        </p>
      )}

      {data && (
        <>
          <header className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
              {data.first_name} {data.last_name}
            </h1>
            {!data.is_complete && (
              <Badge variant="warning" size="sm">
                Perfil incompleto
              </Badge>
            )}
          </header>

          <div
            role="tablist"
            aria-label="Secciones del paciente"
            className="mt-6 flex flex-wrap gap-1 border-b border-slate-200"
          >
            {TABS.map((item) => (
              <button
                key={item}
                role="tab"
                type="button"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === item
                    ? 'border-b-2 border-sky-600 text-sky-700'
                    : 'text-slate-600 hover:text-sky-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <Card variant="outlined" padding="lg" className="mt-6">
            {tab === 'Perfil' ? (
              <ProfileTab patient={data} />
            ) : (
              <p className="text-center text-slate-600">
                {tab === 'Turnos'
                  ? 'Todavía no hay turnos agendados. Próximamente.'
                  : `La sección ${tab} va a estar disponible próximamente.`}
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
