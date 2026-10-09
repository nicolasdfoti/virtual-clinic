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
import { AdminPrescriptionsPage } from '../AdminPrescriptionsPage'
import type { AdminPrescription } from '../types'

function prescription(
  overrides: Partial<AdminPrescription> = {},
): AdminPrescription {
  return {
    id: 1,
    folio: 'RX-2026-000001',
    doctor_id: 2,
    doctor_name: 'Gonzalo Pérez',
    patient_id: 1,
    patient_name: 'Ana Ruiz',
    patient_dni: '12345678',
    issued_at: '2026-10-01T12:00:00Z',
    status: 'ACTIVE',
    cancel_reason: null,
    item_count: 2,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminPrescriptionsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminPrescriptionsPage', () => {
  it('lista las recetas con paciente, médico y descarga auditada', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions'),
        respond: () =>
          jsonResponse({
            items: [prescription()],
            total: 1,
            limit: 20,
            offset: 0,
          }),
      },
    ])

    renderPage()

    expect(await screen.findByText('RX-2026-000001')).toBeInTheDocument()
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Gonzalo Pérez')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Descargar' })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/api/admin/prescriptions/1/pdf'),
    )
  })

  it('filtra por estado anulado', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions'),
        respond: (url) => {
          const status = new URL(url).searchParams.get('status')
          const items =
            status === 'CANCELLED'
              ? [prescription({ id: 2, folio: 'RX-2026-000002', status: 'CANCELLED' })]
              : [prescription()]

          return jsonResponse({ items, total: items.length, limit: 20, offset: 0 })
        },
      },
    ])

    renderPage()

    await screen.findByText('RX-2026-000001')

    await user.selectOptions(screen.getByLabelText('Estado'), 'CANCELLED')

    expect(await screen.findByText('RX-2026-000002')).toBeInTheDocument()
    expect(screen.queryByText('RX-2026-000001')).not.toBeInTheDocument()
  })

  it('muestra el estado vacío cuando no hay coincidencias', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions'),
        respond: () => jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('No hay recetas que coincidan con los filtros.'),
    ).toBeInTheDocument()
  })
})
