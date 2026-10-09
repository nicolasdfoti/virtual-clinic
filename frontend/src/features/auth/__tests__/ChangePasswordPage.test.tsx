import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  createTestQueryClient,
  mockApi,
  PATIENT,
} from '../../../test/testUtils'
import type { Session } from '../../../services/auth'
import { ChangePasswordPage } from '../ChangePasswordPage'

function renderPage(session: Session = PATIENT, passwordError?: string) {
  mockApi(session, { passwordError })

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/app/cambiar-contrasena']}>
          <Routes>
            <Route
              path="/app/cambiar-contrasena"
              element={<ChangePasswordPage />}
            />
            <Route path="/app" element={<div>Home del paciente</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

async function fillValidForm() {
  const user = userEvent.setup()

  await user.type(
    screen.getByLabelText('Contraseña actual'),
    'Password123',
  )
  await user.type(
    screen.getByLabelText('Nueva contraseña'),
    'NuevaClave123',
  )
  await user.type(
    screen.getByLabelText('Repetí la nueva contraseña'),
    'NuevaClave123',
  )

  return user
}

describe('ChangePasswordPage', () => {
  it('explica la situación cuando la clave es temporal', async () => {
    renderPage({ ...PATIENT, must_change_password: true })

    expect(
      await screen.findByRole('heading', { name: 'Cambiá tu contraseña' }),
    ).toBeInTheDocument()
  })

  it('cambia la contraseña y vuelve al portal', async () => {
    renderPage()

    const user = await fillValidForm()

    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(await screen.findByText('Home del paciente')).toBeInTheDocument()
  })

  it('muestra el error del backend si la clave actual es incorrecta', async () => {
    renderPage(PATIENT, 'La contraseña actual no es correcta.')

    const user = await fillValidForm()

    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(
      await screen.findByText('La contraseña actual no es correcta.'),
    ).toBeInTheDocument()
  })

  it('valida que las contraseñas coincidan', async () => {
    renderPage()

    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText('Contraseña actual'),
      'Password123',
    )
    await user.type(
      screen.getByLabelText('Nueva contraseña'),
      'NuevaClave123',
    )
    await user.type(
      screen.getByLabelText('Repetí la nueva contraseña'),
      'OtraClave123',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(
      await screen.findByText('Las contraseñas no coinciden.'),
    ).toBeInTheDocument()
  })

  it('exige un mínimo de 8 caracteres en la nueva contraseña', async () => {
    renderPage()

    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText('Contraseña actual'),
      'Password123',
    )
    await user.type(screen.getByLabelText('Nueva contraseña'), 'corta7')
    await user.type(
      screen.getByLabelText('Repetí la nueva contraseña'),
      'corta7',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar contraseña' }))

    expect(
      await screen.findByText(
        'La contraseña debe tener al menos 8 caracteres.',
      ),
    ).toBeInTheDocument()
  })
})
