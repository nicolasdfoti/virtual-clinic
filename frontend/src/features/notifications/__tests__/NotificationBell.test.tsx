import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import {
  createTestQueryClient,
  jsonResponse,
  mockFetchRoutes,
  type FetchRoute,
} from '../../../test/testUtils'
import { NotificationBell } from '../NotificationBell'
import type { AppNotification } from '../types'

function notification(
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: 1,
    type: 'appointment_booked',
    title: 'Nuevo turno reservado',
    message: 'Ana reservó un turno para el 15/06/2030 10:00.',
    related_type: 'appointment',
    related_id: 10,
    is_read: false,
    created_at: '2030-06-01T13:00:00Z',
    ...overrides,
  }
}

function unreadRoute(unread: number): FetchRoute {
  return {
    test: (url) => url.includes('/notifications/unread-count'),
    respond: () => jsonResponse({ unread }),
  }
}

function listRoute(items: AppNotification[]): FetchRoute {
  return {
    test: (url, method) =>
      url.includes('/notifications') && method === 'GET',
    respond: () => jsonResponse(items),
  }
}

function renderBell() {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <NotificationBell />
    </QueryClientProvider>,
  )
}

describe('NotificationBell', () => {
  it('muestra el contador y lista los avisos al abrir', async () => {
    mockFetchRoutes([
      unreadRoute(2),
      listRoute([notification()]),
    ])

    renderBell()

    const bell = await screen.findByRole('button', {
      name: /Notificaciones \(2 sin leer\)/,
    })

    expect(screen.getByTestId('notification-badge')).toHaveTextContent('2')

    await userEvent.click(bell)

    expect(
      await screen.findByText('Nuevo turno reservado'),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Ana reservó un turno para el 15/06/2030 10:00.'),
    ).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay avisos', async () => {
    mockFetchRoutes([unreadRoute(0), listRoute([])])

    renderBell()

    await userEvent.click(await screen.findByRole('button', { name: 'Notificaciones' }))

    expect(
      await screen.findByText('No tenés notificaciones.'),
    ).toBeInTheDocument()
    expect(screen.queryByTestId('notification-badge')).not.toBeInTheDocument()
  })

  it('marca todas como leídas', async () => {
    const fetchMock = mockFetchRoutes([
      unreadRoute(1),
      listRoute([notification()]),
      {
        test: (url, method) =>
          url.includes('/notifications/read-all') && method === 'POST',
        respond: () => new Response(null, { status: 204 }),
      },
    ])

    renderBell()

    await userEvent.click(
      await screen.findByRole('button', { name: /sin leer/ }),
    )
    await userEvent.click(
      await screen.findByRole('button', {
        name: 'Marcar todas como leídas',
      }),
    )

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/read-all'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
  })

  it('marca un aviso como leído al hacer click', async () => {
    const markRead = vi.fn()
    const fetchMock = mockFetchRoutes([
      unreadRoute(1),
      listRoute([notification({ id: 7 })]),
      {
        test: (url, method) =>
          url.includes('/notifications/7/read') && method === 'POST',
        respond: () => {
          markRead()
          return jsonResponse(notification({ id: 7, is_read: true }))
        },
      },
    ])

    renderBell()

    await userEvent.click(
      await screen.findByRole('button', { name: /sin leer/ }),
    )
    await userEvent.click(
      await screen.findByRole('menuitem', { name: /Nuevo turno reservado/ }),
    )

    await waitFor(() => expect(markRead).toHaveBeenCalled())
    expect(fetchMock).toHaveBeenCalled()
  })
})
