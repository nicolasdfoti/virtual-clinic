import { Link, Outlet } from 'react-router-dom'

import { PortalNav } from '../components/portal/PortalNav'
import { clinic } from '../config/clinic'
import { useAuth } from '../context/useAuth'
import { homeForRole } from '../routes/roleHome'

/** Layout del portal privado: header con navegacion por rol, contenido y un
 *  pie minimo con los datos de contacto de la clinica. */
export function AppShell() {
  const { user } = useAuth()
  const home = homeForRole(user?.role)

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="relative z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to={home}
            className="flex flex-shrink-0 items-center gap-2"
            aria-label="Clínica Virtual - Portal"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-600 text-lg font-bold text-white shadow-sm"
              aria-hidden="true"
            >
              +
            </span>
            <span className="hidden text-lg font-bold tracking-tight text-sky-900 sm:block">
              Clínica<span className="text-sky-600">Virtual</span>
            </span>
          </Link>

          <PortalNav />
        </div>
      </header>

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white py-3">
        <p className="mx-auto max-w-7xl px-4 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
          {clinic.name} · {clinic.email} · {clinic.phone}
        </p>
      </footer>
    </div>
  )
}
