import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Card, Badge } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { doctorBioSchema, type DoctorBioFormValues } from '../doctor/profileSchemas'
import { useMyDoctorProfile, useUpdateMyDoctorBio } from '../doctor/profileHooks'
import { useMyAdminProfile } from '../admin/profileHooks'
import { useAuth } from '../../context/useAuth'
import { ProfilePage as PatientProfilePage } from '../patient/ProfilePage'
import { ProfilePhotoCard } from './ProfilePhotoCard'

/** Perfil del médico: solo lectura + bio editable. */
function DoctorProfileView() {
  const { data: doctor, isLoading, isError, error } = useMyDoctorProfile()
  const updateBio = useUpdateMyDoctorBio()
  const [showBioForm, setShowBioForm] = useState(false)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DoctorBioFormValues>({
    resolver: zodResolver(doctorBioSchema),
    defaultValues: { bio: '' },
  })

  const handleBioSubmit = async (values: DoctorBioFormValues) => {
    setSaved(false)
    try {
      await updateBio.mutateAsync(values)
      reset({ bio: '' })
      setSaved(true)
      setShowBioForm(false)
    } catch {
      // El error se muestra abajo desde mutation.error.
    }
  }

  if (isLoading) {
    return <p role="status" className="text-slate-500">Cargando tu perfil…</p>
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        No pudimos cargar tu perfil. Recargá la página e intentá de nuevo.
      </p>
    )
  }

  if (!doctor) {
    return <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">No pudimos cargar tu perfil.</p>
  }

  const doctorDataSafe = doctor

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-slate-600">
            Tus datos profesionales. La especialidad y matrícula las gestiona la administración.
          </p>
        </div>
        <Badge variant="success" dot>
          Médico
        </Badge>
      </header>

      <div className="mt-6">
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <ProfilePhotoCard />

        <Card variant="outlined" padding="lg" className="mt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-sky-900">Datos profesionales</h2>
            {!showBioForm && (
              <button
                type="button"
                onClick={() => setShowBioForm(true)}
                className={buttonClasses({ size: 'sm', variant: 'outline' })}
              >
                Editar presentación
              </button>
            )}
          </div>

          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Nombre</dt>
              <dd className="mt-0.5 text-slate-900">
                {doctorDataSafe.first_name} {doctorDataSafe.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-0.5 text-slate-900">{doctorDataSafe.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Especialidad</dt>
              <dd className="mt-0.5 text-slate-900">{doctorDataSafe.specialty}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Matrícula</dt>
              <dd className="mt-0.5 text-slate-900">{doctorDataSafe.license_number}</dd>
            </div>
            <dt className="text-sm font-medium text-slate-500 sm:col-span-2">Presentación</dt>
            {showBioForm ? (
              <dd className="sm:col-span-2">
                <form onSubmit={handleSubmit(handleBioSubmit)} className="mt-2 space-y-2">
                  <textarea
                    {...register('bio')}
                    rows={4}
                    className={`w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
                      errors.bio
                        ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                        : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
                    }`}
                    placeholder="Contá un poco sobre tu experiencia, formación o enfoque profesional…"
                  />
                  {errors.bio && (
                    <p role="alert" className="text-sm text-red-600">
                      {errors.bio.message}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        reset({ bio: '' })
                        setShowBioForm(false)
                      }}
                      className={buttonClasses({ size: 'sm', variant: 'ghost' })}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={updateBio.isPending}
                      className={buttonClasses({ size: 'sm' })}
                    >
                      {updateBio.isPending ? 'Guardando…' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </dd>
            ) : doctorDataSafe.bio ? (
              <dd className="mt-0.5 text-slate-900 whitespace-pre-wrap sm:col-span-2">{doctorDataSafe.bio}</dd>
            ) : (
              <dd className="mt-0.5 text-slate-400 italic sm:col-span-2">Sin presentación aún.</dd>
            )}
          </dl>

          {saved && (
            <p role="status" className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Guardamos tu presentación.
            </p>
          )}
        </Card>
      </div>
    </div>
  )
}

/** Perfil del admin: solo lectura. */
function AdminProfileView() {
  const { data: admin, isLoading, isError } = useMyAdminProfile()

  if (isLoading) {
    return <p role="status" className="text-slate-500">Cargando tu perfil…</p>
  }

  if (isError) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        No pudimos cargar tu perfil. Recargá la página e intentá de nuevo.
      </p>
    )
  }

  if (!admin) {
    return <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">No pudimos cargar tu perfil.</p>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">Mi perfil</h1>
          <p className="mt-1 text-slate-600">Tus datos de administrador.</p>
        </div>
        <Badge variant="warning" dot>
          Admin
        </Badge>
      </header>

      <div className="mt-6">
        <ProfilePhotoCard />

        <Card variant="outlined" padding="lg" className="mt-4">
          <h2 className="text-lg font-semibold text-sky-900">Datos de administrador</h2>

          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-slate-500">Nombre</dt>
              <dd className="mt-0.5 text-slate-900">
                {admin.first_name} {admin.last_name}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-slate-500">Email</dt>
              <dd className="mt-0.5 text-slate-900">{admin.email}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  )
}

/** Página de perfil unificada para los tres roles. */
export function MyProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return null
  }

  switch (user.role) {
    case 'PATIENT':
      return <PatientProfilePage />
    case 'DOCTOR':
      return <DoctorProfileView />
    case 'ADMIN':
      return <AdminProfileView />
    default:
      return null
  }
}

export { DoctorProfileView as DoctorProfilePage }
export { AdminProfileView as AdminProfilePage }