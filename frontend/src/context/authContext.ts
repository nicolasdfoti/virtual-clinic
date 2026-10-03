import { createContext } from 'react'

import type { Session } from '../services/auth'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export type AuthContextValue = {
  user: Session | null
  status: AuthStatus
  login: (email: string, password: string) => Promise<Session>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)