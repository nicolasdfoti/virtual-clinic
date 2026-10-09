import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { appointmentApi } from './api'
import type { BookAppointmentRequest, CancelAppointmentRequest } from './types'

export function useDoctorSlots(doctorId: number | null, from: string, to: string) {
  return useQuery({
    queryKey: ['slots', doctorId, from, to],
    queryFn: () => appointmentApi.getSlots(doctorId!, from, to),
    enabled: !!doctorId && !!from && !!to,
    staleTime: 30_000,
  })
}

export function useMyAppointments() {
  return useQuery({
    queryKey: ['my-appointments'],
    queryFn: appointmentApi.getMine,
    staleTime: 30_000,
  })
}

export function useBookAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: BookAppointmentRequest) => appointmentApi.book(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useCancelAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelAppointmentRequest }) =>
      appointmentApi.cancel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => appointmentApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}

export function useNoShowAppointment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => appointmentApi.noShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['slots'] })
    },
  })
}