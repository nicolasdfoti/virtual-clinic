import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageParams } from '../../services/api'

import { patientFileApi } from './patientFileApi'

export const myFilesKey = (page: PageParams) => ['patient', 'my-files', page] as const

export function useMyFiles(page: PageParams = {}) {
  return useQuery({
    queryKey: myFilesKey(page),
    queryFn: () => patientFileApi.list(page),
  })
}

export function useUploadFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => patientFileApi.upload(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['patient', 'my-files'] })
    },
  })
}