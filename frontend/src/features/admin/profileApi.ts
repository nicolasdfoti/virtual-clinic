import { api } from '../../services/api'
import type { AdminProfile } from './profileTypes'

export const adminProfileApi = {
  /** Obtiene el perfil del admin autenticado. */
  getMyProfile: (): Promise<AdminProfile> =>
    api.get<AdminProfile>('/admin/me/profile'),
}