import { useState } from 'react'

import { Button, TextField } from '../../components/ui'
import type { AuditLogFilters } from './types'

const dateInputClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const labelClasses = 'block text-sm font-medium text-slate-700'

type AuditFiltersProps = {
  filters: AuditLogFilters
  onChange: (filters: AuditLogFilters) => void
}

export function AuditFilters({ filters, onChange }: AuditFiltersProps) {
  const [actorId, setActorId] = useState(
    filters.actor_user_id !== undefined ? String(filters.actor_user_id) : '',
  )

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      onSubmit={(event) => {
        event.preventDefault()

        const parsed = Number(actorId)

        onChange({
          ...filters,
          actor_user_id:
            actorId.trim() && Number.isInteger(parsed) ? parsed : undefined,
        })
      }}
    >
      <TextField
        label="Acción"
        name="action"
        placeholder="Ej. patient_linked"
        value={filters.action ?? ''}
        onChange={(event) =>
          onChange({ ...filters, action: event.target.value || undefined })
        }
      />

      <TextField
        label="Entidad"
        name="entity_type"
        placeholder="Ej. patient_profile"
        value={filters.entity_type ?? ''}
        onChange={(event) =>
          onChange({
            ...filters,
            entity_type: event.target.value || undefined,
          })
        }
      />

      <div>
        <label htmlFor="audit-actor" className={labelClasses}>
          ID de usuario
        </label>
        <input
          id="audit-actor"
          type="number"
          min="1"
          className={dateInputClasses}
          value={actorId}
          onChange={(event) => setActorId(event.target.value)}
        />
      </div>

      <div>
        <label htmlFor="audit-from" className={labelClasses}>
          Desde
        </label>
        <input
          id="audit-from"
          type="date"
          className={dateInputClasses}
          value={filters.created_from ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              created_from: event.target.value || undefined,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="audit-to" className={labelClasses}>
          Hasta
        </label>
        <input
          id="audit-to"
          type="date"
          className={dateInputClasses}
          value={filters.created_to ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              created_to: event.target.value || undefined,
            })
          }
        />
      </div>

      <div className="flex justify-end sm:col-span-2 lg:col-span-5">
        <Button type="submit">Filtrar</Button>
      </div>
    </form>
  )
}
