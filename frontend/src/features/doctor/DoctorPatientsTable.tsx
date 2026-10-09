import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'

import type { DoctorPatient, DoctorNextAppointment } from './types'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

function formatNextAppointment(appt: DoctorNextAppointment | null): string {
  if (!appt) return '—'
  const start = new Date(appt.starts_at)
  const end = new Date(appt.ends_at)
  const startZoned = toZonedTime(start, CLINIC_TZ)
  const endZoned = toZonedTime(end, CLINIC_TZ)
  return `${format(startZoned, "d 'de' MMMM", { locale: es })} a las ${format(startZoned, 'HH:mm', { locale: es })}–${format(endZoned, 'HH:mm', { locale: es })}`
}

function formatModality(modality: string): string {
  return modality === 'VIDEO' ? 'Video' : 'Presencial'
}

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
                {patient.next_appointment ? (
                  <>
                    <div className="font-medium text-sky-900">
                      {formatNextAppointment(patient.next_appointment)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatModality(patient.next_appointment.modality)}
                    </div>
                    <Link
                      to={`/app/medico/turnos/${patient.next_appointment.id}`}
                      className="text-sm text-sky-600 hover:underline mt-1 inline-block"
                    >
                      Ver detalle
                    </Link>
                  </>
                ) : (
                  '—'
                )}
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
