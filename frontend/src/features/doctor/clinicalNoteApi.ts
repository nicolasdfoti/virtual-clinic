import { api, toPageQuery, type PageParams } from '../../services/api'
import type { ClinicalNote, ClinicalNoteCreate, ClinicalNoteAmend, ClinicalNoteListResponse } from './clinicalNoteTypes'
import type { PatientFileListResponse } from './patientFileTypes'

export const clinicalNoteApi = {
  create: (
    patientId: number,
    payload: ClinicalNoteCreate,
  ): Promise<ClinicalNote> =>
    api.post<ClinicalNote>(`/doctor/patients/${patientId}/clinical-notes`, payload),

  amend: (
    patientId: number,
    noteId: number,
    payload: ClinicalNoteAmend,
  ): Promise<ClinicalNote> =>
    api.post<ClinicalNote>(`/doctor/patients/${patientId}/clinical-notes/${noteId}/amend`, payload),

  list: (
    patientId: number,
    params: PageParams = {},
  ): Promise<ClinicalNoteListResponse> =>
    api.get<ClinicalNoteListResponse>(
      `/doctor/patients/${patientId}/clinical-notes${toPageQuery(params)}`,
    ),
}

export const doctorPatientFileApi = {
  list: (
    patientId: number,
    params: PageParams = {},
  ): Promise<PatientFileListResponse> =>
    api.get<PatientFileListResponse>(
      `/doctor/patients/${patientId}/files${toPageQuery(params)}`,
    ),

  downloadUrl: (patientId: number, fileId: number): string => {
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
    return `${base}/doctor/patients/${patientId}/files/${fileId}/download`
  },
}