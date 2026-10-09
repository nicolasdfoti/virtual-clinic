import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { DoctorDashboard } from '../DoctorDashboard'
import type { DoctorPatient } from '../types'

function patient(overrides: Partial<DoctorPatient> = {}): DoctorPatient {
  return {
    id: 1,
    first_name: 'Ana',
    last_name: 'Ruiz',
    dni: '12345678',
    insurance_provider: 'OSDE',
    next_appointment: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <DoctorDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function patientsRoute(patients: DoctorPatient[]) {
  return {
    test: (url: string) => url.includes('/doctor/patients') && !url.includes('/999'),
    respond: (url: string) => {
      const parsed = new URL(url)
      const q = parsed.searchParams.get('q')?.toLowerCase() ?? ''

      const filtered = q
        ? patients.filter((item) =>
            `${item.first_name} ${item.last_name} ${item.dni}`
              .toLowerCase()
              .includes(q),
          )
        : patients

      return jsonResponse({
        items: filtered,
        total: filtered.length,
        limit: 20,
        offset: 0,
      })
    },
  }
}

describe('DoctorDashboard', () => {
  it('lista los pacientes vinculados', async () => {
    mockFetchRoutes([patientsRoute([patient()])])

    renderPage()

    expect(await screen.findByText('Ruiz, Ana')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('OSDE')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay pacientes', async () => {
    mockFetchRoutes([patientsRoute([])])

    renderPage()

    expect(
      await screen.findByText('Todavía no tenés pacientes vinculados.'),
    ).toBeInTheDocument()
  })

  it('busca por nombre o DNI', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      patientsRoute([
        patient({ id: 1, first_name: 'Ana', last_name: 'Ruiz' }),
        patient({
          id: 2,
          first_name: 'Bruno',
          last_name: 'Pérez',
          dni: '99999999',
        }),
      ]),
    ])

    renderPage()

    await screen.findByText('Ruiz, Ana')

    await user.type(screen.getByLabelText('Buscar'), 'Bruno')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Pérez, Bruno')).toBeInTheDocument()
    expect(screen.queryByText('Ruiz, Ana')).not.toBeInTheDocument()
  })

  it('vincula un paciente existente desde el modal', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      {
        test: (url, method) =>
          url.includes('/doctor/patients') && method === 'POST',
        respond: () =>
          jsonResponse(
            patient({ id: 7, first_name: 'Carla', last_name: 'Gómez' }),
            { status: 201 },
          ),
      },
      patientsRoute([patient({ id: 1, first_name: 'Ana', last_name: 'Ruiz' })]),
    ])

    renderPage()

    await screen.findByText('Ruiz, Ana')

    await user.click(
      screen.getByRole('button', { name: 'Vincular paciente' }),
    )
    await user.type(screen.getByLabelText('DNI'), '30111222')
    await user.click(screen.getByRole('button', { name: 'Vincular' }))

    expect(
      await screen.findByText('Carla Gómez quedó vinculado a tu perfil.'),
    ).toBeInTheDocument()
  })
})
