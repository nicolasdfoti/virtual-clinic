import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PageParams } from '../../services/api'
import {
  fetchDoctorPatient,
  fetchDoctorPatients,
  linkPatient,
} from './api'
import type { LinkPatientInput } from './types'

export const doctorPatientsKey = (q: string, page: PageParams) =>
  ['doctor', 'patients', q, page] as const

export const doctorPatientKey = (id: number) =>
  ['doctor', 'patient', id] as const

export function useDoctorPatients(q: string, page: PageParams) {
  return useQuery({
    queryKey: doctorPatientsKey(q, page),
    queryFn: () => fetchDoctorPatients(q, page),
  })
}

export function useDoctorPatient(id: number) {
  return useQuery({
    queryKey: doctorPatientKey(id),
    queryFn: () => fetchDoctorPatient(id),
  })
}

export function useLinkPatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LinkPatientInput) => linkPatient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
    },
  })
}
