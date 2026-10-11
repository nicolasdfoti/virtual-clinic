import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  ADMIN,
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
  type FetchRoute,
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
    photo: null,
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

function baseRoutes(patient: DoctorPatientDetail | { detail: string }) {
  const notFound = 'detail' in patient

  return [
    {
      test: (url: string) => url.endsWith('/doctor/patients/5'),
      respond: () =>
        notFound
          ? jsonResponse(patient, { status: 404 })
          : jsonResponse(patient),
    },
    {
      test: (url: string) => url.endsWith('/doctor/patients/5/prescriptions'),
      respond: () => jsonResponse([]),
    },
    {
      test: (url: string) => url.endsWith('/doctor/patients/5/orders'),
      respond: () => jsonResponse([]),
    },
    {
      test: (url: string) => url.endsWith('/doctor/patients/5/appointments'),
      respond: () => jsonResponse([]),
    },
  ]
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/medico/pacientes/5']}>
          <Routes>
            <Route
              path="/app/medico/pacientes/:patientId"
              element={<DoctorPatientDetailPage />}
            />
          </Routes>
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

describe('DoctorPatientDetailPage', () => {
  it('muestra el perfil en solo lectura', async () => {
    mockFetchRoutes(baseRoutes(detail()))

    renderPage()

    expect(await screen.findByText('Sofía Ledesma')).toBeInTheDocument()
    expect(screen.getByText('31222333')).toBeInTheDocument()
    expect(screen.getByText('Swiss Medical')).toBeInTheDocument()
  })

  it('marca el perfil incompleto', async () => {
    mockFetchRoutes(baseRoutes(detail({ is_complete: false, phone: null })))

    renderPage()

    expect(await screen.findByText('Perfil incompleto')).toBeInTheDocument()
  })

  it('muestra el estado vacío de recetas y abre el formulario', async () => {
    const user = userEvent.setup()

    mockFetchRoutes(baseRoutes(detail()))

    renderPage()

    await screen.findByText('Sofía Ledesma')

    await user.click(screen.getByRole('tab', { name: 'Recetas' }))

    expect(
      await screen.findByText('No hay recetas emitidas para este paciente.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Nueva receta' }))

    expect(screen.getByLabelText('Medicamento')).toBeInTheDocument()
    expect(screen.getByLabelText('Dosis (ej. 500 mg)')).toBeInTheDocument()
  })

  it('trae los turnos del paciente desde el endpoint por paciente', async () => {
    const user = userEvent.setup()
    const fetchMock = mockFetchRoutes([
      {
        test: (url: string) => url.endsWith('/doctor/patients/5/appointments'),
        respond: () =>
          jsonResponse([
            {
              id: 77,
              patient_id: 5,
              patient_name: 'Sofía Ledesma',
              patient_dni: '31222333',
              starts_at: '2030-06-15T13:00:00Z',
              ends_at: '2030-06-15T13:30:00Z',
              status: 'SCHEDULED',
              modality: 'VIDEO',
              reason: null,
              video_url: null,
              cancelled_by: null,
              cancel_reason: null,
              created_at: '2026-01-01T00:00:00Z',
            },
          ]),
      },
      ...baseRoutes(detail()),
    ])

    renderPage()

    await screen.findByText('Sofía Ledesma')
    await user.click(screen.getByRole('tab', { name: 'Turnos' }))

    expect(await screen.findByText('Videollamada — SCHEDULED')).toBeInTheDocument()

    const calledUrls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(
      calledUrls.some((url) => url.endsWith('/doctor/patients/5/appointments')),
    ).toBe(true)
    expect(calledUrls.some((url) => url.endsWith('/appointments/mine'))).toBe(false)
  })

  it('avisa cuando el paciente no está entre los atendidos', async () => {
    mockFetchRoutes(baseRoutes({ detail: 'No encontramos ese paciente.' }))

    renderPage()

    expect(
      await screen.findByText(
        'No encontramos ese paciente entre los que atendés.',
      ),
    ).toBeInTheDocument()
  })

  it('muestra un mensaje amable si la cuenta no tiene perfil de médico', async () => {
    mockFetchRoutes([
      authRoute(),
      {
        test: (url: string) => url.endsWith('/doctor/patients/5'),
        respond: () =>
          jsonResponse(
            { detail: 'Tu perfil de médico no está activo.' },
            { status: 403 },
          ),
      },
      {
        test: (url: string) => url.endsWith('/doctor/patients/5/prescriptions'),
        respond: () => jsonResponse([], { status: 403 }),
      },
      {
        test: (url: string) => url.endsWith('/doctor/patients/5/orders'),
        respond: () => jsonResponse([], { status: 403 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('No tenés un perfil de médico activo'),
    ).toBeInTheDocument()
  })
})
