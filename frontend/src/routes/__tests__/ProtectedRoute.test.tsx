import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../context/AuthProvider'
import { ProtectedRoute } from '../../routes/ProtectedRoute'
import { DOCTOR, mockApi, PATIENT } from '../../test/testUtils'

function renderProtectedRoute(
  allowedRoles?: ('PATIENT' | 'DOCTOR' | 'ADMIN')[],
) {
  const router = createMemoryRouter(
    [
      {
        // /pacientes es el area restringida a pacientes.
        element: <ProtectedRoute {...(allowedRoles ? { allowedRoles } : {})} />,
        children: [{ path: '/pacientes', element: <p>area de pacientes</p> }],
      },
      // El home del doctor vive FUERA del guard, como en la app real: si
      // estuviera adentro, ProtectedRoute se redirigiria a si mismo en loop.
      { path: '/doctors', element: <p>area de medicos</p> },
      { path: '/login', element: <p>pagina de login</p> },
    ],
    { initialEntries: ['/pacientes'] },
  )

  render(
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>,
  )

  return router
}

describe('ProtectedRoute', () => {
  it('redirige a /login y recuerda la ruta pedida si no hay sesion', async () => {
    mockApi(null)

    const router = renderProtectedRoute()

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/login')
    })

    // state.from es lo que despues permite volver a /pacientes tras loguearse.
    expect(router.state.location.state).toEqual({ from: '/pacientes' })
    expect(await screen.findByText('pagina de login')).toBeInTheDocument()
  })

  it('deja pasar a quien tiene sesion con el rol permitido', async () => {
    mockApi(PATIENT)

    renderProtectedRoute(['PATIENT'])

    expect(await screen.findByText('area de pacientes')).toBeInTheDocument()
  })

  it('bloquea el rol incorrecto y lo manda a su propio home', async () => {
    // Sesion de DOCTOR pero la ruta pide allowedRoles=['PATIENT'].
    mockApi(DOCTOR)

    const router = renderProtectedRoute(['PATIENT'])

    await waitFor(() => {
      expect(router.state.location.pathname).toBe('/doctors')
    })

    expect(await screen.findByText('area de medicos')).toBeInTheDocument()
  })

  it('no hace loop cuando el home del rol es la misma ruta restringida', async () => {
    // DOCTOR entrando a /doctors, que ademas es su home y esta dentro de un
    // guard que solo deja pasar a PATIENT. Sin el corte por igualdad, ProtectedRoute
    // se redirigiria a si mismo indefinidamente.
    mockApi(DOCTOR)

    const router = createMemoryRouter(
      [
        {
          element: <ProtectedRoute allowedRoles={['PATIENT']} />,
          children: [{ path: '/doctors', element: <p>nunca se deberia ver</p> }],
        },
      ],
      { initialEntries: ['/doctors'] },
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
    // Sigue en /doctors: no hubo redireccion.
    expect(router.state.location.pathname).toBe('/doctors')
  })

  it('no renderiza la zona privada mientras revalida la cookie', async () => {
    mockApi(PATIENT)

    renderProtectedRoute(['PATIENT'])

    // Antes de que /auth/me responda solo puede verse el estado de carga: si
    // redirigiera en este instante mandaria al login a un usuario con sesion.
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')

    expect(await screen.findByText('area de pacientes')).toBeInTheDocument()
  })
})