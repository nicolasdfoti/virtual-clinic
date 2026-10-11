export type AppNotification = {
  id: number
  type: string
  title: string
  message: string
  related_type: string | null
  related_id: number | null
  is_read: boolean
  created_at: string
}

export type UnreadCount = {
  unread: number
}

export type NotificationListParams = {
  limit?: number
  onlyUnread?: boolean
}
