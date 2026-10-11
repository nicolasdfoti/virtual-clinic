import api from '../../services/api'

export interface ProfileDetailResponse {
  type: 'patient' | 'doctor' | 'admin'
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  specialty?: string
  license_number?: string
  bio?: string | null
  is_active?: boolean
  dni?: string | null
  birth_date?: string | null
  sex?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  insurance_provider?: string | null
  insurance_plan?: string | null
  insurance_member_number?: string | null
  emergency_contact_name?: string | null
  emergency_contact_phone?: string | null
  is_complete?: boolean
  created_at?: string | null
  updated_at?: string | null
}

export const profileApi = {
  getProfile: (userId: number): Promise<ProfileDetailResponse> =>
    api.get(`/profiles/${userId}`),
}