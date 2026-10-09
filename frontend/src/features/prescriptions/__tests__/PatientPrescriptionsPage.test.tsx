import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import { PatientPrescriptionsPage } from '../PatientPrescriptionsPage'
import type { Prescription } from '../types'

function prescription(overrides: Partial<Prescription> = {}): Prescription {
  return {
    id: 1,
    folio: 'RX-2026-000001',
    patient_id: 1,
    doctor_id: 2,
    appointment_id: null,
    issued_at: '2026-10-01T12:00:00Z',
    status: 'ACTIVE',
    cancel_reason: null,
    items: [
      {
        id: 10,
        prescription_id: 1,
        medication: 'Amoxicilina',
        dose: '500 mg',
        frequency: 'cada 8 horas',
        duration: '7 días',
        instructions: null,
        created_at: '2026-10-01T12:00:00Z',
      },
    ],
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <PatientPrescriptionsPage />
    </QueryClientProvider>,
  )
}

describe('PatientPrescriptionsPage', () => {
  it('lista las recetas con su medicamento y la descarga', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/prescriptions'),
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

    expect(await screen.findByText('Receta RX-2026-000001')).toBeInTheDocument()
    expect(screen.getByText('Amoxicilina')).toBeInTheDocument()
    expect(screen.getByText(/cada 8 horas/)).toBeInTheDocument()

    const link = screen.getByRole('link', { name: 'Descargar PDF' })
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('/api/prescriptions/1/pdf'),
    )
  })

  it('muestra un estado vacío cuando no hay recetas', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.includes('/prescriptions'),
        respond: () => jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
      },
    ])

    renderPage()

    expect(
      await screen.findByText('Todavía no tenés recetas para mostrar.'),
    ).toBeInTheDocument()
  })
})
