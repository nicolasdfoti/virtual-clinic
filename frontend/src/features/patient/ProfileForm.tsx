import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'

import { Button, TextField } from '../../components/ui'
import { ApiError } from '../../services/api'
import { profileSchema, type ProfileFormValues } from './schemas'
import type { PatientProfile } from './types'
import { useUpdatePatientProfile } from './usePatientProfile'

function toFormValues(profile: PatientProfile): ProfileFormValues {
  return {
    dni: profile.dni ?? '',
    birth_date: profile.birth_date ?? '',
    sex: profile.sex ?? '',
    phone: profile.phone ?? '',
    address: profile.address ?? '',
    city: profile.city ?? '',
    insurance_provider: profile.insurance_provider ?? '',
    insurance_plan: profile.insurance_plan ?? '',
    insurance_member_number: profile.insurance_member_number ?? '',
    emergency_contact_name: profile.emergency_contact_name ?? '',
    emergency_contact_phone: profile.emergency_contact_phone ?? '',
  }
}

function Section({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-6">
      <legend className="px-1 text-sm font-semibold uppercase tracking-wide text-sky-700">
        {title}
      </legend>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </fieldset>
  )
}

export function ProfileForm({ profile }: { profile: PatientProfile }) {
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: toFormValues(profile),
  })

  const mutation = useUpdatePatientProfile()

  const onSubmit = handleSubmit(async (values) => {
    setSaved(false)

    try {
      const updated = await mutation.mutateAsync(values)
      reset(toFormValues(updated))
      setSaved(true)
    } catch {
      // El error se muestra abajo desde mutation.error.
    }
  })

  const errorMessage =
    mutation.error instanceof ApiError
      ? mutation.error.message
      : mutation.error
        ? 'No pudimos guardar tus datos. Intentá de nuevo.'
        : ''

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Section title="Datos personales">
        <TextField
          label="DNI"
          inputMode="numeric"
          autoComplete="off"
          placeholder="Sin puntos"
          error={errors.dni?.message}
          {...register('dni')}
        />
        <TextField
          label="Fecha de nacimiento"
          type="date"
          error={errors.birth_date?.message}
          {...register('birth_date')}
        />
        <TextField
          label="Sexo"
          placeholder="Opcional"
          error={errors.sex?.message}
          {...register('sex')}
        />
        <TextField
          label="Teléfono"
          type="tel"
          autoComplete="tel"
          placeholder="11 5555-5555"
          error={errors.phone?.message}
          {...register('phone')}
        />
      </Section>

      <Section title="Domicilio">
        <TextField
          label="Dirección"
          autoComplete="street-address"
          error={errors.address?.message}
          {...register('address')}
        />
        <TextField
          label="Localidad"
          autoComplete="address-level2"
          error={errors.city?.message}
          {...register('city')}
        />
      </Section>

      <Section title="Cobertura médica">
        <TextField
          label="Obra social o prepaga"
          placeholder='Escribí "Particular" si no tenés'
          error={errors.insurance_provider?.message}
          {...register('insurance_provider')}
        />
        <TextField
          label="Plan"
          placeholder="Opcional"
          error={errors.insurance_plan?.message}
          {...register('insurance_plan')}
        />
        <TextField
          label="Número de afiliado"
          placeholder="Opcional"
          error={errors.insurance_member_number?.message}
          {...register('insurance_member_number')}
        />
      </Section>

      <Section title="Contacto de emergencia">
        <TextField
          label="Nombre y apellido"
          error={errors.emergency_contact_name?.message}
          {...register('emergency_contact_name')}
        />
        <TextField
          label="Teléfono de emergencia"
          type="tel"
          error={errors.emergency_contact_phone?.message}
          {...register('emergency_contact_phone')}
        />
      </Section>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {saved && (
        <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Guardamos tus datos.
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" size="lg" isLoading={isSubmitting}>
          Guardar cambios
        </Button>
      </div>
    </form>
  )
}
