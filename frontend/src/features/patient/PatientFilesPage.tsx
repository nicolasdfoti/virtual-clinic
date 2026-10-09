import { useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Badge, Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { apiFileUrl, formatFileSize } from '../../services/api'
import { formatDateTime } from '../../lib/format'
import { useMyFiles, useUploadFile } from './patientFileHooks'
import type { PatientFile } from '../doctor/patientFileTypes'

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
}

function FileTypeBadge({ mime }: { mime: string }) {
  if (mime === 'application/pdf') return <Badge variant="info" size="sm">PDF</Badge>
  if (mime.startsWith('image/')) return <Badge variant="success" size="sm">Imagen</Badge>
  return <Badge variant="default" size="sm">{mime}</Badge>
}

function FileRow({ file }: { file: PatientFile }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-4 border-b border-slate-100 last:border-0">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4 flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-900">{file.original_filename}</span>
          <FileTypeBadge mime={file.mime_type} />
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>{formatFileSize(file.size)}</span>
          <span>•</span>
          <span>Subido por: {file.uploaded_by_name ?? '—'}</span>
          <span>•</span>
          <span>{formatDateTime(file.created_at)}</span>
        </div>
      </div>
      <a
        href={apiFileUrl(`/patients/me/files/${file.id}/download`)}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-sky-600 hover:underline whitespace-nowrap"
      >
        Descargar
      </a>
    </div>
  )
}

export function PatientFilesPage() {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 20

  const uploadFile = useUploadFile()
  const { data, isLoading, isError, error } = useMyFiles({
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const files = data?.items ?? []
  const total = data?.total ?? 0
  const hasNext = (page + 1) * PAGE_SIZE < total

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0])
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxFiles: 1,
    noClick: false,
    noKeyboard: false,
  })

  const handleUpload = async () => {
    if (!selectedFile) return
    try {
      await uploadFile.mutateAsync(selectedFile)
      setSelectedFile(null)
    } catch {
      // error handled by uploadFile.error
    }
  }

  const removeFile = () => setSelectedFile(null)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-sky-900">Mis estudios</h1>
      <p className="mt-1 text-slate-600">
        Subí y consultá tus resultados de laboratorio, imágenes y otros archivos.
      </p>

      <Card variant="outlined" padding="lg" className="mt-6">
        <h2 className="text-lg font-semibold text-sky-900">Subir archivo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Formatos permitidos: PDF, JPG, PNG. Tamaño máximo: 10 MB.
        </p>

        {uploadFile.error instanceof Error && (
          <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {uploadFile.error.message}
          </p>
        )}

        <div {...getRootProps()} className={`mt-4 relative rounded-lg border-2 border-dashed transition-colors ${
          isDragActive
            ? 'border-sky-500 bg-sky-50'
            : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-slate-300 hover:border-sky-400'
        }`}>
          <input {...getInputProps()} id="file-upload" type="file" className="absolute inset-0 opacity-0 cursor-pointer" />
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="mt-2 text-sm text-slate-600">
              Arrastrá tu archivo acá o <span className="text-sky-600 font-medium cursor-pointer">hacé clic para seleccionar</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF, JPG, PNG • Máx. 10 MB</p>
          </div>
        </div>

        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-900">{selectedFile.name}</span>
              <span className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</span>
              <FileTypeBadge mime={selectedFile.type || 'application/pdf'} />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={removeFile}
                className={buttonClasses({ variant: 'ghost', size: 'sm' })}
              >
                Quitar
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={uploadFile.isPending}
                className={buttonClasses({ size: 'sm' })}
              >
                {uploadFile.isPending ? 'Subiendo…' : 'Subir'}
              </button>
            </div>
          </div>
        )}
      </Card>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-sky-900">Mis archivos</h2>

        {isLoading && files.length === 0 && (
          <p className="mt-4 text-center text-slate-500">Cargando archivos…</p>
        )}

        {isError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error instanceof Error ? error.message : 'No pudimos cargar tus archivos.'}
          </p>
        )}

        {!isLoading && files.length === 0 && !isError && (
          <Card variant="outlined" padding="lg" className="mt-4 text-center">
            <p className="text-slate-600">Todavía no tenés archivos subidos.</p>
          </Card>
        )}

        {files.length > 0 && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {files.map((file) => (
              <FileRow key={file.id} file={file} />
            ))}
          </div>
        )}

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
    </div>
  )
}