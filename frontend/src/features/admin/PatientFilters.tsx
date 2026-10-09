import { useState } from 'react'

import { Button, TextField } from '../../components/ui'
import type { AdminPatientFilters, PatientSort } from './types'

const selectClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const labelClasses = 'block text-sm font-medium text-slate-700'

type PatientFiltersProps = {
  filters: AdminPatientFilters
  onChange: (filters: AdminPatientFilters) => void
}

export function PatientFilters({ filters, onChange }: PatientFiltersProps) {
  const [q, setQ] = useState(filters.q ?? '')

  const activeValue =
    filters.is_active === undefined ? '' : String(filters.is_active)

  return (
    <form
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
      onSubmit={(event) => {
        event.preventDefault()
        onChange({ ...filters, q: q.trim() || undefined })
      }}
    >
      <TextField
        label="Buscar"
        name="q"
        placeholder="Nombre, email o DNI"
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />

      <div>
        <label htmlFor="filter-insurance" className={labelClasses}>
          Obra social
        </label>
        <input
          id="filter-insurance"
          className={selectClasses}
          placeholder="Ej. OSDE"
          value={filters.insurance_provider ?? ''}
          onChange={(event) =>
            onChange({
              ...filters,
              insurance_provider: event.target.value || undefined,
            })
          }
        />
      </div>

      <div>
        <label htmlFor="filter-active" className={labelClasses}>
          Estado
        </label>
        <select
          id="filter-active"
          className={selectClasses}
          value={activeValue}
          onChange={(event) => {
            const value = event.target.value
            onChange({
              ...filters,
              is_active: value === '' ? undefined : value === 'true',
            })
          }}
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="filter-sort" className={labelClasses}>
            Ordenar por
          </label>
          <select
            id="filter-sort"
            className={selectClasses}
            value={filters.sort ?? 'created_at'}
            onChange={(event) =>
              onChange({
                ...filters,
                sort: event.target.value as PatientSort,
              })
            }
          >
            <option value="created_at">Fecha de alta</option>
            <option value="last_name">Apellido</option>
            <option value="email">Email</option>
          </select>
        </div>

        <div>
          <label htmlFor="filter-order" className={labelClasses}>
            Orden
          </label>
          <select
            id="filter-order"
            className={selectClasses}
            value={filters.order ?? 'desc'}
            onChange={(event) =>
              onChange({
                ...filters,
                order: event.target.value as 'asc' | 'desc',
              })
            }
          >
            <option value="desc">Descendente</option>
            <option value="asc">Ascendente</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end sm:col-span-2 lg:col-span-4">
        <Button type="submit">Buscar</Button>
      </div>
    </form>
  )
}
