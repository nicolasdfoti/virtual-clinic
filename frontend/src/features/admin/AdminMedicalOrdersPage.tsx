import { useState } from 'react'

import { Button, Card } from '../../components/ui'
import { AdminMedicalOrdersTable } from './AdminMedicalOrdersTable'
import { DocumentFilters } from './DocumentFilters'
import { useAdminMedicalOrders } from './hooks'
import type { MedicalOrderFilters } from './types'

const PAGE_SIZE = 20

export function AdminMedicalOrdersPage() {
  const [filters, setFilters] = useState<MedicalOrderFilters>({})
  const [page, setPage] = useState(0)

  const { data, isLoading, isError } = useAdminMedicalOrders(filters, {
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
        <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
          Órdenes médicas
        </h1>
        <p className="mt-1 text-slate-600">
          Órdenes y estudios solicitados, más recientes primero.
        </p>
      </header>

      <Card variant="outlined" padding="md" className="mt-6">
        <DocumentFilters
          showType
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
            Cargando órdenes…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar las órdenes. Recargá la página e intentá de nuevo.
          </p>
        )}

        {data && total === 0 && (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="text-slate-600">
              No hay órdenes que coincidan con los filtros.
            </p>
          </Card>
        )}

        {data && total > 0 && <AdminMedicalOrdersTable orders={data.items} />}
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
