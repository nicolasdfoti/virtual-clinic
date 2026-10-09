import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { setUnauthorizedHandler } from '../services/api'

/** Escucha el 401 global del cliente HTTP.
 *
 *  Cuando una request cualquiera (no /auth/me ni /auth/login) responde 401, la
 *  sesion ya no sirve: se limpia el estado local y se manda al login guardando
 *  `state.from` para poder volver. Es un componente dentro del router porque
 *  necesita navegar; el AuthProvider, en cambio, es agnostico del router.
 */
export function UnauthorizedRedirect() {
  const { clearSession } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession()

      if (!location.pathname.startsWith('/login')) {
        navigate('/login', {
          replace: true,
          state: { from: location.pathname },
        })
      }
    })

    return () => setUnauthorizedHandler(null)
  }, [clearSession, navigate, location.pathname])

  return null
}
