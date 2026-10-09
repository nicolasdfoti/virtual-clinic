import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'

import { Button, Card, TextField } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useAuth } from '../../context/useAuth'
import { ApiError } from '../../services/api'
import { useAdminDoctors, useEnableDoctorProfile } from './hooks'
import {
  doctorProfileSchema,
  type DoctorProfileFormValues,
} from './schemas'

/** Permite que un admin se cree su propia fila de médico sin cambiar de rol. */
export function EnableDoctorProfileCard() {
  const { user } = useAuth()
  const { data: doctors } = useAdminDoctors()
  const mutation = useEnableDoctorProfile()

  const own = doctors?.find((doctor) => doctor.user_id === user?.id)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DoctorProfileFormValues>({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: { specialty: '', license_number: '', bio: '' },
  })

  if (own) {
    return (
      <Card variant="outlined" padding="md">
        <h2 className="text-lg font-semibold text-sky-900">Perfil de médico</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ya tenés un perfil de médico ({own.specialty}). Podés atender pacientes
          y ver el panel del médico.
        </p>
        <Link
          to="/app/medico"
          className={buttonClasses({ variant: 'outline', className: 'mt-4' })}
        >
          Ir al panel del médico
        </Link>
      </Card>
    )
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        specialty: values.specialty,
        license_number: values.license_number,
        bio: values.bio || null,
      })
      reset({ specialty: '', license_number: '', bio: '' })
    } catch {
      // El error se muestra desde mutation.error.
    }
  })

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'No pudimos crear el perfil de médico.'
        : ''

  return (
    <Card variant="outlined" padding="md">
      <h2 className="text-lg font-semibold text-sky-900">
        Habilitarme como médico
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Si además de administrar vas a atender, creá tu perfil de médico. Seguís
        siendo administrador.
      </p>

      <form
        onSubmit={onSubmit}
        className="mt-4 grid gap-4 sm:grid-cols-2"
        noValidate
      >
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

        <div className="flex justify-end sm:col-span-2">
          <Button type="submit" isLoading={isSubmitting}>
            Crear perfil de médico
          </Button>
        </div>
      </form>
    </Card>
  )
}
