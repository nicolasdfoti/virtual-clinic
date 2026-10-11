import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
} from '../../test/testUtils'
import { ProfessionalProfilePage } from '../ProfessionalProfilePage'

const PROFESSIONAL = {
  id: 1,
  name: 'Ana Ruiz',
  specialty: 'Clínica médica',
  license_number: 'MP 100',
  bio: 'Atiende adultos.',
}

function renderPage(id = 1) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter initialEntries={[`/professionals/${id}`]}>
        <Routes>
          <Route path="/professionals/:id" element={<ProfessionalProfilePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProfessionalProfilePage', () => {
  it('muestra los datos del profesional', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors/1'),
        respond: () => jsonResponse(PROFESSIONAL),
      },
    ])

    renderPage()

    expect(await screen.findByText('Dr. Ana Ruiz')).toBeInTheDocument()
    expect(screen.getAllByText('Clínica médica').length).toBeGreaterThan(0)
    expect(screen.getByText('Matrícula: MP 100')).toBeInTheDocument()
    expect(screen.getByText('Atiende adultos.')).toBeInTheDocument()
  })

  it('muestra "Perfil no disponible" ante un 404', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors/1'),
        respond: () =>
          jsonResponse({ detail: 'No encontramos ese médico.' }, { status: 404 }),
      },
    ])

    renderPage()

    expect(await screen.findByText('Perfil no disponible')).toBeInTheDocument()
  })
})
