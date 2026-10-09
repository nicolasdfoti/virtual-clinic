import { useAuth } from '../../context/useAuth'

/** Pantalla obligatoria para cuentas con clave temporal.
 *
 *  Version minima: por ahora solo explica la situacion y deja cerrar sesion
 *  desde el menu de cuenta. El formulario real se completa en la Fase 4,
 *  cuando exista el endpoint de cambio de contraseña. */
export function ChangePassword() {
  const { user } = useAuth()

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-sky-900">
          Cambiá tu contraseña
        </h1>

        <p className="mt-3 text-slate-600">
          {user?.first_name ? `${user.first_name}, ` : ''}
          tu cuenta tiene una contraseña temporal. Para seguir usando el portal
          tenés que elegir una nueva.
        </p>

        <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          El formulario de cambio de contraseña va a estar disponible
          próximamente.
        </p>
      </div>
    </div>
  )
}
