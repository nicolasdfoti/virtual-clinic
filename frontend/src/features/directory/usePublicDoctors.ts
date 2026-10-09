import { useQuery } from '@tanstack/react-query'

import api from '../../services/api'
import type { PublicDoctor } from './types'

export const publicDoctorsKey = ['public', 'doctors'] as const

/** Directorio publico de profesionales activos. No requiere sesion. */
export function usePublicDoctors() {
  return useQuery({
    queryKey: publicDoctorsKey,
    queryFn: () => api.get<PublicDoctor[]>('/public/doctors'),
  })
}
