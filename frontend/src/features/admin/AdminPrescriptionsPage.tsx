import { useState } from 'react'

import { Button, Card } from '../../components/ui'
import { AdminPrescriptionsTable } from './AdminPrescriptionsTable'
import { DocumentFilters } from './DocumentFilters'
import { useAdminPrescriptions } from './hooks'
import type { PrescriptionFilters } from './types'

const PAGE_SIZE = 20

export function AdminPrescriptionsPage() {
  const [filters, setFilters] = useState<PrescriptionFilters>({})
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useAdminPrescriptions(filters, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const total = data?.total ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)
  const hasNext = to < total

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">Recetas</h1>
        <p className="mt-1 text-slate-600">
          Recetas emitidas en la clínica, más recientes primero.
        </p>
      </header>

      <Card variant="outlined" padding="md" className="mt-6">
        <DocumentFilters
          filters={filters}
          onChange={(next) => {
            setFilters(next)
            setPage(0)
          }}
        />
      </Card>

      <div className="mt-6">
        {isLoading && (
          <p role="status" className="text-slate-500">
            Cargando recetas…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar las recetas. Recargá la página e intentá de nuevo.
          </p>
        )}

        {data && total === 0 && (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="text-slate-600">
              No hay recetas que coincidan con los filtros.
            </p>
          </Card>
        )}

        {data && total > 0 && (
          <AdminPrescriptionsTable prescriptions={data.items} />
        )}
      </div>

      {data && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Mostrando {from}–{to} de {total}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
