import api from './api'

export type Role = 'PATIENT' | 'DOCTOR' | 'ADMIN'

export type Session = {
  id: number
  email: string
  first_name: string
  last_name: string
  role: Role
  is_active: boolean
  must_change_password: boolean
}

export function login(
  email: string,
  password: string,
): Promise<Session> {
  return api.post<Session>('/auth/login', { email, password })
}

export function fetchCurrentUser(): Promise<Session> {
  return api.get<Session>('/auth/me')
}

export function logout(): Promise<void> {
  return api.post<void>('/auth/logout')
}