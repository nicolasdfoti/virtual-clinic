import api from '../../services/api'

export type PhotoResponse = {
  photo: string | null
}

export const photoApi = {
  update: (photo: string | null): Promise<PhotoResponse> =>
    api.put<PhotoResponse>('/profiles/me/photo', { photo }),
}
