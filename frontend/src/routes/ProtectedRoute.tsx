import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { homeForRole } from '../routes/roleHome'
import type { Role } from '../services/auth'

type ProtectedRouteProps = {
  /** Si se define, solo ese rol entra. Si se omite, alcanza con tener sesion. */
  allowedRoles?: Role[]
}

/** Pantalla obligatoria cuando la cuenta tiene una clave temporal. */
export const CHANGE_PASSWORD_PATH = '/app/cambiar-contrasena'

/** Guarda de rutas privadas.
 *
 *  Mientras se revalida la cookie contra /auth/me no se decide nada: redirigir
 *  en ese instante mandaria al usuario al login aunque tenga sesion valida y
 *  provocaria un rebote visible al recargar.
 *
 *  El `state.from` es lo que permite volver a la ruta que el usuario intentar
 *  abrir antes de que se lo mandaran al login.
 */
export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center text-slate-500"
        role="status"
      >
        Cargando…
      </div>
    )
  }

  if (status === 'anonymous' || user === null) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  // Cuenta con clave temporal: no puede usar ninguna otra ruta del portal
  // hasta cambiarla (se completa en la Fase 4).
  if (
    user.must_change_password &&
    location.pathname !== CHANGE_PASSWORD_PATH
  ) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const home = homeForRole(user.role)

    // Si el home del rol ya es esta misma ruta, redirigir ahi seria un loop
    // infinito de navegacion. En ese caso no hay ninguna pagina que mostrar:
    // el rol simplemente no tiene acceso a este area.
    if (home === location.pathname) {
      return (
        <div
          className="mx-auto max-w-md px-4 py-24 text-center"
          role="alert"
        >
          <h1 className="text-2xl font-bold text-sky-900">
            No tenés acceso a esta sección
          </h1>
          <p className="mt-2 text-slate-600">
            Si creés que es un error, contactanos y lo revisamos.
          </p>
        </div>
      )
    }

    return <Navigate to={home} replace />
  }

  return <Outlet />
}