import { api } from '../../services/api'
import type { DoctorProfile, DoctorBioInput } from './profileTypes'

export const doctorProfileApi = {
  /** Obtiene el perfil del médico autenticado. */
  getMyProfile: (): Promise<DoctorProfile> =>
    api.get<DoctorProfile>('/doctor/me/profile'),

  /** Actualiza la bio del médico autenticado. */
  updateMyBio: (input: DoctorBioInput): Promise<DoctorProfile> =>
    api.patch<DoctorProfile>('/doctor/me/profile', input),
}