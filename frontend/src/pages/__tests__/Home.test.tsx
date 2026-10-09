import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { AuthProvider } from '../../context/AuthProvider'
import { mockApi } from '../../test/testUtils'
import Home from '../Home'

function renderHome() {
  // Home se renderiza para visitantes sin sesión.
  mockApi(null)

  return render(
    <AuthProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Home', () => {
  it('renderiza los 4 bloques prometidos', () => {
    const { container } = renderHome()

    for (const id of ['inicio', 'como-funciona', 'profesionales', 'faq']) {
      expect(container.querySelector(`#${id}`), `falta el bloque #${id}`).not.toBeNull()
    }
  })

  it('no renderiza imágenes remotas', () => {
    const { container } = renderHome()

    expect(container.querySelectorAll('img')).toHaveLength(0)
  })

  it('no incluye las secciones eliminadas', () => {
    const { container } = renderHome()

    expect(container.querySelector('#especialidades')).toBeNull()
    expect(container.textContent).not.toMatch(/Beneficios/i)
    expect(container.textContent).not.toMatch(/todos los días/i)
  })
})