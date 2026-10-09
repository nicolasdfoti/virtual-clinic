import { useState } from 'react'

import { Button, TextField } from '../../components/ui'
import type { AdminMedicalOrder } from './types'

const selectClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const labelClasses = 'block text-sm font-medium text-slate-700'

export type DocumentFiltersValue = {
  q?: string
  status?: 'ACTIVE' | 'CANCELLED'
  type?: AdminMedicalOrder['type']
  from?: string
  to?: string
}

type DocumentFiltersProps = {
  filters: DocumentFiltersValue
  onChange: (filters: DocumentFiltersValue) => void
  statusLabel?: string
  showType?: boolean
}

/** Filtros compartidos por los listados admin de recetas y órdenes. */
export function DocumentFilters({
  filters,
  onChange,
  statusLabel = 'Estado',
  showType = false,
}: DocumentFiltersProps) {
  const [q, setQ] = useState(filters.q ?? '')

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        onChange({ ...filters, q: q.trim() || undefined })
      }}
    >
      <TextField
        label="Buscar"
        name="q"
        placeholder="Paciente o matrícula"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />

      <div>
        <label htmlFor="doc-status" className={labelClasses}>
          {statusLabel}
        </label>
        <select
          id="doc-status"
          className={selectClasses}
          value={filters.status ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              status: (event.target.value || undefined) as
                | 'ACTIVE'
                | 'CANCELLED'
                | undefined,
            })
          }
        >
          <option value="">Todas</option>
          <option value="ACTIVE">Activas</option>
          <option value="CANCELLED">Anuladas</option>
        </select>
      </div>

      {showType && (
        <div>
          <label htmlFor="doc-type" className={labelClasses}>
            Tipo
          </label>
          <select
            id="doc-type"
            className={selectClasses}
            value={filters.type ?? ''}
            onChange={(event) =>
              onChange({
                ...filters,
                type: (event.target.value || undefined) as
                  | AdminMedicalOrder['type']
                  | undefined,
              })
            }
          >
            <option value="">Todos</option>
            <option value="LAB">Laboratorio</option>
            <option value="IMAGING">Imágenes</option>
            <option value="REFERRAL">Interconsulta</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
      )}

      <div>
        <label htmlFor="doc-from" className={labelClasses}>
          Desde
        </label>
        <input
          id="doc-from"
          type="date"
          className={selectClasses}
          value={filters.from ?? ''}
          onChange={(event) =>
            onChange({ ...filters, from: event.target.value || undefined })
          }
        />
      </div>

      <div>
        <label htmlFor="doc-to" className={labelClasses}>
          Hasta
        </label>
        <input
          id="doc-to"
          type="date"
          className={selectClasses}
          value={filters.to ?? ''}
          onChange={(event) =>
            onChange({ ...filters, to: event.target.value || undefined })
          }
        />
      </div>

      <div className="flex justify-end sm:col-span-2 lg:col-span-5">
        <Button type="submit">Filtrar</Button>
      </div>
    </form>
  )
}
