import { vi } from 'vitest'

import type { Session } from '../services/auth'

export const PATIENT: Session = {
  id: 1,
  email: 'ana@example.com',
  first_name: 'Ana',
  last_name: 'Ruiz',
  role: 'PATIENT',
  is_active: true,
  must_change_password: false,
}

export const DOCTOR: Session = {
  ...PATIENT,
  id: 2,
  email: 'medico@example.com',
  first_name: 'Gonzalo',
  role: 'DOCTOR',
}

export const ADMIN: Session = {
  ...PATIENT,
  id: 3,
  email: 'admin@example.com',
  first_name: 'Alicia',
  role: 'ADMIN',
}

export function jsonResponse(
  body: unknown,
  init: { status?: number } = {},
): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Instala un fetch falso que responde segun el endpoint.
 *
 *  Si no se pasa session, /auth/me responde 401: es el estado por defecto de
 *  "no hay sesion", y los tests de ProtectedRoute no tienen que mockearlo.
 */
export function mockApi(session: Session | null = null) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : String(input)

    if (url.endsWith('/auth/login')) {
      if (!session) {
        return jsonResponse(
          { detail: 'Credenciales inválidas.' },
          { status: 401 },
        )
      }

      return jsonResponse(session)
    }

    if (url.endsWith('/auth/me')) {
      if (!session) {
        return jsonResponse({ detail: 'Sesión inválida o expirada.' }, { status: 401 })
      }

      return jsonResponse(session)
    }

    if (url.endsWith('/auth/logout')) {
      return new Response(null, { status: 204 })
    }

    return jsonResponse({ detail: 'Not found' }, { status: 404 })
  })

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}