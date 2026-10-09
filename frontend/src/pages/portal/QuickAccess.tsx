import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '../../components/ui'

type QuickAccessItem = {
  label: string
  href: string
  hint: string
  icon: ReactNode
}

const iconClass = 'h-6 w-6'

const items: QuickAccessItem[] = [
  {
    label: 'Turnos',
    href: '/app/turnos',
    hint: 'Próximos y pasados',
    icon: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    label: 'Recetas',
    href: '/app/recetas',
    hint: 'Tus recetas',
    icon: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5l5 5v11a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Órdenes',
    href: '/app/ordenes',
    hint: 'Estudios y prácticas',
    icon: (
      <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

/** Accesos rapidos del paciente. El contador sale de datos reales: sin
 *  endpoints todavia, arranca en 0 y no inventa numeros. */
export function QuickAccess() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((item) => (
        <Link key={item.href} to={item.href} className="block">
          <Card
            variant="interactive"
            padding="md"
            className="flex h-full items-center gap-4"
          >
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              {item.icon}
            </span>

            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-sky-900">{item.label}</span>
              <span className="block text-sm text-slate-500">{item.hint}</span>
            </span>

            <span
              className="flex h-7 min-w-7 items-center justify-center rounded-full bg-slate-100 px-2 text-sm font-semibold text-slate-600"
              aria-label={`${item.label}: 0 pendientes`}
            >
              0
            </span>
          </Card>
        </Link>
      ))}
    </div>
  )
}
