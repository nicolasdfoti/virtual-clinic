import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

import { Button, TextField } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useLinkPatient } from './hooks'
import { linkPatientSchema, type LinkPatientFormValues } from './schemas'

export function LinkPatientModal({
  onClose,
  onLinked,
}: {
  onClose: () => void
  onLinked: (name: string) => void
}) {
  const mutation = useLinkPatient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LinkPatientFormValues>({
    resolver: zodResolver(linkPatientSchema),
    defaultValues: { dni: '', email: '' },
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const onSubmit = handleSubmit(async (values) => {
    try {
      const patient = await mutation.mutateAsync({
        dni: values.dni || undefined,
        email: values.email || undefined,
      })

      onLinked(`${patient.first_name} ${patient.last_name}`)
    } catch {
      // El error se muestra desde mutation.error.
    }
  })

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'No pudimos vincular al paciente.'
        : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 pt-16"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-patient-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2
          id="link-patient-modal-title"
          className="text-xl font-bold text-sky-900"
        >
          Vincular paciente
        </h2>

        <p className="mt-1 text-sm text-slate-600">
          Buscá a un paciente ya registrado por su DNI o su email.
        </p>

        <form onSubmit={onSubmit} className="mt-4 space-y-4" noValidate>
          <TextField
            label="DNI"
            inputMode="numeric"
            error={errors.dni?.message}
            {...register('dni')}
          />
          <TextField
            label="Email"
            type="email"
            autoComplete="off"
            error={errors.email?.message}
            {...register('email')}
          />

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {errorMessage}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Vincular
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
