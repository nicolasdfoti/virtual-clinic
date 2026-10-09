import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { ApiError } from '../../services/api'
import { formatDateTime } from '../../lib/format'
import { useAmendClinicalNote, useClinicalNotes, useCreateClinicalNote } from './clinicalNoteHooks'
import type { ClinicalNote } from './clinicalNoteTypes'

const noteSchema = z.object({
  content: z.string().min(1, 'La nota no puede estar vacía').max(20000),
})

type NoteFormValues = z.infer<typeof noteSchema>

function NoteCard({ note, onAmend }: { note: ClinicalNote; onAmend: (noteId: number) => void }) {
  const isAmendment = note.amends_note_id !== null

  return (
    <Card
      variant="outlined"
      padding="md"
      className={`relative ${isAmendment ? 'ml-8 border-sky-200' : ''}`}
    >
      {isAmendment && (
        <div className="absolute -top-2 -left-2">
          <Badge variant="info" size="sm">
            Adenda
          </Badge>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-medium text-sky-900">
            {isAmendment ? `Adenda a nota #${note.amends_note_id}` : 'Nota de evolución'}
          </span>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Dr. {note.doctor_name ?? '—'}</span>
            <span>•</span>
            <span>{formatDateTime(note.created_at)}</span>
          </div>
        </div>

        {!isAmendment && (
          <button
            type="button"
            onClick={() => onAmend(note.id)}
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            Agregar adenda
          </button>
        )}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-slate-700">{note.content}</p>
    </Card>
  )
}

function NoteForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: NoteFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { content: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      noValidate
    >
      <label className="block text-sm font-medium text-slate-700">
          Contenido de la nota
        </label>
        <textarea
          className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
            errors.content
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
          }`}
          rows={5}
          {...register('content')}
          aria-invalid={errors.content ? true : undefined}
        />
        {errors.content && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {errors.content.message}
          </p>
        )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonClasses({ size: 'sm' })}>
          {isSubmitting ? 'Guardando…' : 'Guardar nota'}
        </button>
      </div>
    </form>
  )
}

export function ClinicalNotesTab({ patientId }: { patientId: number }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const createNote = useCreateClinicalNote(patientId)
  const amendNote = useAmendClinicalNote(patientId)
  const { data, isLoading, isError, error } = useClinicalNotes(patientId, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const notes = data?.items ?? []
  const total = data?.total ?? 0
  const hasNext = (page + 1) * PAGE_SIZE < total

  const [showForm, setShowForm] = useState(false)
  const [amendingNoteId, setAmendingNoteId] = useState<number | null>(null)

  const handleCreate = async (values: NoteFormValues) => {
    try {
      await createNote.mutateAsync(values)
      setShowForm(false)
    } catch {
      // error handled by createNote.error
    }
  }

  const handleAmend = async (values: NoteFormValues) => {
    if (amendingNoteId === null) return
    try {
      await amendNote.mutateAsync({ noteId: amendingNoteId, payload: values })
      setAmendingNoteId(null)
    } catch {
      // error handled by amendNote.error
    }
  }

  const handleAmendClick = (noteId: number) => {
    setAmendingNoteId(noteId)
    setShowForm(false)
  }

  if (isLoading && notes.length === 0) {
    return <p className="py-8 text-center text-slate-500">Cargando historia clínica…</p>
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {error instanceof ApiError ? error.message : 'No pudimos cargar la historia clínica.'}
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-sky-900">Historia clínica</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={showForm || amendingNoteId !== null}
          className={buttonClasses({ size: 'sm' })}
        >
          Nueva nota
        </button>
      </div>

      {createNote.error instanceof ApiError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {createNote.error.message}
        </p>
      )}
      {amendNote.error instanceof ApiError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {amendNote.error.message}
        </p>
      )}

      {(showForm || amendingNoteId !== null) && (
        <NoteForm
          onSubmit={amendingNoteId !== null ? handleAmend : handleCreate}
          onCancel={() => {
            setShowForm(false)
            setAmendingNoteId(null)
          }}
        />
      )}

      {notes.length === 0 && !isLoading && (
        <Card variant="outlined" padding="lg" className="text-center">
          <p className="text-slate-600">No hay notas de evolución para este paciente.</p>
        </Card>
      )}

      <div className="space-y-4">
        {notes.map((note) => (
          <NoteCard key={note.id} note={note} onAmend={handleAmendClick} />
        ))}
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Anterior
            </button>
            <button
              disabled={!hasNext}
              onClick={() => setPage((p) => p + 1)}
              className={buttonClasses({ variant: 'outline', size: 'sm' })}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}