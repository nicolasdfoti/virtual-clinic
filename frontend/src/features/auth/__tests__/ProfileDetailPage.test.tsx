import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../../test/testUtils'
import type { ProfileDetailResponse } from '../profileApi'
import { ProfileDetailPage } from '../ProfileDetailPage'

function renderProfile(userId = 5) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/app/perfiles/${userId}`]}>
        <Routes>
          <Route path="/app/perfiles/:userId" element={<ProfileDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function profileRoute(profile: ProfileDetailResponse | null) {
  return {
    test: (url: string) => url.includes('/profiles/'),
    respond: () =>
      profile
        ? jsonResponse(profile)
        : jsonResponse({ detail: 'Perfil no encontrado.' }, { status: 404 }),
  }
}

const PATIENT_PROFILE: ProfileDetailResponse = {
  type: 'patient',
  id: 5,
  user_id: 5,
  first_name: 'Ana',
  last_name: 'Ruiz',
  email: 'ana@example.com',
  dni: '12345678',
  birth_date: '1990-05-20',
  sex: 'Femenino',
  phone: '11 5555-5555',
  address: null,
  city: null,
  insurance_provider: 'OSDE',
  insurance_plan: null,
  insurance_member_number: null,
  emergency_contact_name: null,
  emergency_contact_phone: null,
  is_complete: true,
  created_at: null,
  updated_at: null,
}

const DOCTOR_PROFILE: ProfileDetailResponse = {
  type: 'doctor',
  id: 6,
  user_id: 6,
  first_name: 'Gonzalo',
  last_name: 'Pérez',
  email: 'medico@example.com',
  specialty: 'Clínica médica',
  license_number: 'MP 100',
  bio: 'Atiendo de lunes a viernes.',
  is_active: true,
  created_at: null,
}

const ADMIN_PROFILE: ProfileDetailResponse = {
  type: 'admin',
  id: 7,
  user_id: 7,
  first_name: 'Alicia',
  last_name: 'Sosa',
  email: 'admin@example.com',
  created_at: null,
}

describe('ProfileDetailPage', () => {
  it('renderiza el perfil de un paciente', async () => {
    mockFetchRoutes([profileRoute(PATIENT_PROFILE)])

    renderProfile()

    expect(await screen.findByText('Perfil de Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Paciente')).toBeInTheDocument()
    expect(screen.getByText('12345678')).toBeInTheDocument()
    expect(screen.getByText('OSDE')).toBeInTheDocument()
  })

  it('renderiza el perfil de un médico con especialidad y matrícula', async () => {
    mockFetchRoutes([profileRoute(DOCTOR_PROFILE)])

    renderProfile(6)

    expect(
      await screen.findByText('Perfil de Gonzalo Pérez'),
    ).toBeInTheDocument()
    expect(screen.getByText('Médico')).toBeInTheDocument()
    expect(screen.getByText('Clínica médica')).toBeInTheDocument()
    expect(screen.getByText('MP 100')).toBeInTheDocument()
  })

  it('renderiza el perfil de un admin', async () => {
    mockFetchRoutes([profileRoute(ADMIN_PROFILE)])

    renderProfile(7)

    expect(await screen.findByText('Perfil de Alicia Sosa')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('muestra "Perfil no disponible" ante un 404', async () => {
    mockFetchRoutes([profileRoute(null)])

    renderProfile()

    expect(await screen.findByText('Perfil no disponible')).toBeInTheDocument()
  })
})
