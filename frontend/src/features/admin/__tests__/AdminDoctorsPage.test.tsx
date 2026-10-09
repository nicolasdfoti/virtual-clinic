import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
  type FetchRoute,
} from '../../../test/testUtils'
import type { Doctor } from '../types'
import { AdminDoctorsPage } from '../AdminDoctorsPage'

function doctor(overrides: Partial<Doctor> = {}): Doctor {
  return {
    id: 1,
    user_id: 10,
    email: 'medico@example.com',
    first_name: 'Gonzalo',
    last_name: 'Pérez',
    specialty: 'Clínica médica',
    license_number: 'MP 100',
    bio: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function doctorsBackend(initial: Doctor[]) {
  const state = { doctors: [...initial] }

  const routes: FetchRoute[] = [
    {
      test: (url, method) =>
        method === 'GET' && url.endsWith('/admin/doctors'),
      respond: () => jsonResponse(state.doctors),
    },
    {
      test: (url, method) =>
        method === 'POST' && url.includes('/deactivate'),
      respond: (url) => {
        const id = Number(url.match(/\/doctors\/(\d+)\//)?.[1])
        const found = state.doctors.find((item) => item.id === id)!

        found.is_active = false

        return jsonResponse(found)
      },
    },
    {
      test: (url, method) => method === 'POST' && url.includes('/activate'),
      respond: (url) => {
        const id = Number(url.match(/\/doctors\/(\d+)\//)?.[1])
        const found = state.doctors.find((item) => item.id === id)!

        found.is_active = true

        return jsonResponse(found)
      },
    },
    {
      test: (url, method) =>
        method === 'POST' && url.endsWith('/admin/doctors'),
      respond: (_url, _method, init) => {
        const body = JSON.parse(String(init?.body ?? '{}'))

        const created: Doctor & { temporary_password: string } = {
          ...doctor({ id: 99, user_id: 99 }),
          ...body,
          temporary_password: 'TempPass123',
        }

        state.doctors.push(created)

        return jsonResponse(created)
      },
    },
  ]

  return { routes, state }
}

function renderPage(routes: FetchRoute[]) {
  mockFetchRoutes(routes)

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AdminDoctorsPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AdminDoctorsPage', () => {
  it('lista los médicos', async () => {
    renderPage(doctorsBackend([doctor()]).routes)

    expect(await screen.findByText('Gonzalo Pérez')).toBeInTheDocument()
    expect(screen.getByText('MP 100')).toBeInTheDocument()
  })

  it('desactiva un médico', async () => {
    const user = userEvent.setup()

    renderPage(doctorsBackend([doctor()]).routes)

    await screen.findByText('Activo')

    await user.click(screen.getByRole('button', { name: 'Desactivar' }))

    expect(await screen.findByText('Inactivo')).toBeInTheDocument()
  })

  it('da de alta un médico y muestra la contraseña temporal', async () => {
    const user = userEvent.setup()

    renderPage(doctorsBackend([]).routes)

    await screen.findByText(
      'Todavía no hay médicos cargados. Empezá dando de alta al primero.',
    )

    await user.click(screen.getByRole('button', { name: 'Nuevo médico' }))

    await user.type(screen.getByLabelText('Email'), 'nuevo@example.com')
    await user.type(screen.getByLabelText('Nombre'), 'Nora')
    await user.type(screen.getByLabelText('Apellido'), 'Gómez')
    await user.type(screen.getByLabelText('Especialidad'), 'Cardiología')
    await user.type(screen.getByLabelText('Matrícula'), 'MP 5555')

    await user.click(screen.getByRole('button', { name: 'Dar de alta' }))

    expect(await screen.findByTestId('temporary-password')).toHaveTextContent(
      'TempPass123',
    )
  })
})
