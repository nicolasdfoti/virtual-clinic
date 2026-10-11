import { api } from '../../services/api'
import type {
  AppNotification,
  NotificationListParams,
  UnreadCount,
} from './types'

export const notificationApi = {
  list: (params: NotificationListParams = {}): Promise<AppNotification[]> => {
    const search = new URLSearchParams()

    if (params.limit !== undefined) {
      search.set('limit', String(params.limit))
    }

    if (params.onlyUnread) {
      search.set('only_unread', 'true')
    }

    const query = search.toString()

    return api.get<AppNotification[]>(
      `/notifications${query ? `?${query}` : ''}`,
    )
  },

  unreadCount: (): Promise<UnreadCount> =>
    api.get<UnreadCount>('/notifications/unread-count'),

  markRead: (id: number): Promise<AppNotification> =>
    api.post<AppNotification>(`/notifications/${id}/read`),

  markAllRead: (): Promise<void> =>
    api.post<void>('/notifications/read-all'),
}
