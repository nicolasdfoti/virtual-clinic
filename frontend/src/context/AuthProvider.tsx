import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import type { AuthContextValue, AuthStatus } from './authContext'
import { AuthContext } from './authContext'
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  type Session,
} from '../services/auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // Al recargar la pagina el cookie httpOnly sigue ahi, asi que se revalida
  // contra /auth/me para saber si hay sesion. Los setState van dentro de los
  // callbacks de la promesa, nunca en el cuerpo del effect: setState sincrono
  // dentro de un effect rompe la regla react-hooks/set-state-in-effect y
  // ademas causa un render de mas.
  useEffect(() => {
    let cancelled = false

    fetchCurrentUser()
      .then((session) => {
        if (!cancelled) {
          setUser(session)
          setStatus('authenticated')
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null)
          setStatus('anonymous')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setStatus('anonymous')
  }, [])

  const refresh = useCallback(async () => {
    const session = await fetchCurrentUser()

    setUser(session)
    setStatus('authenticated')

    return session
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password)

    setUser(session)
    setStatus('authenticated')

    return session
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutRequest()
    } finally {
      // Aunque el backend falle, el cliente queda deslogueado: el estado local
      // es la fuente de verdad para la UI.
      clearSession()
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, login, logout, clearSession, refresh }),
    [user, status, login, logout, clearSession, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}