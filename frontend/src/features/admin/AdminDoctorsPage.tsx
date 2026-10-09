import { useState } from 'react'

import { Badge, Button, Card } from '../../components/ui'
import { ApiError } from '../../services/api'
import { DoctorFormModal } from './DoctorFormModal'
import { useAdminDoctors, useSetDoctorActive } from './hooks'

export function AdminDoctorsPage() {
  const [showForm, setShowForm] = useState(false)
  const { data, isLoading, isError } = useAdminDoctors()
  const toggle = useSetDoctorActive()

  const toggleError =
    toggle.error instanceof ApiError
      ? toggle.error.message
      : toggle.error
        ? 'No pudimos actualizar el estado del médico.'
        : ''

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
            Médicos
          </h1>
          <p className="mt-1 text-slate-600">
            Altas y estado de los profesionales de la clínica.
          </p>
        </div>

        <Button onClick={() => setShowForm(true)}>Nuevo médico</Button>
      </header>

      {toggleError && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {toggleError}
        </p>
      )}

      <div className="mt-6">
        {isLoading && (
          <p role="status" className="text-slate-500">
            Cargando médicos…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar los médicos. Recargá la página e intentá de nuevo.
          </p>
        )}

        {data && data.length === 0 && (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="text-slate-600">
              Todavía no hay médicos cargados. Empezá dando de alta al primero.
            </p>
          </Card>
        )}

        {data && data.length > 0 && (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <caption className="sr-only">Médicos de la clínica</caption>
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Médico
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Especialidad
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Matrícula
                  </th>
                  <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {data.map((doctor) => (
                  <tr key={doctor.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sky-900">
                        {doctor.first_name} {doctor.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{doctor.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor.specialty}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor.license_number}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={doctor.is_active ? 'success' : 'default'}
                        size="sm"
                        dot
                      >
                        {doctor.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant={doctor.is_active ? 'outline' : 'primary'}
                        disabled={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({
                            id: doctor.id,
                            active: !doctor.is_active,
                          })
                        }
                      >
                        {doctor.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <DoctorFormModal onClose={() => setShowForm(false)} />}
    </div>
  )
}
