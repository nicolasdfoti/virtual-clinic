import { QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import {
  completePatientProfile,
  createTestQueryClient,
  emptyPatientProfile,
  mockApi,
  PATIENT,
} from '../../../test/testUtils'
import type { PatientProfile } from '../types'
import { ProfileIncompleteBanner } from '../ProfileIncompleteBanner'

function renderBanner(profile: PatientProfile) {
  const fetchMock = mockApi(PATIENT, { profile })

  render(
    <QueryClientProvider client={createTestQueryClient()}>
      <MemoryRouter>
        <ProfileIncompleteBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return fetchMock
}

describe('ProfileIncompleteBanner', () => {
  it('invita a completar el perfil cuando faltan datos', async () => {
    renderBanner(emptyPatientProfile(PATIENT.id))

    const link = await screen.findByRole('link', {
      name: 'Completar perfil',
    })

    expect(link).toHaveAttribute('href', '/app/perfil')
  })

  it('no muestra nada cuando el perfil está completo', async () => {
    const fetchMock = renderBanner(completePatientProfile(PATIENT.id))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalled()
    })

    expect(
      screen.queryByRole('link', { name: 'Completar perfil' }),
    ).not.toBeInTheDocument()
  })
})
