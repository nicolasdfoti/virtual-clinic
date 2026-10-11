import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { notificationApi } from './api'
import type { NotificationListParams } from './types'

/** Polling suave: los avisos se refrescan solos cada 30 segundos. */
const REFETCH_INTERVAL = 30_000

export function useNotifications(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: ['notifications', 'list', params],
    queryFn: () => notificationApi.list(params),
    staleTime: 15_000,
    refetchInterval: REFETCH_INTERVAL,
  })
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.unreadCount,
    staleTime: 15_000,
    refetchInterval: REFETCH_INTERVAL,
  })
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient()

  return () => {
    queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications()

  return useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: invalidate,
  })
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications()

  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: invalidate,
  })
}
