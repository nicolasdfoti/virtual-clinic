import { Card } from '../../components/ui'
import type { AdminStats } from './types'

const ITEMS: { key: keyof AdminStats; label: string }[] = [
  { key: 'total_patients', label: 'Pacientes totales' },
  { key: 'active_patients', label: 'Pacientes activos' },
  { key: 'new_patients_this_month', label: 'Nuevos este mes' },
  { key: 'active_doctors', label: 'Médicos activos' },
]

export function StatsCards({ stats }: { stats: AdminStats }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ITEMS.map((item) => (
        <Card key={item.key} variant="outlined" padding="md">
          <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
          <dd className="mt-2 text-3xl font-bold text-sky-900">
            {stats[item.key]}
          </dd>
        </Card>
      ))}
    </dl>
  )
}
