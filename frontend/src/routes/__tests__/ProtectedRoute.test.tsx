import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../context/AuthProvider'
import { ProtectedRoute } from '../../routes/ProtectedRoute'
import { ADMIN, DOCTOR, mockApi, PATIENT } from '../../test/testUtils'

/** Reproduce el arbol real: guard externo (sesion + clave temporal) y debajo
 *  un guard por rol para cada area. */
function buildRouter(initialPath: string) {
  const router = createMemoryRouter(
    [
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/app/cambiar-contrasena',
            element: <p>pagina cambiar clave</p>,
          },
          {
            element: <ProtectedRoute allowedRoles={['PATIENT']} />,
            children: [
              { path: '/app', element: <p>home paciente</p> },
              { path: '/app/turnos', element: <p>turnos</p> },
            ],
          },
          {
            element: <ProtectedRoute allowedRoles={['DOCTOR']} />,
            children: [{ path: '/app/medico', element: <p>home medico</p> }],
          },
          {
            element: <ProtectedRoute allowedRoles={['ADMIN']} />,
            children: [{ path: '/app/admin', element: <p>home admin</p> }],
          },
        ],
      },
      { path: '/login', element: <p>pagina de login</p> },
    ],
    { initialEntries: [initialPath] },
  )

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('ProtectedRoute', () => {
  it('sin sesion redirige a /login y recuerda la ruta pedida', async () => {
    mockApi(null)

    const router = buildRouter('/app/turnos')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })

    expect(router.state.location.state).toEqual({ from: '/app/turnos' })
    expect(await screen.findByText('pagina de login')).toBeInTheDocument()
  })

  it('no renderiza la zona privada mientras revalida la cookie', async () => {
    mockApi(PATIENT)

    buildRouter('/app')

    expect(screen.getByRole('status')).toHaveTextContent('Cargando')

    expect(await screen.findByText('home paciente')).toBeInTheDocument()
  })

  it('deja pasar al PATIENT a su area', async () => {
    mockApi(PATIENT)

    buildRouter('/app')

    expect(await screen.findByText('home paciente')).toBeInTheDocument()
  })

  it('deja pasar al DOCTOR a su panel', async () => {
    mockApi(DOCTOR)

    buildRouter('/app/medico')

    expect(await screen.findByText('home medico')).toBeInTheDocument()
  })

  it('deja pasar al ADMIN a su panel', async () => {
    mockApi(ADMIN)

    buildRouter('/app/admin')

    expect(await screen.findByText('home admin')).toBeInTheDocument()
  })

  it('manda al DOCTOR a su home si intenta entrar al area de paciente', async () => {
    mockApi(DOCTOR)

    const router = buildRouter('/app')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app/medico')
    })

    expect(await screen.findByText('home medico')).toBeInTheDocument()
  })

  it('manda al ADMIN a su home si intenta entrar al area de medico', async () => {
    mockApi(ADMIN)

    const router = buildRouter('/app/medico')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app/admin')
    })

    expect(await screen.findByText('home admin')).toBeInTheDocument()
  })

  it('manda al PATIENT a su home si intenta entrar al area de admin', async () => {
    mockApi(PATIENT)

    const router = buildRouter('/app/admin')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app')
    })

    expect(await screen.findByText('home paciente')).toBeInTheDocument()
  })

  it('no hace loop cuando el home del rol es la misma ruta restringida', async () => {
    // DOCTOR entrando a /app/medico, que ademas es su home, dentro de un guard
    // que solo deja pasar a PATIENT. Sin el corte por igualdad, ProtectedRoute
    // se redirigiria a si mismo indefinidamente.
    mockApi(DOCTOR)

    const router = createMemoryRouter(
      [
        {
          element: <ProtectedRoute allowedRoles={['PATIENT']} />,
          children: [{ path: '/app/medico', element: <p>nunca se deberia ver</p> }],
        },
      ],
      { initialEntries: ['/app/medico'] },
    )

    render(
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>,
    )

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tenés acceso a esta sección',
    )
    expect(screen.queryByText('nunca se deberia ver')).not.toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/app/medico')
  })

  it('fuerza el cambio de clave: no deja entrar a otra ruta del portal', async () => {
    mockApi({ ...PATIENT, must_change_password: true })

    const router = buildRouter('/app/turnos')

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/app/cambiar-contrasena')
    })

    expect(await screen.findByText('pagina cambiar clave')).toBeInTheDocument()
  })
})
