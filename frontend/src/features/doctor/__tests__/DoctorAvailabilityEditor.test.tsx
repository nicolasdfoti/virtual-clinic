import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { DoctorAvailabilityEditor } from '../DoctorAvailabilityEditor'

const AVAILABILITY = {
  id: 1,
  doctor_id: 10,
  weekday: 0,
  start_time: '08:00:00',
  end_time: '12:00:00',
}

const TIME_OFF = {
  id: 5,
  doctor_id: 10,
  starts_at: '2030-06-15T09:00:00Z',
  ends_at: '2030-06-15T12:00:00Z',
  reason: 'Congreso',
  created_at: '2026-01-01T00:00:00Z',
}

function renderEditor() {
  const fetchMock = mockFetchRoutes([
    {
      test: (url, method) => url.endsWith('/doctor/availability') && method === 'GET',
      respond: () => jsonResponse([AVAILABILITY]),
    },
    {
      test: (url, method) => url.endsWith('/doctor/time-off') && method === 'GET',
      respond: () => jsonResponse([TIME_OFF]),
    },
    {
      test: (url, method) => url.includes('/doctor/availability/') && method === 'DELETE',
      respond: () => new Response(null, { status: 204 }),
    },
    {
      test: (url, method) => url.includes('/doctor/availability/') && method === 'PUT',
      respond: () => jsonResponse({ ...AVAILABILITY, start_time: '09:00:00' }),
    },
  ])

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <DoctorAvailabilityEditor />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return fetchMock
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('DoctorAvailabilityEditor', () => {
  it('muestra los bloqueos en hora de Buenos Aires', async () => {
    renderEditor()

    expect(
      await screen.findByText('15/06/2030 06:00 – 15/06/2030 09:00'),
    ).toBeInTheDocument()
    expect(screen.getByText('Congreso')).toBeInTheDocument()
  })

  it('elimina una franja de disponibilidad', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const fetchMock = renderEditor()
    const user = userEvent.setup()

    const deleteButtons = await screen.findAllByRole('button', { name: 'Eliminar' })
    await user.click(deleteButtons[0])

    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'DELETE',
      )
      expect(deleteCall?.[0]).toContain('/doctor/availability/1')
    })
  })

  it('actualiza una franja de disponibilidad', async () => {
    const fetchMock = renderEditor()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    await waitFor(() => {
      const putCall = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'PUT',
      )
      expect(putCall?.[0]).toContain('/doctor/availability/1')
    })
  })
})
