import { useState } from 'react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { PORTAL_NAV } from '../../config/portalNav'
import { ProfileMenu } from './ProfileMenu'

const linkBase =
  'rounded-lg px-3 py-2 text-sm font-medium transition-colors'

function linkClasses(isActive: boolean): string {
  return `${linkBase} ${
    isActive
      ? 'bg-sky-50 text-sky-700'
      : 'text-slate-600 hover:bg-sky-50 hover:text-sky-700'
  }`
}

/** Navegacion de la barra privada, por rol. En movil es colapsable. */
export function PortalNav() {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  if (!user) {
    return null
  }

  const items = PORTAL_NAV[user.role]

  return (
    <>
      <nav
        className="hidden items-center gap-1 md:flex"
        aria-label="Navegación del portal"
      >
        {items.map((item, index) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={index === 0}
            className={({ isActive }) => linkClasses(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="hidden md:block">
        <ProfileMenu />
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <ProfileMenu />

        <button
          type="button"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          aria-controls="portal-mobile-menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <nav
          id="portal-mobile-menu"
          className="absolute inset-x-0 top-full border-t border-slate-200 bg-white p-4 shadow-lg md:hidden"
          aria-label="Navegación del portal"
        >
          <div className="space-y-1">
            {items.map((item, index) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={index === 0}
                onClick={() => setIsMenuOpen(false)}
                className={({ isActive }) =>
                  `block ${linkClasses(isActive)}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      )}
    </>
  )
}
