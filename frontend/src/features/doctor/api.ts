import api, { type PageParams, type Paginated } from '../../services/api'
import type {
  DoctorPatient,
  DoctorPatientDetail,
  LinkPatientInput,
} from './types'

function buildQuery(q: string, page: PageParams): string {
  const search = new URLSearchParams()

  if (q.trim()) search.set('q', q.trim())
  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function fetchDoctorPatients(
  q: string,
  page: PageParams,
): Promise<Paginated<DoctorPatient>> {
  return api.get<Paginated<DoctorPatient>>(
    `/doctor/patients${buildQuery(q, page)}`,
  )
}

export function fetchDoctorPatient(id: number): Promise<DoctorPatientDetail> {
  return api.get<DoctorPatientDetail>(`/doctor/patients/${id}`)
}

export function linkPatient(input: LinkPatientInput): Promise<DoctorPatient> {
  return api.post<DoctorPatient>('/doctor/patients', input)
}
