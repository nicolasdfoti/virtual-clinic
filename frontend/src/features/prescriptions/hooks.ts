import { useQuery } from '@tanstack/react-query'

import { prescriptionApi } from './api'
import type { PrescriptionStatus } from './types'

export function useMyPrescriptions(status?: PrescriptionStatus) {
  return useQuery({
    queryKey: ['my-prescriptions', status ?? 'all'],
    queryFn: () => prescriptionApi.getMyPrescriptions({ status }),
    staleTime: 30_000,
  })
}

export function useMyOrders() {
  return useQuery({
    queryKey: ['my-orders'],
    queryFn: () => prescriptionApi.getMyOrders(),
    staleTime: 30_000,
  })
}
