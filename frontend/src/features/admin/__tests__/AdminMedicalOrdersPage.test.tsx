import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { AdminMedicalOrdersPage } from '../AdminMedicalOrdersPage'
import type { AdminMedicalOrder } from '../types'

function order(overrides: Partial<AdminMedicalOrder> = {}): AdminMedicalOrder {
  return {
    id: 7,
    folio: 'ORD-2026-000007',
    doctor_id: 2,
    doctor_name: 'Gonzalo Pérez',
    patient_id: 1,
    patient_name: 'Ana Ruiz',
    patient_dni: '12345678',
    type: 'LAB',
    issued_at: '2026-10-01T12:00:00Z',
    status: 'ACTIVE',
    cancel_reason: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminMedicalOrdersPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminMedicalOrdersPage', () => {
  it('lista las órdenes con tipo y descarga auditada', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions/medical-orders'),
        respond: () =>
          jsonResponse({
            items: [order()],
            total: 1,
            limit: 20,
            offset: 0,
          }),
      },
    ])

    renderPage()

    expect(await screen.findByText('ORD-2026-000007')).toBeInTheDocument()

    const table = screen.getByRole('table', {
      name: 'Órdenes médicas emitidas',
    })
    expect(within(table).getByText('Laboratorio')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Descargar' })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/api/admin/prescriptions/medical-orders/7/pdf'),
    )
  })

  it('muestra el estado vacío cuando no hay órdenes', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/admin/prescriptions/medical-orders'),
        respond: () => jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('No hay órdenes que coincidan con los filtros.'),
    ).toBeInTheDocument()
  })
})
