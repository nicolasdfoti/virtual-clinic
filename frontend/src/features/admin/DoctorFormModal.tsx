import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { Button, TextField } from '../../components/ui'
import { ApiError } from '../../services/api'
import { useCreateDoctor } from './hooks'
import { doctorSchema, type DoctorFormValues } from './schemas'
import { TemporaryPassword } from './TemporaryPassword'
import type { DoctorCreated } from './types'

export function DoctorFormModal({ onClose }: { onClose: () => void }) {
  const [created, setCreated] = useState<DoctorCreated | null>(null)
  const mutation = useCreateDoctor()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      specialty: '',
      license_number: '',
      bio: '',
    },
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
      const doctor = await mutation.mutateAsync({
        ...values,
        bio: values.bio || null,
      })
      setCreated(doctor)
    } catch {
      // El error se muestra desde mutation.error.
    }
  })

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'No pudimos dar de alta al médico.'
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
        aria-labelledby="doctor-modal-title"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 id="doctor-modal-title" className="text-xl font-bold text-sky-900">
          {created ? 'Médico dado de alta' : 'Nuevo médico'}
        </h2>

        {created ? (
          <div className="mt-4 space-y-4">
            <p className="text-slate-600">
              Dimos de alta a {created.first_name} {created.last_name}.
            </p>

            <TemporaryPassword password={created.temporary_password} />

            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>
                Listo
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={onSubmit}
            className="mt-4 grid gap-4 sm:grid-cols-2"
            noValidate
          >
            <div className="sm:col-span-2">
              <TextField
                label="Email"
                type="email"
                autoComplete="off"
                error={errors.email?.message}
                {...register('email')}
              />
            </div>
            <TextField
              label="Nombre"
              error={errors.first_name?.message}
              {...register('first_name')}
            />
            <TextField
              label="Apellido"
              error={errors.last_name?.message}
              {...register('last_name')}
            />
            <TextField
              label="Especialidad"
              error={errors.specialty?.message}
              {...register('specialty')}
            />
            <TextField
              label="Matrícula"
              error={errors.license_number?.message}
              {...register('license_number')}
            />
            <div className="sm:col-span-2">
              <TextField
                label="Presentación (opcional)"
                error={errors.bio?.message}
                {...register('bio')}
              />
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 sm:col-span-2"
              >
                {errorMessage}
              </p>
            )}

            <div className="flex justify-end gap-2 sm:col-span-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Dar de alta
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
