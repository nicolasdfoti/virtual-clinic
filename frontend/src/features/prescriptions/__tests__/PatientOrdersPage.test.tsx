import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { PatientOrdersPage } from '../PatientOrdersPage'
import type { MedicalOrder } from '../types'

function order(overrides: Partial<MedicalOrder> = {}): MedicalOrder {
  return {
    id: 7,
    folio: 'ORD-2026-000007',
    patient_id: 1,
    doctor_id: 2,
    appointment_id: null,
    type: 'LAB',
    studies: 'Hemograma completo',
    presumptive_diagnosis: 'Anemia',
    issued_at: '2026-10-01T12:00:00Z',
    status: 'ACTIVE',
    cancel_reason: null,
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <PatientOrdersPage />
    </QueryClientProvider>,
  )
}

describe('PatientOrdersPage', () => {
  it('lista las órdenes con sus estudios y la descarga', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/prescriptions/orders'),
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

    expect(await screen.findByText(/Laboratorio/)).toBeInTheDocument()
    expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
    expect(screen.getByText('Anemia')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Descargar PDF' })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/api/prescriptions/orders/7/pdf'),
    )
  })

  it('muestra un estado vacío cuando no hay órdenes', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/prescriptions/orders'),
        respond: () => jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('Todavía no tenés órdenes para mostrar.'),
    ).toBeInTheDocument()
  })
})
