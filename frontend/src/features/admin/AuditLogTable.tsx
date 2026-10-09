import { formatDateTime } from './format'
import type { AuditLogEntry } from './types'

const ACTION_LABELS: Record<string, string> = {
  patient_profile_viewed: 'Vio un perfil de paciente',
  patient_linked: 'Vinculó a un paciente',
}

function actionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action
}

export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <caption className="sr-only">Registro de auditoría</caption>
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Fecha
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Usuario
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Acción
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              Entidad
            </th>
            <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
              IP
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                {formatDateTime(entry.created_at)}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-sky-900">
                  {entry.actor_name ?? 'Sistema'}
                </p>
                {entry.actor_email && (
                  <p className="text-xs text-slate-500">{entry.actor_email}</p>
                )}
              </td>
              <td className="px-4 py-3 text-slate-700">
                {actionLabel(entry.action)}
              </td>
              <td className="px-4 py-3 text-slate-600">
                {entry.entity_type}
                {entry.entity_id !== null ? ` #${entry.entity_id}` : ''}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {entry.ip ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
