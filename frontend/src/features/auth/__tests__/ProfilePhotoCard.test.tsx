import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import type { Session } from '../../../services/auth'
import {
  PATIENT,
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
  type FetchRoute,
} from '../../../test/testUtils'
import { ProfilePhotoCard } from '../ProfilePhotoCard'

vi.mock('../../../lib/image', () => ({
  resizeImageToDataUrl: vi.fn(async () => 'data:image/jpeg;base64,AAAA'),
}))

afterEach(() => {
  vi.unstubAllGlobals()
})

function routes(session: Session): FetchRoute[] {
  return [
    {
      test: (url) => url.endsWith('/auth/me'),
      respond: () => jsonResponse(session),
    },
    {
      test: (url) => url.endsWith('/profiles/me/photo'),
      respond: (_url, _method, init) =>
        jsonResponse(JSON.parse(String(init?.body))),
    },
  ]
}

function renderCard(session: Session = PATIENT) {
  const fetchMock = mockFetchRoutes(routes(session))

  const view = render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <ProfilePhotoCard />
      </AuthProvider>
    </QueryClientProvider>,
  )

  return { fetchMock, ...view }
}

function findPhotoCall(fetchMock: ReturnType<typeof mockFetchRoutes>) {
  return fetchMock.mock.calls.find(([input]) =>
    String(input).endsWith('/profiles/me/photo'),
  )
}

describe('ProfilePhotoCard', () => {
  it('muestra "Subir foto" cuando el usuario no tiene foto', async () => {
    renderCard()

    expect(
      await screen.findByRole('button', { name: 'Subir foto' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Quitar foto' }),
    ).not.toBeInTheDocument()
  })

  it('sube la foto redimensionada al seleccionar un archivo', async () => {
    const { fetchMock, container } = renderCard()

    const input = await waitFor(() => {
      const element = container.querySelector('input[type="file"]')
      expect(element).not.toBeNull()
      return element as HTMLInputElement
    })

    const file = new File(['x'], 'foto.png', { type: 'image/png' })
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      const call = findPhotoCall(fetchMock)
      expect(call).toBeDefined()
      expect(call?.[1]?.method).toBe('PUT')
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({
        photo: 'data:image/jpeg;base64,AAAA',
      })
    })
  })

  it('permite quitar la foto existente', async () => {
    const session: Session = { ...PATIENT, photo: 'data:image/png;base64,BBBB' }
    const { fetchMock } = renderCard(session)

    const removeButton = await screen.findByRole('button', {
      name: 'Quitar foto',
    })
    fireEvent.click(removeButton)

    await waitFor(() => {
      const call = findPhotoCall(fetchMock)
      expect(call).toBeDefined()
      expect(call?.[1]?.method).toBe('PUT')
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({ photo: null })
    })
  })
})
