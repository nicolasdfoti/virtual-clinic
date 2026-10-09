import { QueryClient } from '@tanstack/react-query'
import { vi } from 'vitest'

import type { PatientProfile } from '../features/patient/types'
import type { Session } from '../services/auth'

/** QueryClient aislado por test: sin reintentos y sin cache compartida. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

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

export type FetchRoute = {
  test: (url: string, method: string) => boolean
  respond: (
    url: string,
    method: string,
    init?: RequestInit,
  ) => Response | Promise<Response>
}

/** Instala un fetch falso que resuelve por la primera ruta que matchea.
 *  Util para endpoints con estado (admin) donde mockApi queda corto. */
export function mockFetchRoutes(routes: FetchRoute[]) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input)
      const method = init?.method ?? 'GET'

      for (const route of routes) {
        if (route.test(url, method)) {
          return route.respond(url, method, init)
        }
      }

      return jsonResponse({ detail: 'Not found' }, { status: 404 })
    },
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}

export function emptyPatientProfile(userId: number): PatientProfile {
  return {
    id: null,
    user_id: userId,
    dni: null,
    birth_date: null,
    sex: null,
    phone: null,
    address: null,
    city: null,
    insurance_provider: null,
    insurance_plan: null,
    insurance_member_number: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    is_complete: false,
    created_at: null,
    updated_at: null,
  }
}

export function completePatientProfile(userId: number): PatientProfile {
  return {
    id: 10,
    user_id: userId,
    dni: '12345678',
    birth_date: '1990-05-20',
    sex: 'Femenino',
    phone: '11 5555-5555',
    address: 'Calle 123',
    city: 'CABA',
    insurance_provider: 'OSDE',
    insurance_plan: '210',
    insurance_member_number: '123456',
    emergency_contact_name: 'Juan Pérez',
    emergency_contact_phone: '11 4444-4444',
    is_complete: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }
}

type MockApiOptions = {
  /** Perfil que devuelve GET /patients/me/profile. Por defecto, uno vacio. */
  profile?: PatientProfile | null
  /** Si se define, PATCH /auth/password responde 400 con este mensaje. */
  passwordError?: string
}

/** Instala un fetch falso que responde segun el endpoint.
 *
 *  Si no se pasa session, /auth/me responde 401: es el estado por defecto de
 *  "no hay sesion", y los tests de ProtectedRoute no tienen que mockearlo.
 */
export function mockApi(
  session: Session | null = null,
  options: MockApiOptions = {},
) {
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : String(input)
      const method = init?.method ?? 'GET'

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
          return jsonResponse(
            { detail: 'Sesión inválida o expirada.' },
            { status: 401 },
          )
        }

        return jsonResponse(session)
      }

      if (url.endsWith('/auth/logout')) {
        return new Response(null, { status: 204 })
      }

      if (url.endsWith('/auth/password')) {
        if (!session) {
          return jsonResponse({ detail: 'No autorizado.' }, { status: 401 })
        }

        if (options.passwordError) {
          return jsonResponse({ detail: options.passwordError }, { status: 400 })
        }

        return new Response(null, { status: 204 })
      }

      if (url.endsWith('/public/doctors')) {
        return jsonResponse([])
      }

      if (url.endsWith('/patients/me/profile')) {
        if (!session) {
          return jsonResponse({ detail: 'No autorizado.' }, { status: 401 })
        }

        if (method === 'PUT') {
          const body = init?.body
            ? (JSON.parse(String(init.body)) as Partial<PatientProfile>)
            : {}

          const base = options.profile ?? emptyPatientProfile(session.id)

          const merged = { ...base, ...body, id: base.id ?? 10 }

          const is_complete = Boolean(
            merged.dni &&
              merged.birth_date &&
              merged.insurance_provider &&
              merged.phone,
          )

          return jsonResponse({ ...merged, is_complete })
        }

        return jsonResponse(options.profile ?? emptyPatientProfile(session.id))
      }

      return jsonResponse({ detail: 'Not found' }, { status: 404 })
    },
  )

  vi.stubGlobal('fetch', fetchMock)

  return fetchMock
}