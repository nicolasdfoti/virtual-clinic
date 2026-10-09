import api from '../../services/api'
import type { PatientProfile, PatientProfileInput } from './types'

/** Perfil del paciente autenticado. Sin fila creada, el backend responde un
 *  perfil vacio con `is_complete: false` (nunca 404). */
export function fetchMyProfile(): Promise<PatientProfile> {
  return api.get<PatientProfile>('/patients/me/profile')
}

export function updateMyProfile(
  input: PatientProfileInput,
): Promise<PatientProfile> {
  return api.put<PatientProfile>('/patients/me/profile', input)
}
