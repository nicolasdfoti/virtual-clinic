import { api, toPageQuery, type PageParams, type Paginated } from '../../services/api'
import type { MedicalOrder, Prescription, PrescriptionStatus } from './types'

export const prescriptionApi = {
  getMyPrescriptions: (
    params: PageParams & { status?: PrescriptionStatus } = {},
  ): Promise<Paginated<Prescription>> => {
    const query = new URLSearchParams()
    const page = toPageQuery(params)

    if (page) {
      for (const [key, value] of new URLSearchParams(page)) {
        query.set(key, value)
      }
    }

    if (params.status) {
      query.set('status', params.status)
    }

    const qs = query.toString()

    return api.get<Paginated<Prescription>>(`/prescriptions${qs ? `?${qs}` : ''}`)
  },

  getMyOrders: (params: PageParams = {}): Promise<Paginated<MedicalOrder>> =>
    api.get<Paginated<MedicalOrder>>(`/prescriptions/orders${toPageQuery(params)}`),
}
