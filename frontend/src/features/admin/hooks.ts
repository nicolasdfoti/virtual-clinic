import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PageParams } from '../../services/api'
import {
  createDoctor,
  enableDoctorProfile,
  fetchAdminDoctors,
  fetchAdminMedicalOrders,
  fetchAdminPatients,
  fetchAdminPrescriptions,
  fetchAdminStats,
  fetchAuditLogs,
  fetchDoctorActivity,
  setDoctorActive,
  updateDoctor,
} from './api'
import type {
  AdminPatientFilters,
  AuditLogFilters,
  DoctorActivityFilters,
  DoctorInput,
  DoctorProfileInput,
  DoctorUpdateInput,
  MedicalOrderFilters,
  PrescriptionFilters,
} from './types'

export const adminStatsKey = ['admin', 'stats'] as const
export const adminDoctorsKey = ['admin', 'doctors'] as const
export const adminPatientsKey = (
  filters: AdminPatientFilters,
  page: PageParams,
) => ['admin', 'patients', filters, page] as const
export const adminAuditKey = (filters: AuditLogFilters, page: PageParams) =>
  ['admin', 'audit', filters, page] as const
export const adminPrescriptionsKey = (
  filters: PrescriptionFilters,
  page: PageParams,
) => ['admin', 'prescriptions', filters, page] as const
export const adminMedicalOrdersKey = (
  filters: MedicalOrderFilters,
  page: PageParams,
) => ['admin', 'medical-orders', filters, page] as const
export const doctorActivityKey = (
  doctorId: number,
  filters: DoctorActivityFilters,
  page: PageParams,
) => ['admin', 'doctor-activity', doctorId, filters, page] as const

export function useAdminStats() {
  return useQuery({ queryKey: adminStatsKey, queryFn: fetchAdminStats })
}

export function useAdminDoctors() {
  return useQuery({ queryKey: adminDoctorsKey, queryFn: fetchAdminDoctors })
}

export function useAdminPatients(
  filters: AdminPatientFilters,
  page: PageParams,
) {
  return useQuery({
    queryKey: adminPatientsKey(filters, page),
    queryFn: () => fetchAdminPatients(filters, page),
  })
}

export function useAuditLogs(filters: AuditLogFilters, page: PageParams) {
  return useQuery({
    queryKey: adminAuditKey(filters, page),
    queryFn: () => fetchAuditLogs(filters, page),
  })
}

export function useAdminPrescriptions(
  filters: PrescriptionFilters,
  page: PageParams,
) {
  return useQuery({
    queryKey: adminPrescriptionsKey(filters, page),
    queryFn: () => fetchAdminPrescriptions(filters, page),
  })
}

export function useAdminMedicalOrders(
  filters: MedicalOrderFilters,
  page: PageParams,
) {
  return useQuery({
    queryKey: adminMedicalOrdersKey(filters, page),
    queryFn: () => fetchAdminMedicalOrders(filters, page),
  })
}

export function useDoctorActivity(
  doctorId: number | undefined,
  filters: DoctorActivityFilters,
  page: PageParams,
) {
  return useQuery({
    queryKey: doctorActivityKey(doctorId ?? 0, filters, page),
    queryFn: () => fetchDoctorActivity(doctorId as number, filters, page),
    enabled: doctorId !== undefined,
  })
}

export function useCreateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DoctorInput) => createDoctor(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDoctorsKey })
      void queryClient.invalidateQueries({ queryKey: adminStatsKey })
    },
  })
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: number
      input: DoctorUpdateInput
    }) => updateDoctor(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDoctorsKey })
    },
  })
}

export function useSetDoctorActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      setDoctorActive(id, active),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDoctorsKey })
      void queryClient.invalidateQueries({ queryKey: adminStatsKey })
    },
  })
}

export function useEnableDoctorProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: DoctorProfileInput) => enableDoctorProfile(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminDoctorsKey })
      void queryClient.invalidateQueries({ queryKey: adminStatsKey })
    },
  })
}
