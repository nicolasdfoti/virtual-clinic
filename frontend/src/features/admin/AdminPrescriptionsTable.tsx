import { apiFileUrl } from '../../services/api'
import { Badge } from '../../components/ui'
import { formatDateTime } from './format'
import type { AdminPrescription } from './types'

export function AdminPrescriptionsTable({
  prescriptions,
}: {
  prescriptions: AdminPrescription[]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Recetas emitidas</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Folio
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
              Ítems
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
          {prescriptions.map((prescription) => (
            <tr key={prescription.id}>
              <td className="px-4 py-3 font-medium text-sky-900">
                {prescription.folio}
              </td>
              <td className="px-4 py-3 text-slate-600">
                <p>{prescription.patient_name ?? '—'}</p>
                <p className="text-xs text-slate-500">
                  DNI {prescription.patient_dni ?? '—'}
                </p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {prescription.doctor_name ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDateTime(prescription.issued_at)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {prescription.item_count}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={prescription.status === 'ACTIVE' ? 'success' : 'danger'}
                  size="sm"
                  dot
                >
                  {prescription.status === 'ACTIVE' ? 'Activa' : 'Anulada'}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <a
                  href={apiFileUrl(`/admin/prescriptions/${prescription.id}/pdf`)}
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
