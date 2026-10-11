import { useQuery } from '@tanstack/react-query'

import { adminProfileApi } from './profileApi'

export const myAdminProfileKey = ['admin', 'my-profile'] as const

export function useMyAdminProfile() {
  return useQuery({
    queryKey: myAdminProfileKey,
    queryFn: adminProfileApi.getMyProfile,
  })
}