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
import { AuditLogPage } from '../AuditLogPage'
import type { AuditLogEntry } from '../types'

function entry(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: 1,
    actor_user_id: 2,
    actor_email: 'medico@example.com',
    actor_name: 'Gonzalo Ruiz',
    action: 'patient_profile_viewed',
    entity_type: 'patient_profile',
    entity_id: 5,
    ip: '127.0.0.1',
    metadata: null,
    created_at: '2026-02-15T12:00:00Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <AuditLogPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function auditRoute(entries: AuditLogEntry[]) {
  return {
    test: (url: string) => url.includes('/admin/audit-logs'),
    respond: (url: string) => {
      const parsed = new URL(url)
      const action = parsed.searchParams.get('action')?.toLowerCase() ?? ''

      const filtered = action
        ? entries.filter((item) => item.action.toLowerCase().includes(action))
        : entries

      return jsonResponse({
        items: filtered,
        total: filtered.length,
        limit: 20,
        offset: 0,
      })
    },
  }
}

describe('AuditLogPage', () => {
  it('lista los eventos con su actor y acción', async () => {
    mockFetchRoutes([auditRoute([entry()])])

    renderPage()

    expect(await screen.findByText('Gonzalo Ruiz')).toBeInTheDocument()
    expect(screen.getByText('Vio un perfil de paciente')).toBeInTheDocument()
    expect(screen.getByText('patient_profile #5')).toBeInTheDocument()
  })

  it('muestra el estado vacío', async () => {
    mockFetchRoutes([auditRoute([])])

    renderPage()

    expect(
      await screen.findByText('No hay eventos que coincidan con los filtros.'),
    ).toBeInTheDocument()
  })

  it('filtra por acción', async () => {
    const user = userEvent.setup()

    mockFetchRoutes([
      auditRoute([
        entry({ id: 1, action: 'patient_profile_viewed' }),
        entry({
          id: 2,
          action: 'patient_linked',
          actor_name: 'Marta Gómez',
        }),
      ]),
    ])

    renderPage()

    await screen.findByText('Vio un perfil de paciente')

    await user.type(screen.getByLabelText('Acción'), 'linked')
    await user.click(screen.getByRole('button', { name: 'Filtrar' }))

    expect(await screen.findByText('Vinculó a un paciente')).toBeInTheDocument()
    expect(
      screen.queryByText('Vio un perfil de paciente'),
    ).not.toBeInTheDocument()
  })
})
