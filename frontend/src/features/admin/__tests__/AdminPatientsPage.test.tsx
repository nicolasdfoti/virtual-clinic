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
import type { AdminPatient } from '../types'
import { AdminPatientsPage } from '../AdminPatientsPage'

function patient(overrides: Partial<AdminPatient>): AdminPatient {
  return {
    id: 1,
    first_name: 'Ana',
    last_name: 'Activa',
    email: 'ana@example.com',
    dni: '12345678',
    insurance_provider: 'OSDE',
    is_active: true,
    created_at: '2026-01-15T12:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminPatientsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function patientsRoute(patients: AdminPatient[]): {
  test: (url: string) => boolean
  respond: (url: string) => Response
} {
  return {
    test: (url) => url.includes('/admin/patients'),
    respond: (url) => {
      const parsed = new URL(url)
      const is_active = parsed.searchParams.get('is_active')
      const offset = Number(parsed.searchParams.get('offset') ?? 0)

      const filtered =
        is_active === null
          ? patients
          : patients.filter(
              (item) => String(item.is_active) === is_active,
            )

      return jsonResponse({
        items: filtered.slice(offset, offset + 20),
        total: filtered.length,
        limit: 20,
        offset,
      })
    },
  }
}

describe('AdminPatientsPage', () => {
  it('lista los pacientes que devuelve la API', async () => {
    mockFetchRoutes([patientsRoute([patient({})])])

    renderPage()

    expect(await screen.findByText('Ana Activa')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('OSDE')).toBeInTheDocument()
  })

  it('filtra por estado inactivo', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      patientsRoute([
        patient({ id: 1, first_name: 'Ana', last_name: 'Activa' }),
        patient({
          id: 2,
          first_name: 'Bruno',
          last_name: 'Inactivo',
          is_active: false,
        }),
      ]),
    ])

    renderPage()

    await screen.findByText('Ana Activa')

    await user.selectOptions(screen.getByLabelText('Estado'), 'false')

    expect(await screen.findByText('Bruno Inactivo')).toBeInTheDocument()
    expect(screen.queryByText('Ana Activa')).not.toBeInTheDocument()
  })

  it('pagina los resultados de a 20', async () => {
    const user = userEvent.setup()

    const many = Array.from({ length: 25 }, (_, index) =>
      patient({
        id: index + 1,
        first_name: `Paciente ${index + 1}`,
        last_name: 'Demo',
        email: `p${index + 1}@example.com`,
      }),
    )

    mockFetchRoutes([patientsRoute(many)])

    renderPage()

    expect(await screen.findByText('Mostrando 1–20 de 25')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Mostrando 21–25 de 25')).toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay coincidencias', async () => {
    mockFetchRoutes([patientsRoute([])])

    renderPage()

    expect(
      await screen.findByText('No hay pacientes que coincidan con la búsqueda.'),
    ).toBeInTheDocument()
  })
})
