import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { ProfessionalsSection } from '../../../components/sections/ProfessionalsSection'
import {
  createTestQueryClient,
  mockFetchRoutes,
} from '../../../test/testUtils'

const doctors = [
  {
    id: 1,
    name: 'Ana Ruiz',
    specialty: 'Clínica médica',
    license_number: 'MP 100',
    bio: 'Atiende adultos.',
  },
  {
    id: 2,
    name: 'Luis Soto',
    specialty: 'Cardiología',
    license_number: 'MP 200',
    bio: null,
  },
]

function renderSection() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <ProfessionalsSection />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProfessionalsSection', () => {
  it('muestra los médicos que devuelve la API', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors'),
        respond: () => new Response(JSON.stringify(doctors), { status: 200 }),
      },
    ])

    renderSection()

    expect(await screen.findByText('Ana Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Luis Soto')).toBeInTheDocument()
    expect(screen.getByText('Matrícula: MP 100')).toBeInTheDocument()
  })

  it('enlaza cada tarjeta al perfil del profesional', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors'),
        respond: () => new Response(JSON.stringify(doctors), { status: 200 }),
      },
    ])

    renderSection()

    const link = await screen.findByRole('link', { name: /Ana Ruiz/ })

    expect(link).toHaveAttribute('href', '/professionals/1')
  })

  it('muestra el estado vacío si no hay médicos', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors'),
        respond: () => new Response('[]', { status: 200 }),
      },
    ])

    renderSection()

    expect(
      await screen.findByText(
        'Próximamente publicaremos a nuestro equipo',
      ),
    ).toBeInTheDocument()
  })

  it('muestra un error si el directorio falla', async () => {
    mockFetchRoutes([
      {
        test: (url) => url.endsWith('/public/doctors'),
        respond: () => new Response('{}', { status: 500 }),
      },
    ])

    renderSection()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })
})
