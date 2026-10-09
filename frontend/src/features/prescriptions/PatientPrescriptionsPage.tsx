import { useState } from 'react'

import { Badge, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { apiFileUrl } from '../../services/api'
import { formatIssuedAt } from './format'
import { useMyPrescriptions } from './hooks'
import type { Prescription, PrescriptionStatus } from './types'

const FILTERS: Array<{ label: string; value: PrescriptionStatus | undefined }> = [
  { label: 'Todas', value: undefined },
  { label: 'Activas', value: 'ACTIVE' },
  { label: 'Anuladas', value: 'CANCELLED' },
]

function StatusBadge({ status }: { status: PrescriptionStatus }) {
  return (
    <Badge variant={status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
      {status === 'ACTIVE' ? 'Activa' : 'Anulada'}
    </Badge>
  )
}

function PrescriptionCard({ prescription }: { prescription: Prescription }) {
  return (
    <Card variant="outlined" padding="lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sky-900">Receta {prescription.folio}</span>
          <span className="text-sm text-slate-600">
            Emitida: {formatIssuedAt(prescription.issued_at)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={prescription.status} />
          <a
            href={apiFileUrl(`/prescriptions/${prescription.id}/pdf`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-600 hover:underline"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {prescription.items.map((item) => (
          <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <span className="font-medium text-slate-900">{item.medication}</span>
            <span className="text-slate-600">
              {' '}
              — {item.dose}, {item.frequency}, {item.duration}
            </span>
            {item.instructions && <p className="mt-1 text-slate-600">{item.instructions}</p>}
          </li>
        ))}
      </ul>

      {prescription.cancel_reason && (
        <p className="mt-3 text-sm text-red-700">
          Motivo de anulación: {prescription.cancel_reason}
        </p>
      )}
    </Card>
  )
}

export function PatientPrescriptionsPage() {
  const [status, setStatus] = useState<PrescriptionStatus | undefined>(undefined)
  const { data, isLoading, isError, refetch } = useMyPrescriptions(status)
  const prescriptions = data?.items ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sky-900">Mis recetas e indicaciones</h1>
      <p className="mt-1 text-slate-600">
        Acá podés consultar y descargar las indicaciones que te emitieron.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            aria-pressed={status === filter.value}
            onClick={() => setStatus(filter.value)}
            className={buttonClasses({
              variant: status === filter.value ? 'primary' : 'outline',
              size: 'sm',
            })}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-6 text-slate-500">Cargando tus recetas…</p>}

      {isError && (
        <div className="mt-6">
          <p className="text-red-600">No pudimos cargar tus recetas.</p>
          <button
            onClick={() => refetch()}
            className={buttonClasses({ size: 'sm', variant: 'outline', className: 'mt-4' })}
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && prescriptions.length === 0 && (
        <Card variant="outlined" padding="lg" className="mt-6 text-center">
          <p className="text-slate-600">Todavía no tenés recetas para mostrar.</p>
        </Card>
      )}

      {prescriptions.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {prescriptions.map((prescription) => (
            <PrescriptionCard key={prescription.id} prescription={prescription} />
          ))}
        </div>
      )}
    </div>
  )
}
