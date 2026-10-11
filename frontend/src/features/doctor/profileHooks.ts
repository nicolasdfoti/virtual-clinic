import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { doctorProfileApi } from './profileApi'
import type { DoctorProfile, DoctorBioInput } from './profileTypes'

export const myDoctorProfileKey = ['doctor', 'my-profile'] as const

export function useMyDoctorProfile() {
  return useQuery({
    queryKey: myDoctorProfileKey,
    queryFn: doctorProfileApi.getMyProfile,
  })
}

export function useUpdateMyDoctorBio() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DoctorBioInput) => doctorProfileApi.updateMyBio(input),
    onSuccess: (profile: DoctorProfile) => {
      queryClient.setQueryData(['doctor', 'my-profile'], profile)
    },
  })
}