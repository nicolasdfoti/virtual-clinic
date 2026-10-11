import { useEffect, useRef, useState } from 'react'

import { formatDateTime } from '../../lib/format'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from './hooks'

const MAX_BADGE = 9

/** Campana con contador de avisos sin leer y su panel desplegable. */
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const unreadQuery = useUnreadCount()
  const listQuery = useNotifications({ limit: 10 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const unread = unreadQuery.data?.unread ?? 0
  const notifications = listQuery.data ?? []

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="relative rounded-full p-2 text-slate-600 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={
          unread > 0
            ? `Notificaciones (${unread} sin leer)`
            : 'Notificaciones'
        }
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
          />
        </svg>

        {unread > 0 && (
          <span
            data-testid="notification-badge"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white"
          >
            {unread > MAX_BADGE ? `${MAX_BADGE}+` : unread}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-sky-900">Notificaciones</p>

            {unread > 0 && (
              <button
                type="button"
                onClick={() => markAllRead.mutate()}
                className="text-xs font-medium text-sky-600 hover:text-sky-700"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              No tenés notificaciones.
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      if (!notification.is_read) {
                        markRead.mutate(notification.id)
                      }
                    }}
                    className="flex w-full items-start gap-2 px-4 py-3 text-left transition-colors hover:bg-sky-50"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        notification.is_read ? 'bg-transparent' : 'bg-sky-500'
                      }`}
                      aria-hidden="true"
                    />

                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-800">
                        {notification.title}
                      </span>
                      <span className="mt-0.5 block text-sm text-slate-600">
                        {notification.message}
                      </span>
                      <span className="mt-1 block text-xs text-slate-400">
                        {formatDateTime(notification.created_at)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
