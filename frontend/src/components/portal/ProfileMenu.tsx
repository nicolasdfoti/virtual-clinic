import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { Avatar } from '../ui'

/** Avatar con menu de cuenta. Cierra con click afuera y con Escape. */
export function ProfileMenu() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

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

  if (!user) {
    return null
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim()

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex items-center gap-2 rounded-full p-1 pr-3 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Menú de cuenta"
      >
        <Avatar name={fullName} size="sm" />
        <span className="hidden text-sm font-medium text-slate-700 sm:block">
          {user.first_name}
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
        >
          <div className="border-b border-slate-100 px-4 pb-2">
            <p className="truncate text-sm font-semibold text-sky-900">{fullName}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {user.role === 'PATIENT' && (
            <Link
              to="/app/perfil"
              role="menuitem"
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
            >
              Mi perfil
            </Link>
          )}

          <Link
            to="/app/cambiar-contrasena"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
          >
            Cambiar contraseña
          </Link>

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setIsOpen(false)
              void logout()
            }}
            className="block w-full px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-sky-50 hover:text-sky-700"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
