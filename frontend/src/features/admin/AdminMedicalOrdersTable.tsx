import { Badge } from '../../components/ui'
import { apiFileUrl } from '../../services/api'
import { formatDateTime } from './format'
import type { AdminMedicalOrder } from './types'

const ORDER_TYPE_LABELS: Record<AdminMedicalOrder['type'], string> = {
  LAB: 'Laboratorio',
  IMAGING: 'Imágenes',
  REFERRAL: 'Interconsulta',
  OTHER: 'Otro',
}

export function AdminMedicalOrdersTable({
  orders,
}: {
  orders: AdminMedicalOrder[]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Órdenes médicas emitidas</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Folio
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Tipo
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Paciente
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Médico
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Emitida
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              PDF
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-medium text-sky-900">{order.folio}</td>
              <td className="px-4 py-3 text-slate-600">
                {ORDER_TYPE_LABELS[order.type]}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p>{order.patient_name ?? '—'}</p>
                <p className="text-xs text-slate-500">
                  DNI {order.patient_dni ?? '—'}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {order.doctor_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDateTime(order.issued_at)}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={order.status === 'ACTIVE' ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  {order.status === 'ACTIVE' ? 'Activa' : 'Anulada'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <a
                  href={apiFileUrl(
                    `/admin/prescriptions/medical-orders/${order.id}/pdf`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 hover:underline"
                >
                  Descargar
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
