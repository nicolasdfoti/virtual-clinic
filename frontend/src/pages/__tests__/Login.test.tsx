import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../context/AuthProvider'
import { useAuth } from '../../context/useAuth'
import Login from '../../pages/Login'
import { mockApi, PATIENT } from '../../test/testUtils'

function SessionProbe() {
  const { user, status } = useAuth()

  if (status === 'loading') {
    return <p>loading</p>
  }

  return <p data-testid="session">{user ? `${user.first_name} ${user.role}` : 'anonymous'}</p>
}

function renderLogin(initialEntries: string[] = ['/login']) {
  const router = createMemoryRouter(
    [
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/pacientes',
        element: <p>area de pacientes</p>,
      },
      {
        path: '/turnos',
        element: <p>mis turnos</p>,
      },
    ],
    { initialEntries },
  )

  render(
    <AuthProvider>
      <RouterProvider router={router} />
      <SessionProbe />
    </AuthProvider>,
  )

  return router
}

async function fillCredentials() {
  const user = userEvent.setup()

  await user.type(screen.getByLabelText('Email'), PATIENT.email)
  await user.type(screen.getByLabelText('Contraseña'), 'Password123')
  await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

  return user
}

describe('Login', () => {
  it('actualiza el contexto y redirige a /pacientes cuando las credenciales son validas', async () => {
    mockApi(PATIENT)

    const router = renderLogin()

    await fillCredentials()

    // El contexto pasa a tener la sesion...
    await waitFor(() => {
      expect(screen.getByTestId('session')).toHaveTextContent('Ana PATIENT')
    })

    // ...y el router navega al home del rol.
    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/pacientes')
    })

    expect(await screen.findByText('area de pacientes')).toBeInTheDocument()
  })

  it('vuelve a la ruta original (state.from) si ProtectedRoute habia rebotado', async () => {
    mockApi(PATIENT)

    // Entramos a /login "venido de" /turnos, que es lo que ProtectedRoute
    // guarda en location.state.from.
    const router = createMemoryRouter(
      [
        { path: '/login', element: <Login /> },
        { path: '/turnos', element: <p>mis turnos</p> },
      ],
      { initialEntries: [{ pathname: '/login', state: { from: '/turnos' } }] },
    )

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    await fillCredentials()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/turnos')
    })
  })

  it('muestra un mensaje legible cuando las credenciales son invalidas', async () => {
    // Sin sesion mockeada, /auth/login responde 401.
    mockApi(null)

    renderLogin()

    await fillCredentials()

    const alert = await screen.findByRole('alert')

    // El mensaje sale de ApiError.detail, no del JSON crudo ni de [object Object].
    expect(alert).toHaveTextContent('Credenciales inválidas.')
    expect(alert).not.toHaveTextContent('{"detail"')
    expect(alert).not.toHaveTextContent('[object Object]')
  })

  it('no llama a /auth/login si faltan campos', async () => {
    const fetchMock = mockApi(PATIENT)

    renderLogin()

    await userEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Completá todos los campos.')

    // El provider si llama a /auth/me al montar (por eso el filtro), pero con
    // campos vacios no debe pegarlele al endpoint de login.
    const urls = fetchMock.mock.calls.map((call) => String(call[0]))

    expect(urls.some((url) => url.endsWith('/auth/login'))).toBe(false)
  })
})