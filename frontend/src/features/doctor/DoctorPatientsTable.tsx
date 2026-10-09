import { Link } from 'react-router-dom'

import type { DoctorPatient } from './types'

export function DoctorPatientsTable({
  patients,
}: {
  patients: DoctorPatient[]
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Mis pacientes</caption>
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
              Próximo turno
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {patients.map((patient) => (
            <tr key={patient.id}>
              <td className="px-4 py-3 font-medium text-sky-900">
                {patient.last_name}, {patient.first_name}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {patient.dni ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {patient.insurance_provider ?? '—'}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {patient.next_appointment ?? '—'}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  to={`/app/medico/pacientes/${patient.id}`}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50"
                >
                  Ver perfil
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
