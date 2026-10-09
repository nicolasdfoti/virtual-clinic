import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../../context/AuthProvider'
import { mockApi, PATIENT } from '../../../test/testUtils'
import { PatientHome } from '../PatientHome'

function renderHome() {
  mockApi(PATIENT)

  return render(
    <AuthProvider>
      <MemoryRouter>
        <PatientHome />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('PatientHome', () => {
  it('saluda al paciente por su nombre', async () => {
    renderHome()

    expect(
      await screen.findByRole('heading', { name: 'Hola, Ana' }),
    ).toBeInTheDocument()
  })

  it('muestra la tarjeta de próximo turno con su estado vacío', async () => {
    renderHome()

    expect(
      await screen.findByRole('heading', { name: 'Tu próximo turno' }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('No tenés turnos agendados por ahora.'),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: 'Sacá un turno' }),
    ).toBeInTheDocument()
  })

  it('expone los accesos rápidos a Turnos, Recetas y Órdenes', async () => {
    renderHome()

    await screen.findByText('Hola, Ana')

    for (const label of ['Turnos', 'Recetas', 'Órdenes']) {
      expect(screen.getByRole('link', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('muestra el estado vacío de últimos movimientos', async () => {
    renderHome()

    expect(
      await screen.findByRole('heading', { name: 'Últimos movimientos' }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('Todavía no tenés movimientos para mostrar.'),
    ).toBeInTheDocument()
  })
})
