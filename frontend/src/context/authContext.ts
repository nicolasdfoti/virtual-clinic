import { createContext } from 'react'

import type { Session } from '../services/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: Session | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<Session>
  logout: () => Promise<void>
  /** Limpia la sesion local sin pegarle al backend. La usa el 401 global. */
  clearSession: () => void
  /** Revalida /auth/me y actualiza la sesion local (ej. tras cambiar la
   *  contraseña, para reflejar `must_change_password`). */
  refresh: () => Promise<Session>
}

export const AuthContext = createContext<AuthContextValue | null>(null)