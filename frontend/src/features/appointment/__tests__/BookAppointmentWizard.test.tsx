import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  createTestQueryClient,
  completePatientProfile,
  mockFetchRoutes,
  PATIENT,
  jsonResponse,
} from '../../../test/testUtils'
import { BookAppointmentWizard } from '../BookAppointmentWizard'

function renderWizard(conflictOnBook = false) {
  const profile = completePatientProfile(PATIENT.id)

  mockFetchRoutes([
    {
      test: (url) => url.endsWith('/auth/me'),
      respond: () => jsonResponse(PATIENT),
    },
    {
      test: (url) => url.includes('/patients/me/profile'),
      respond: () => jsonResponse(profile),
    },
    {
      test: (url) => url.endsWith('/public/doctors'),
      respond: () =>
        jsonResponse([
          {
            id: 1,
            name: 'Dr. Gonzalo Pérez',
            specialty: 'Clínica médica',
            license_number: 'MP 1234',
            bio: 'Especialista en clínica médica.',
            is_active: true,
          },
        ]),
    },
    {
      test: (url) => url.includes('/slots'),
      respond: () =>
        jsonResponse([
          {
            start: '2030-06-15T09:00:00Z',
            end: '2030-06-15T09:30:00Z',
          },
        ]),
    },
    {
      test: (url, method) => url.includes('/appointments') && method === 'POST',
      respond: () => {
        if (conflictOnBook) {
          return jsonResponse(
            { detail: 'Ese horario ya fue reservado.' },
            { status: 409 },
          )
        }
        return jsonResponse(
          {
            id: 100,
            doctor_id: 1,
            doctor_name: 'Dr. Gonzalo Pérez',
            patient_id: PATIENT.id,
            patient_name: 'Ana Ruiz',
            starts_at: '2030-06-15T09:00:00Z',
            ends_at: '2030-06-15T09:30:00Z',
            status: 'SCHEDULED',
            reason: 'Control anual',
            modality: 'VIDEO',
            created_at: '2026-04-01T10:00:00Z',
          },
          { status: 201 },
        )
      },
    },
  ])

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/turnos/nuevo']}>
          <Routes>
            <Route
              path="/app/turnos/nuevo"
              element={<BookAppointmentWizard />}
            />
            <Route path="/app/turnos" element={<div>Mis Turnos Page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('BookAppointmentWizard', () => {
  it('completa el flujo de reserva de turno exitosamente', async () => {
    renderWizard(false)
    const user = userEvent.setup()

    const dayButton = await screen.findByRole('button', { name: /15 de octubre/i })
    await user.click(dayButton)

    const slotButton = await screen.findByRole('button', { name: /06:00/i })
    await user.click(slotButton)

    expect(
      await screen.findByRole('heading', { name: 'Resumen del turno' }),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar y agendar',
    })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('Mis Turnos Page')).toBeInTheDocument()
    })
  })

  it('maneja el conflicto 409 cuando el turno ya fue reservado', async () => {
    renderWizard(true)
    const user = userEvent.setup()

    const dayButton = await screen.findByRole('button', { name: /15 de octubre/i })
    await user.click(dayButton)

    const slotButton = await screen.findByRole('button', { name: /06:00/i })
    await user.click(slotButton)

    expect(
      await screen.findByRole('heading', { name: 'Resumen del turno' }),
    ).toBeInTheDocument()

    const confirmButton = screen.getByRole('button', {
      name: 'Confirmar y agendar',
    })
    await user.click(confirmButton)

    expect(
      await screen.findByText(/Ese horario ya fue reservado|error/i),
    ).toBeInTheDocument()
  })
})
