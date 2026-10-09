import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'

import { Button, TextField } from '../../components/ui'
import { useAuth } from '../../context/useAuth'
import { homeForRole } from '../../routes/roleHome'
import { ApiError } from '../../services/api'
import { changePassword } from './api'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from './passwordSchema'

export function ChangePasswordPage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // La cuenta con clave temporal no puede salir de esta pantalla hasta
  // cambiarla: ocultamos el enlace de salida para no ofrecer algo sin salida.
  const forced = user?.must_change_password ?? false

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword(values.current_password, values.new_password)

      // Actualiza must_change_password para que el guard deje de rebotar.
      await refresh()

      navigate(homeForRole(user?.role), { replace: true })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No pudimos cambiar la contraseña. Intentá de nuevo.'

      setError('current_password', { message })
    }
  })

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-sky-900">
          {forced ? 'Cambiá tu contraseña' : 'Cambiar contraseña'}
        </h1>

        <p className="mt-3 text-slate-600">
          {forced
            ? 'Tu cuenta tiene una contraseña temporal. Elegí una nueva para seguir usando el portal.'
            : 'Ingresá tu contraseña actual y elegí una nueva.'}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
          <TextField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            error={errors.current_password?.message}
            {...register('current_password')}
          />

          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            hint="Al menos 8 caracteres."
            error={errors.new_password?.message}
            {...register('new_password')}
          />

          <TextField
            label="Repetí la nueva contraseña"
            type="password"
            autoComplete="new-password"
            error={errors.confirm_password?.message}
            {...register('confirm_password')}
          />

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Guardar contraseña
          </Button>
        </form>

        {!forced && (
          <p className="mt-6 text-center text-sm text-slate-500">
            <Link
              to={homeForRole(user?.role)}
              className="font-semibold text-sky-600 hover:text-sky-700"
            >
              Volver al portal
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
