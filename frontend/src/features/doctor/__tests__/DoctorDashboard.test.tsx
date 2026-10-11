import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  ADMIN,
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
  type FetchRoute,
} from '../../../test/testUtils'
import { DoctorDashboard } from '../DoctorDashboard'
import type { DoctorAppointment } from '../types'

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
    patient_name: 'Bruno Pérez',
    patient_photo: null,
    patient_dni: '99999999',
    starts_at: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(now + 7 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
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
        <MemoryRouter>
          <DoctorDashboard />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

function authRoute(session = ADMIN): FetchRoute {
  return {
    test: (url) => url.endsWith('/auth/me'),
    respond: () => jsonResponse(session),
  }
}

function patientsRoute(total: number): FetchRoute {
  return {
    test: (url: string) =>
      url.includes('/doctor/patients') && !url.endsWith('/999'),
    respond: () =>
      jsonResponse({ items: [], total, limit: 1, offset: 0 }),
  }
}

function appointmentsRoute(appointments: DoctorAppointment[]): FetchRoute {
  return {
    test: (url: string) => url.endsWith('/appointments/mine'),
    respond: () => jsonResponse(appointments),
  }
}

describe('DoctorDashboard', () => {
  it('muestra un mensaje amable si la cuenta no tiene perfil de médico', async () => {
    mockFetchRoutes([
      authRoute(),
      {
        test: (url: string) => url.includes('/doctor/patients'),
        respond: () =>
          jsonResponse(
            { detail: 'Tu perfil de médico no está activo.' },
            { status: 403 },
          ),
      },
      {
        test: (url: string) => url.endsWith('/appointments/mine'),
        respond: () => jsonResponse([], { status: 403 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('No tenés un perfil de médico activo'),
    ).toBeInTheDocument()
  })

  it('muestra el resumen y los accesos rápidos', async () => {
    mockFetchRoutes([
      patientsRoute(3),
      appointmentsRoute([appointment()]),
    ])

    renderPage()

    expect(await screen.findByText('Pacientes vinculados')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(await screen.findByText('Bruno Pérez')).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Ver pacientes' }),
    ).toHaveAttribute('href', '/app/medico/pacientes')
    expect(
      screen.getAllByRole('link', { name: 'Ver agenda' }).length,
    ).toBeGreaterThan(0)
  })

  it('muestra el estado vacío cuando no hay turnos próximos', async () => {
    mockFetchRoutes([patientsRoute(0), appointmentsRoute([])])

    renderPage()

    expect(
      await screen.findByText('No tenés turnos próximos.'),
    ).toBeInTheDocument()
  })
})
