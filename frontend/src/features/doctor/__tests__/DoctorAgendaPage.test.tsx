import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { format } from 'date-fns'
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
import { buildAgendaWeek } from '../agendaWeek'
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
    doctor_photo: null,
    patient_id: 1,
    patient_name: 'Ana Ruiz',
    patient_photo: null,
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

describe('buildAgendaWeek', () => {
  it('ubica un turno de la madrugada (hora argentina) en el dia correcto', () => {
    // 2030-06-10T01:00Z = 2030-06-09 22:00 en Argentina (domingo).
    const turno = appointment({ starts_at: '2030-06-10T01:00:00.000Z' })

    const { days } = buildAgendaWeek(
      new Date('2030-06-10T01:00:00.000Z'),
      [turno],
    )

    const diaConTurno = days.find(d => d.appointments.length > 0)
    expect(diaConTurno).toBeDefined()
    expect(format(diaConTurno!.date, 'yyyy-MM-dd')).toBe('2030-06-09')
    expect(diaConTurno!.appointments).toHaveLength(1)
  })

  it('arma la semana segun la fecha de la clinica, no la del navegador', () => {
    const { start, end } = buildAgendaWeek(
      new Date('2030-06-10T01:00:00.000Z'),
      [],
    )

    expect(format(start, 'yyyy-MM-dd')).toBe('2030-06-03')
    expect(format(end, 'yyyy-MM-dd')).toBe('2030-06-09')
  })
})
