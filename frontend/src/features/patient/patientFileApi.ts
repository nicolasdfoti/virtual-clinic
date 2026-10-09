import { api, toPageQuery, type PageParams } from '../../services/api'
import type { PatientFile, PatientFileListResponse } from '../doctor/patientFileTypes'

export const patientFileApi = {
  upload: (file: File): Promise<PatientFile> => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<PatientFile>('/patients/me/files', formData)
  },

  list: (params: PageParams = {}): Promise<PatientFileListResponse> =>
    api.get<PatientFileListResponse>(`/patients/me/files${toPageQuery(params)}`),

  downloadUrl: (fileId: number): string => {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
    return `${base}/patients/me/files/${fileId}/download`
  },
}