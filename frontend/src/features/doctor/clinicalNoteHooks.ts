import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PageParams } from '../../services/api'

import { clinicalNoteApi, doctorPatientFileApi } from './clinicalNoteApi'
import type { ClinicalNoteCreate, ClinicalNoteAmend } from './clinicalNoteTypes'

export const doctorClinicalNotesKey = (patientId: number, page: PageParams) =>
  ['doctor', 'clinical-notes', patientId, page] as const

export const doctorPatientFilesKey = (patientId: number, page: PageParams) =>
  ['doctor', 'patient-files', patientId, page] as const

export function useClinicalNotes(patientId: number, page: PageParams = {}) {
  return useQuery({
    queryKey: doctorClinicalNotesKey(patientId, page),
    queryFn: () => clinicalNoteApi.list(patientId, page),
    enabled: patientId > 0,
  })
}

export function useCreateClinicalNote(patientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: ClinicalNoteCreate) => clinicalNoteApi.create(patientId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'clinical-notes', patientId] })
    },
  })
}

export function useAmendClinicalNote(patientId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ noteId, payload }: { noteId: number; payload: ClinicalNoteAmend }) =>
      clinicalNoteApi.amend(patientId, noteId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'clinical-notes', patientId] })
    },
  })
}

export function useDoctorPatientFiles(patientId: number, page: PageParams = {}) {
  return useQuery({
    queryKey: doctorPatientFilesKey(patientId, page),
    queryFn: () => doctorPatientFileApi.list(patientId, page),
    enabled: patientId > 0,
  })
}