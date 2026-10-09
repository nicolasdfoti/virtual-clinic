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
import { AdminActivityPage } from '../AdminActivityPage'
import type { Doctor } from '../types'

const doctor: Doctor = {
  id: 2,
  user_id: 20,
  email: 'gonzalo@example.com',
  first_name: 'Gonzalo',
  last_name: 'Pérez',
  specialty: 'Clínica médica',
  license_number: 'MP 1234',
  bio: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminActivityPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminActivityPage', () => {
  it('pide elegir un médico y luego muestra su actividad', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions/doctors/2/activity'),
        respond: () =>
          jsonResponse({
            items: [
              {
                doctor_id: 2,
                doctor_name: 'Gonzalo Pérez',
                prescriptions_issued: 5,
                prescriptions_cancelled: 1,
                orders_issued: 3,
                orders_cancelled: 0,
                patients_attended: 4,
              },
            ],
            total: 1,
            limit: 20,
            offset: 0,
          }),
      },
      {
        test: (url) => url.includes('/admin/doctors'),
        respond: () => jsonResponse([doctor]),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('Elegí un médico para ver su actividad.'),
    ).toBeInTheDocument()

    await user.selectOptions(await screen.findByLabelText('Médico'), '2')

    expect(await screen.findByText('Recetas emitidas')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('Pacientes atendidos')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })
})
