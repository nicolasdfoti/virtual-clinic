import { Badge, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { apiFileUrl } from '../../services/api'
import { formatIssuedAt, ORDER_TYPE_LABELS } from './format'
import { useMyOrders } from './hooks'
import type { MedicalOrder } from './types'

function OrderCard({ order }: { order: MedicalOrder }) {
  return (
    <Card variant="outlined" padding="lg">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sky-900">
            {ORDER_TYPE_LABELS[order.type]} — {order.folio}
          </span>
          <span className="text-sm text-slate-600">
            Emitida: {formatIssuedAt(order.issued_at)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={order.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
            {order.status === 'ACTIVE' ? 'Activa' : 'Anulada'}
          </Badge>
          <a
            href={apiFileUrl(`/prescriptions/orders/${order.id}/pdf`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sky-600 hover:underline"
          >
            Descargar PDF
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-2 text-sm font-medium text-slate-900">Estudios solicitados</h2>
        <p className="whitespace-pre-wrap text-sm text-slate-700">{order.studies}</p>
      </div>

      {order.presumptive_diagnosis && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="mb-2 text-sm font-medium text-slate-900">Diagnóstico presuntivo</h2>
          <p className="text-sm text-slate-700">{order.presumptive_diagnosis}</p>
        </div>
      )}

      {order.cancel_reason && (
        <p className="mt-3 text-sm text-red-700">Motivo de anulación: {order.cancel_reason}</p>
      )}
    </Card>
  )
}

export function PatientOrdersPage() {
  const { data, isLoading, isError, refetch } = useMyOrders()
  const orders = data?.items ?? []

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sky-900">Mis órdenes médicas</h1>
      <p className="mt-1 text-slate-600">
        Acá podés consultar y descargar los estudios y prácticas que te solicitaron.
      </p>

      {isLoading && <p className="mt-6 text-slate-500">Cargando tus órdenes…</p>}

      {isError && (
        <div className="mt-6">
          <p className="text-red-600">No pudimos cargar tus órdenes.</p>
          <button
            onClick={() => refetch()}
            className={buttonClasses({ size: 'sm', variant: 'outline', className: 'mt-4' })}
          >
            Reintentar
          </button>
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && (
        <Card variant="outlined" padding="lg" className="mt-6 text-center">
          <p className="text-slate-600">Todavía no tenés órdenes para mostrar.</p>
        </Card>
      )}

      {orders.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  )
}
