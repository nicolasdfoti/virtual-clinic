import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

// jsdom no implementa scrollTo y varios componentes lo llaman en mount.
window.scrollTo = vi.fn()

// Shim de entorno, no de la app.
//
// El problema: jsdom define su propia clase AbortSignal, pero `Request` sigue
// siendo el de undici (node), que al recibir un signal de otra realm lanza
// "Expected signal to be an instance of AbortSignal". React Router 7 construye
// un `new Request(url, { signal })` en cada `navigate()`, asi que cualquier test
// que navegue revienta.
//
// La app nunca usa `Request` (toda su I/O pasa por el wrapper de api.ts), asi
// que se reemplaza por una version minima que conserva url/init para que
// react-router pueda leerlos.
class MinimalRequest {
  url: string
  method: string
  signal: AbortSignal | null
  headers: Headers

  constructor(input: string | { url: string }, init: RequestInit = {}) {
    this.url = typeof input === 'string' ? input : input.url
    this.method = init.method ?? 'GET'
    this.signal = init.signal ?? null
    this.headers = new Headers(init.headers)
  }
}

globalThis.Request = MinimalRequest as unknown as typeof Request