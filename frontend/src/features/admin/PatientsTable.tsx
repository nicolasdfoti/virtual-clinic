import { Badge } from '../../components/ui'
import { formatDate } from './format'
import type { AdminPatient } from './types'

export function PatientsTable({ patients }: { patients: AdminPatient[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Pacientes registrados</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Paciente
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              DNI
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Obra social
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Estado
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Alta
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="px-4 py-3">
                <p className="font-medium text-sky-900">
                  {patient.first_name} {patient.last_name}
                </p>
                <p className="text-xs text-slate-500">{patient.email}</p>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {patient.dni ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {patient.insurance_provider ?? '—'}
              </td>
              <td className="px-4 py-3">
                <Badge
                  variant={patient.is_active ? 'success' : 'default'}
                  size="sm"
                  dot
                >
                  {patient.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(patient.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
