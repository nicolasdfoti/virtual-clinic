import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchMyProfile, updateMyProfile } from './api'
import type { PatientProfileInput } from './types'

export const patientProfileKey = ['patient', 'profile'] as const

export function usePatientProfile() {
  return useQuery({
    queryKey: patientProfileKey,
    queryFn: fetchMyProfile,
  })
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: PatientProfileInput) => updateMyProfile(input),
    onSuccess: (profile) => {
      // El PUT devuelve el perfil guardado: se usa como fuente de verdad para
      // que el badge de completitud y el banner se actualicen al instante.
      queryClient.setQueryData(patientProfileKey, profile)
    },
  })
}
