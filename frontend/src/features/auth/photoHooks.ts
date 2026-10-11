import { useMutation } from '@tanstack/react-query'

import { useAuth } from '../../context/useAuth'
import { photoApi } from './photoApi'

/** Actualiza la foto propia y revalida la sesion para reflejarla en la UI. */
export function useUpdateMyPhoto() {
  const { refresh } = useAuth()

  return useMutation({
    mutationFn: (photo: string | null) => photoApi.update(photo),
    onSuccess: async () => {
      await refresh()
    },
  })
}
