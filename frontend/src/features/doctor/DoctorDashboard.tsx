import { useState } from 'react'

import { Button, Card, TextField } from '../../components/ui'
import { DoctorPatientsTable } from './DoctorPatientsTable'
import { LinkPatientModal } from './LinkPatientModal'
import { useDoctorPatients } from './hooks'

const PAGE_SIZE = 20

export function DoctorDashboard() {
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [linkedMessage, setLinkedMessage] = useState('')

  const { data, isLoading, isError } = useDoctorPatients(q, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const total = data?.total ?? 0
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1
  const to = Math.min((page + 1) * PAGE_SIZE, total)
  const hasNext = to < total

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
            Mis pacientes
          </h1>
          <p className="mt-1 text-slate-600">
            Pacientes vinculados a tu perfil. El perfil se abre en solo lectura.
          </p>
        </div>

        <Button type="button" onClick={() => setIsModalOpen(true)}>
          Vincular paciente
        </Button>
      </header>

      {linkedMessage && (
        <p
          role="status"
          className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {linkedMessage}
        </p>
      )}

      <Card variant="outlined" padding="md" className="mt-6">
        <form
          className="flex flex-wrap items-end gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            setQ(qInput)
            setPage(0)
          }}
        >
          <div className="min-w-64 flex-1">
            <TextField
              label="Buscar"
              name="q"
              placeholder="Nombre o DNI"
              value={qInput}
              onChange={(event) => setQInput(event.target.value)}
            />
          </div>
          <Button type="submit" variant="outline">
            Buscar
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        {isLoading && (
          <p role="status" className="text-slate-500">
            Cargando pacientes…
          </p>
        )}

        {isError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            No pudimos cargar tus pacientes. Recargá la página e intentá de
            nuevo.
          </p>
        )}

        {data && total === 0 && (
          <Card variant="outlined" padding="lg" className="text-center">
            <p className="text-slate-600">
              {q
                ? 'No encontramos pacientes con esa búsqueda.'
                : 'Todavía no tenés pacientes vinculados.'}
            </p>
          </Card>
        )}

        {data && total > 0 && <DoctorPatientsTable patients={data.items} />}
      </div>

      {data && total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Mostrando {from}–{to} de {total}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((current) => Math.max(0, current - 1))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <LinkPatientModal
          onClose={() => setIsModalOpen(false)}
          onLinked={(name) => {
            setIsModalOpen(false)
            setLinkedMessage(`${name} quedó vinculado a tu perfil.`)
            setQInput('')
            setQ('')
            setPage(0)
          }}
        />
      )}
    </div>
  )
}
