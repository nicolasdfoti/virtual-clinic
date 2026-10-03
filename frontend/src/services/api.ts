const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error en la solicitud.'

const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text()

  if (!text) {
    return undefined
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return text
  }
}

function readDetail(detail: unknown): string {
  if (typeof detail === 'string' && detail.trim()) {
    return detail
  }

  if (!Array.isArray(detail)) {
    return ''
  }

  const messages = detail
    .map((item) => {
      if (typeof item === 'string') {
        return item
      }

      if (!item || typeof item !== 'object') {
        return ''
      }

      const { msg, loc } = item as { msg?: unknown; loc?: unknown }

      if (typeof msg !== 'string' || !msg) {
        return ''
      }

      const field = Array.isArray(loc) ? loc[loc.length - 1] : undefined

      return typeof field === 'string' ? `${field}: ${msg}` : msg
    })
    .filter(Boolean)

  return messages.join(' · ')
}

function extractErrorMessage(data: unknown): string {
  if (typeof data === 'string' && data.trim()) {
    return data
  }

  if (!data || typeof data !== 'object' || !('detail' in data)) {
    return ''
  }

  return readDetail((data as { detail: unknown }).detail)
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers)

  headers.set('Content-Type', 'application/json')

  let response: Response

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
      // La sesion viaja en una cookie httpOnly: sin credentials:'include' el
      // navegador no la manda y /auth/me responderia 401 siempre.
      credentials: 'include',
    })
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0, undefined)
  }

  const data = await readBody(response)

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data) || DEFAULT_ERROR_MESSAGE,
      response.status,
      data,
    )
  }

  return data as T
}

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint),

  // El body es opcional porque hay endpoints 204 (logout) que no mandan nada.
  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),
}

export default api