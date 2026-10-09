import { useState } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '../../context/AuthProvider'
import { UnauthorizedRedirect } from '../../routes/UnauthorizedRedirect'
import { api } from '../../services/api'
import { jsonResponse, PATIENT } from '../../test/testUtils'

/** Dispara una request autenticada que el backend responde con 401. */
function ApiProbe() {
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      onClick={() => {
        void api.get('/turnos').catch(() => setFailed(true))
      }}
    >
      {failed ? 'falló' : 'llamar api'}
    </button>
  )
}

describe('UnauthorizedRedirect', () => {
  it('ante un 401 limpia la sesion y manda al login recordando la ruta', async () => {
    const user = userEvent.setup()

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)

        if (url.endsWith('/auth/me')) {
          return jsonResponse(PATIENT)
        }

        // Cualquier endpoint de dominio: la sesion ya no vale.
        return jsonResponse({ detail: 'Sesión expirada.' }, { status: 401 })
      }),
    )

    const router = createMemoryRouter(
      [
        {
          // Igual que en App: el watcher vive dentro del router.
          element: (
            <>
              <UnauthorizedRedirect />
              <Outlet />
            </>
          ),
          children: [
            {
              path: '/app',
              element: (
                <>
                  <ApiProbe />
                  <p>home paciente</p>
                </>
              ),
            },
            { path: '/login', element: <p>pagina de login</p> },
          ],
        },
      ],
      { initialEntries: ['/app'] },
    )

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    expect(await screen.findByText('home paciente')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'llamar api' }))

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })

    expect(router.state.location.state).toEqual({ from: '/app' })
    expect(await screen.findByText('pagina de login')).toBeInTheDocument()
  })
})
