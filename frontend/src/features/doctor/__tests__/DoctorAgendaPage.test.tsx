import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  ADMIN,
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { DoctorAgendaPage } from '../DoctorAgendaPage'
import type { DoctorAppointment } from '../types'

afterEach(() => {
  vi.restoreAllMocks()
})

function appointment(
  overrides: Partial<DoctorAppointment> = {},
): DoctorAppointment {
  const now = Date.now()
  return {
    id: 1,
    doctor_id: 2,
    doctor_name: 'Gonzalo',
    patient_id: 1,
    patient_name: 'Ana Ruiz',
    patient_dni: '12345678',
    starts_at: new Date(now).toISOString(),
    ends_at: new Date(now + 2 * 60 * 60 * 1000).toISOString(),
    status: 'SCHEDULED',
    reason: null,
    modality: 'VIDEO',
    video_url: null,
    cancelled_by: null,
    cancel_reason: null,
    created_at: new Date(now).toISOString(),
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/medico/agenda']}>
          <Routes>
            <Route path="/app/medico/agenda" element={<DoctorAgendaPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('DoctorAgendaPage', () => {
  it('envía el motivo al cancelar un turno', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'prompt').mockReturnValue('Motivo de prueba')

    const fetchMock = mockFetchRoutes([
      {
        test: (url) => url.endsWith('/auth/me'),
        respond: () => jsonResponse(ADMIN),
      },
      {
        test: (url) => url.endsWith('/appointments/mine'),
        respond: () => jsonResponse([appointment()]),
      },
      {
        test: (url, method) =>
          url.endsWith('/appointments/1/cancel') && method === 'PATCH',
        respond: () => jsonResponse({ id: 1, status: 'CANCELLED' }),
      },
    ])

    renderPage()

    await screen.findByText('Ana Ruiz')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => {
      const cancelCall = fetchMock.mock.calls.find(
        ([, init]) => init?.method === 'PATCH',
      )

      expect(cancelCall).toBeTruthy()
      expect(JSON.parse(String(cancelCall?.[1]?.body))).toEqual({
        reason: 'Motivo de prueba',
      })
    })
  })
})
