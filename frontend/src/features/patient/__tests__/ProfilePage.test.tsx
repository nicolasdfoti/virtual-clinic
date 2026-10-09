import { QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import {
  completePatientProfile,
  createTestQueryClient,
  emptyPatientProfile,
  mockApi,
  PATIENT,
} from '../../../test/testUtils'
import type { PatientProfile } from '../types'
import { ProfilePage } from '../ProfilePage'

function renderPage(profile: PatientProfile = emptyPatientProfile(PATIENT.id)) {
  mockApi(PATIENT, { profile })

  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <AuthProvider>
        <MemoryRouter>
          <ProfilePage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  )
}

describe('ProfilePage', () => {
  it('marca el perfil como incompleto cuando faltan datos', async () => {
    renderPage()

    expect(await screen.findByText('Perfil incompleto')).toBeInTheDocument()
  })

  it('precarga los datos existentes del perfil', async () => {
    renderPage(completePatientProfile(PATIENT.id))

    expect(await screen.findByText('Perfil completo')).toBeInTheDocument()

    expect(screen.getByLabelText('DNI')).toHaveValue('12345678')
    expect(screen.getByLabelText('Obra social o prepaga')).toHaveValue('OSDE')
  })

  it('guarda los datos y actualiza el estado a completo', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Perfil incompleto')

    await user.type(screen.getByLabelText('DNI'), '12345678')
    fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
      target: { value: '1990-05-20' },
    })
    await user.type(screen.getByLabelText('Teléfono'), '11 5555-5555')
    await user.type(
      screen.getByLabelText('Obra social o prepaga'),
      'OSDE',
    )

    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Guardamos tus datos.')).toBeInTheDocument()
    expect(screen.getByText('Perfil completo')).toBeInTheDocument()
  })

  it('valida el DNI antes de enviar', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Perfil incompleto')

    await user.type(screen.getByLabelText('DNI'), '123')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText(
        'El DNI debe tener entre 7 y 8 dígitos, sin puntos.',
      ),
    ).toBeInTheDocument()
  })

  it('valida el teléfono', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('Perfil incompleto')

    await user.type(screen.getByLabelText('Teléfono'), '123')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(
      await screen.findByText('Ingresá un teléfono válido.'),
    ).toBeInTheDocument()
  })
})
