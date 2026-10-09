const API_URL =
  import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'

/** URL absoluta de un endpoint de la API. Para enlaces directos que no pasan
 *  por `fetch` (por ejemplo las descargas de PDF, que viajan con la cookie de
 *  sesion y no con JSON). */
export function apiFileUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`
}

const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error en la solicitud.'

const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.'

// Endpoints donde un 401 es parte del flujo normal: /auth/me es el bootstrap de
// sesion (401 = todavia no hay sesion, no "se vencio") y /auth/login muestra el
// error en el formulario. Si dispararan el manejador global, el arranque
// anonimo redirigiria al login en loop y las credenciales invalidas perderian
// su mensaje.
const SESSION_ENDPOINTS = ['/auth/me', '/auth/login']

export class ApiError extends Error {
  status: number
  data: unknown
  /** Codigo de negocio opcional del backend (ej. PASSWORD_CHANGE_REQUIRED). */
  code?: string

  constructor(
    message: string,
    status: number,
    data: unknown,
    code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
  }
}

/** Respuesta paginada convenida con el backend. */
export type Paginated<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
}

export type PageParams = {
  limit?: number
  offset?: number
}

/** Arma el query string de paginacion para pegarle a un listado. */
export function toPageQuery(params: PageParams = {}): string {
  const search = new URLSearchParams()

  if (params.limit !== undefined) {
    search.set('limit', String(params.limit))
  }

  if (params.offset !== undefined) {
    search.set('offset', String(params.offset))
  }

  const query = search.toString()

  return query ? `?${query}` : ''
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/** Registra quien reacciona a un 401 global. La app lo usa para limpiar la
 *  sesion y mandar al login; los tests que no lo registran no navegan solos. */
export function setUnauthorizedHandler(
  handler: UnauthorizedHandler | null,
): void {
  unauthorizedHandler = handler
}

function isSessionEndpoint(endpoint: string): boolean {
  return SESSION_ENDPOINTS.some((prefix) => endpoint.startsWith(prefix))
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

  if (!data || typeof data !== 'object') {
    return ''
  }

  // Formato nuevo: { code, message }. Si no hay message, cae al detail clasico.
  const record = data as { detail?: unknown; message?: unknown }

  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message
  }

  if (!('detail' in data)) {
    return ''
  }

  return readDetail(record.detail)
}

function readCode(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const code = (value as { code?: unknown }).code

  return typeof code === 'string' ? code : undefined
}

function extractErrorCode(data: unknown): string | undefined {
  const direct = readCode(data)

  if (direct) {
    return direct
  }

  if (!data || typeof data !== 'object') {
    return undefined
  }

  // El code puede venir anidado dentro de detail ({ detail: { code } }).
  return readCode((data as { detail?: unknown }).detail)
}

function serializeBody(body: unknown): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined
  }

  // FormData se manda tal cual: el navegador agrega el Content-Type multipart
  // con su boundary. Serializarlo a JSON rompe la subida de archivos.
  if (body instanceof FormData) {
    return body
  }

  return JSON.stringify(body)
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers)

  if (!(options?.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

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

  // 401 global: la sesion se cayo a mitad de uso. Los endpoints de sesion
  // quedan afuera para no redirigir durante el arranque ni en el login.
  if (response.status === 401 && !isSessionEndpoint(endpoint)) {
    unauthorizedHandler?.()
  }

  if (!response.ok) {
    throw new ApiError(
      extractErrorMessage(data) || DEFAULT_ERROR_MESSAGE,
      response.status,
      data,
      extractErrorCode(data),
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
      body: serializeBody(body),
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PUT',
      body: serializeBody(body),
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: 'PATCH',
      body: serializeBody(body),
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, {
      method: 'DELETE',
    }),
}

export default api
