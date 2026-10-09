import { useState } from 'react'

import { Badge, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { apiFileUrl, formatFileSize } from '../../services/api'
import { formatDateTime } from '../../lib/format'
import { useDoctorPatientFiles } from './clinicalNoteHooks'

function FileTypeBadge({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <Badge variant="info" size="sm">PDF</Badge>
  if (mime.startsWith('image/')) return <Badge variant="success" size="sm">Imagen</Badge>
  return <Badge variant="default" size="sm">{mime}</Badge>
}

export function PatientFilesTab({ patientId }: { patientId: number }) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const { data, isLoading, isError } = useDoctorPatientFiles(patientId, {
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const files = data?.items ?? []
  const total = data?.total ?? 0
  const hasNext = (page + 1) * PAGE_SIZE < total

  if (isLoading && files.length === 0) {
    return <p className="py-8 text-center text-slate-500">Cargando archivos…</p>
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        No pudimos cargar los archivos.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-sky-900">Archivos del paciente</h2>

      {files.length === 0 && !isLoading && (
        <Card variant="outlined" padding="lg" className="text-center">
          <p className="text-slate-600">No hay archivos en la historia de este paciente.</p>
        </Card>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Archivo
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Tipo
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Tamaño
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Subido por
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold text-slate-600">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {files.map((file) => (
              <tr key={file.id}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{file.original_filename}</p>
                </td>
                <td className="px-4 py-3"><FileTypeBadge mime={file.mime_type} /></td>
                <td className="px-4 py-3 text-slate-600">{formatFileSize(file.size)}</td>
                <td className="px-4 py-3 text-slate-600">{file.uploaded_by_name ?? '—'}</td>
                <td className="px-4 py-3 text-slate-600">{formatDateTime(file.created_at)}</td>
                <td className="px-4 py-3">
                  <a
                    href={apiFileUrl(`/doctor/patients/${patientId}/files/${file.id}/download`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-sky-600 hover:underline"
                  >
                    Descargar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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