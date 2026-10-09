import api, { type PageParams, type Paginated } from '../../services/api'
import type {
  AdminMedicalOrder,
  AdminPatient,
  AdminPatientFilters,
  AdminPrescription,
  AdminStats,
  AuditLogEntry,
  AuditLogFilters,
  Doctor,
  DoctorActivity,
  DoctorActivityFilters,
  DoctorCreated,
  DoctorInput,
  DoctorProfileInput,
  DoctorUpdateInput,
  MedicalOrderFilters,
  PrescriptionFilters,
} from './types'

/** Arma el query string del listado de pacientes con todos sus filtros. */
export function buildPatientQuery(
  filters: AdminPatientFilters,
  page: PageParams,
): string {
  const search = new URLSearchParams()

  if (filters.q) search.set('q', filters.q)
  if (filters.insurance_provider) {
    search.set('insurance_provider', filters.insurance_provider)
  }
  if (filters.is_active !== undefined) {
    search.set('is_active', String(filters.is_active))
  }
  if (filters.doctor_id !== undefined) {
    search.set('doctor_id', String(filters.doctor_id))
  }
  if (filters.created_from) search.set('created_from', filters.created_from)
  if (filters.created_to) search.set('created_to', filters.created_to)
  if (filters.sort) search.set('sort', filters.sort)
  if (filters.order) search.set('order', filters.order)

  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function buildAuditQuery(
  filters: AuditLogFilters,
  page: PageParams,
): string {
  const search = new URLSearchParams()

  if (filters.actor_user_id !== undefined) {
    search.set('actor_user_id', String(filters.actor_user_id))
  }
  if (filters.action) search.set('action', filters.action)
  if (filters.entity_type) search.set('entity_type', filters.entity_type)
  if (filters.created_from) search.set('created_from', filters.created_from)
  if (filters.created_to) search.set('created_to', filters.created_to)

  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function buildPrescriptionQuery(
  filters: PrescriptionFilters,
  page: PageParams,
): string {
  const search = new URLSearchParams()

  if (filters.q) search.set('q', filters.q)
  if (filters.status) search.set('status', filters.status)
  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)

  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function buildMedicalOrderQuery(
  filters: MedicalOrderFilters,
  page: PageParams,
): string {
  const search = new URLSearchParams()

  if (filters.q) search.set('q', filters.q)
  if (filters.status) search.set('status', filters.status)
  if (filters.type) search.set('type', filters.type)
  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)

  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function buildActivityQuery(
  filters: DoctorActivityFilters,
  page: PageParams,
): string {
  const search = new URLSearchParams()

  if (filters.from) search.set('from', filters.from)
  if (filters.to) search.set('to', filters.to)

  if (page.limit !== undefined) search.set('limit', String(page.limit))
  if (page.offset !== undefined) search.set('offset', String(page.offset))

  const query = search.toString()

  return query ? `?${query}` : ''
}

export function fetchAdminStats(): Promise<AdminStats> {
  return api.get<AdminStats>('/admin/stats')
}

export function fetchAdminPrescriptions(
  filters: PrescriptionFilters,
  page: PageParams,
): Promise<Paginated<AdminPrescription>> {
  return api.get<Paginated<AdminPrescription>>(
    `/admin/prescriptions${buildPrescriptionQuery(filters, page)}`,
  )
}

export function fetchAdminMedicalOrders(
  filters: MedicalOrderFilters,
  page: PageParams,
): Promise<Paginated<AdminMedicalOrder>> {
  return api.get<Paginated<AdminMedicalOrder>>(
    `/admin/prescriptions/medical-orders${buildMedicalOrderQuery(filters, page)}`,
  )
}

export function fetchDoctorActivity(
  doctorId: number,
  filters: DoctorActivityFilters,
  page: PageParams,
): Promise<Paginated<DoctorActivity>> {
  return api.get<Paginated<DoctorActivity>>(
    `/admin/prescriptions/doctors/${doctorId}/activity${buildActivityQuery(filters, page)}`,
  )
}

export function fetchAuditLogs(
  filters: AuditLogFilters,
  page: PageParams,
): Promise<Paginated<AuditLogEntry>> {
  return api.get<Paginated<AuditLogEntry>>(
    `/admin/audit-logs${buildAuditQuery(filters, page)}`,
  )
}

export function fetchAdminPatients(
  filters: AdminPatientFilters,
  page: PageParams,
): Promise<Paginated<AdminPatient>> {
  return api.get<Paginated<AdminPatient>>(
    `/admin/patients${buildPatientQuery(filters, page)}`,
  )
}

export function fetchAdminDoctors(): Promise<Doctor[]> {
  return api.get<Doctor[]>('/admin/doctors')
}

export function createDoctor(input: DoctorInput): Promise<DoctorCreated> {
  return api.post<DoctorCreated>('/admin/doctors', input)
}

export function updateDoctor(
  id: number,
  input: DoctorUpdateInput,
): Promise<Doctor> {
  return api.patch<Doctor>(`/admin/doctors/${id}`, input)
}

export function setDoctorActive(id: number, active: boolean): Promise<Doctor> {
  const action = active ? 'activate' : 'deactivate'

  return api.post<Doctor>(`/admin/doctors/${id}/${action}`)
}

export function enableDoctorProfile(
  input: DoctorProfileInput,
): Promise<Doctor> {
  return api.post<Doctor>('/admin/me/enable-doctor-profile', input)
}
