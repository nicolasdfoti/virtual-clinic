import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { DoctorPatientDetailPage } from '../DoctorPatientDetailPage'
import type { DoctorPatientDetail } from '../types'

function detail(
  overrides: Partial<DoctorPatientDetail> = {},
): DoctorPatientDetail {
  return {
    id: 5,
    first_name: 'Sofía',
    last_name: 'Ledesma',
    email: 'sofia@example.com',
    dni: '31222333',
    birth_date: '1990-05-20',
    sex: null,
    phone: '1145550000',
    address: null,
    city: null,
    insurance_provider: 'Swiss Medical',
    insurance_plan: null,
    insurance_member_number: null,
    emergency_contact_name: null,
    emergency_contact_phone: null,
    is_complete: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={['/app/medico/pacientes/5']}>
        <Routes>
          <Route
            path="/app/medico/pacientes/:patientId"
            element={<DoctorPatientDetailPage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('DoctorPatientDetailPage', () => {
  it('muestra el perfil en solo lectura', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/doctor/patients/5'),
        respond: () => jsonResponse(detail()),
      },
    ])

    renderPage()

    expect(await screen.findByText('Sofía Ledesma')).toBeInTheDocument()
    expect(screen.getByText('31222333')).toBeInTheDocument()
    expect(screen.getByText('Swiss Medical')).toBeInTheDocument()
  })

  it('marca el perfil incompleto', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/doctor/patients/5'),
        respond: () =>
          jsonResponse(detail({ is_complete: false, phone: null })),
      },
    ])

    renderPage()

    expect(await screen.findByText('Perfil incompleto')).toBeInTheDocument()
  })

  it('cambia de pestaña y muestra el aviso de próximamente', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      {
        test: (url) => url.includes('/doctor/patients/5'),
        respond: () => jsonResponse(detail()),
      },
    ])

    renderPage()

    await screen.findByText('Sofía Ledesma')

    await user.click(screen.getByRole('tab', { name: 'Recetas' }))

    expect(
      screen.getByText('La sección Recetas va a estar disponible próximamente.'),
    ).toBeInTheDocument()
  })

  it('avisa cuando el paciente no está entre los atendidos', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/doctor/patients/5'),
        respond: () =>
          jsonResponse({ detail: 'No encontramos ese paciente.' }, { status: 404 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText(
        'No encontramos ese paciente entre los que atendés.',
      ),
    ).toBeInTheDocument()
  })
})
