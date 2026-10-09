import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PageParams } from '../../services/api'
import {
  fetchDoctorPatient,
  fetchDoctorPatients,
  linkPatient,
} from './api'
import {
  doctorAppointmentApi,
} from './api'
import type { LinkPatientInput } from './types'

export const doctorPatientsKey = (q: string, page: PageParams) =>
  ['doctor', 'patients', q, page] as const

export const doctorPatientKey = (id: number) =>
  ['doctor', 'patient', id] as const

export function useDoctorPatients(q: string, page: PageParams) {
  return useQuery({
    queryKey: doctorPatientsKey(q, page),
    queryFn: () => fetchDoctorPatients(q, page),
  })
}

export function useDoctorPatient(id: number) {
  return useQuery({
    queryKey: doctorPatientKey(id),
    queryFn: () => fetchDoctorPatient(id),
  })
}

export function usePatientPrescriptions(patientId: number) {
  return useQuery({
    queryKey: ['doctor', 'patient', patientId, 'prescriptions'],
    queryFn: () => doctorAppointmentApi.getPrescriptions(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}

export function usePatientOrders(patientId: number) {
  return useQuery({
    queryKey: ['doctor', 'patient', patientId, 'orders'],
    queryFn: () => doctorAppointmentApi.getOrders(patientId),
    enabled: !!patientId,
    staleTime: 30_000,
  })
}

export function useLinkPatient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LinkPatientInput) => linkPatient(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['doctor', 'patients'] })
    },
  })
}

export function useDoctorAppointments() {
  return useQuery({
    queryKey: ['doctor', 'appointments'],
    queryFn: doctorAppointmentApi.getMine,
    staleTime: 30_000,
  })
}

export function useDoctorAvailability() {
  return useQuery({
    queryKey: ['doctor', 'availability'],
    queryFn: doctorAppointmentApi.getAvailability,
    staleTime: 30_000,
  })
}

export function useDoctorTimeOff() {
  return useQuery({
    queryKey: ['doctor', 'time-off'],
    queryFn: doctorAppointmentApi.getTimeOff,
    staleTime: 30_000,
  })
}

export function useCreateAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: doctorAppointmentApi.createAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.deleteAvailability(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'availability'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useCreateTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: doctorAppointmentApi.createTimeOff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'time-off'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useDeleteTimeOff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.deleteTimeOff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'time-off'] })
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => doctorAppointmentApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => doctorAppointmentApi.noShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'appointments'] })
    },
  })
}

export function useCreatePrescription(patientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: import('./types').CreatePrescriptionRequest) => doctorAppointmentApi.createPrescription(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', patientId, 'prescriptions'] })
    },
  })
}

export function useCancelPrescription(patientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ prescriptionId, reason }: { prescriptionId: number; reason: string }) =>
      doctorAppointmentApi.cancelPrescription(patientId, prescriptionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', patientId, 'prescriptions'] })
    },
  })
}

export function useCreateOrder(patientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: import('./types').CreateMedicalOrderRequest) => doctorAppointmentApi.createOrder(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', patientId, 'orders'] })
    },
  })
}

export function useCancelOrder(patientId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: number; reason: string }) =>
      doctorAppointmentApi.cancelOrder(patientId, orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'patient', patientId, 'orders'] })
    },
  })
}
