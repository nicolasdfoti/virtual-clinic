import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';

type NavItem = {
  label: string;
  href: string;
  children?: NavItem[];
};

const publicNavItems: NavItem[] = [
  { label: 'Inicio', href: '/' },
  {
    label: 'Nosotros',
    href: '/about',
    children: [
      { label: 'Sobre nosotros', href: '/about' },
      { label: 'Preguntas frecuentes', href: '/faq' },
    ],
  },
  { label: 'Especialidades', href: '/specialties' },
  { label: 'Profesionales', href: '/professionals' },
  { label: 'Contacto', href: '/contact' },
];

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeAll = useCallback(() => {
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }, []);

  const currentLocation = `${location.pathname}${location.search}`;
  const [lastLocation, setLastLocation] = useState(currentLocation);

  if (lastLocation !== currentLocation) {
    setLastLocation(currentLocation);
    setOpenDropdown(null);
    setIsMenuOpen(false);
  }

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        closeAll();
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [closeAll]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAll();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeAll]);

  const isActive = (href: string) =>
    href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 z-50 w-full border-b border-slate-200 transition-all duration-200 ${
        isScrolled ? 'bg-white/95 shadow-sm backdrop-blur-sm' : 'bg-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2" aria-label="SaludOnline - Inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-xl font-bold text-white shadow-md" aria-hidden="true">
              +
            </span>
            <span className="hidden text-2xl font-bold tracking-tight text-sky-900 sm:block">
              Salud<span className="text-sky-600">Online</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
            {publicNavItems.map((item) =>
              item.children ? (
                <DropdownNavItem
                  key={item.href}
                  item={item}
                  isActive={item.children.some((child) => isActive(child.href))}
                  openDropdown={openDropdown}
                  setOpenDropdown={setOpenDropdown}
                />
              ) : (
                <NavLink
                  key={item.href}
                  to={item.href}
                  className={({ isActive: active }) =>
                    `rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              )
            )}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <NavLink
              to="/login"
              className={({ isActive: active }) =>
                `rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'bg-sky-50 text-sky-700' : 'text-sky-600 hover:bg-sky-50'
                }`
              }
            >
              Iniciar sesión
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-full bg-sky-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-colors hover:bg-sky-700"
            >
              Registrarse
            </NavLink>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMenuOpen ? (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {isMenuOpen && (
          <div id="mobile-menu" className="animate-slide-down border-t border-slate-200 bg-white lg:hidden">
            <nav className="space-y-1 px-4 py-4" aria-label="Menú móvil">
              {publicNavItems.map((item) =>
                item.children ? (
                  <MobileNavGroup
                    key={item.href}
                    item={item}
                    openDropdown={openDropdown}
                    setOpenDropdown={setOpenDropdown}
                  />
                ) : (
                  <MobileNavLink key={item.href} item={item} onNavigate={closeAll} />
                )
              )}
              <div className="space-y-2 border-t border-slate-200 pt-4">
                <NavLink
                  to="/login"
                  onClick={closeAll}
                  className="block rounded-lg px-3 py-3 text-center text-base font-medium text-sky-600 hover:bg-sky-50"
                >
                  Iniciar sesión
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeAll}
                  className="block rounded-lg bg-sky-600 px-3 py-3 text-center text-base font-medium text-white hover:bg-sky-700"
                >
                  Registrarse
                </NavLink>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

interface DropdownNavItemProps {
  item: NavItem;
  isActive: boolean;
  openDropdown: string | null;
  setOpenDropdown: (href: string | null) => void;
}

/**
 * El panel se monta como hijo del mismo contenedor que el trigger y su área de
 * hover incluye el padding superior: no hay "gap" por el que el puntero pueda
 * escapar, así que `mouseleave` nunca se dispara al traverse del trigger al menú.
 */
function DropdownNavItem({ item, isActive, openDropdown, setOpenDropdown }: DropdownNavItemProps) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isOpen = openDropdown === item.href;

  const close = (restoreFocus = false) => {
    setOpenDropdown(null);
    if (restoreFocus) triggerRef.current?.focus();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpenDropdown(item.href);
    } else if (event.key === 'Escape' && isOpen) {
      event.preventDefault();
      close();
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpenDropdown(item.href)}
      onMouseLeave={() => setOpenDropdown(null)}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpenDropdown(isOpen ? null : item.href)}
        onKeyDown={handleTriggerKeyDown}
        className={`flex items-center gap-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive || isOpen ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
        }`}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {item.label}
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div
          id={panelId}
          className="absolute left-0 top-full w-60 pt-2"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close(true);
            }
          }}
        >
          <div role="menu" className="animate-fade-in rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
            {item.children?.map((child) => (
              <Link
                key={child.href}
                to={child.href}
                role="menuitem"
                onClick={() => close()}
                className="block px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface MobileNavGroupProps {
  item: NavItem;
  openDropdown: string | null;
  setOpenDropdown: (href: string | null) => void;
}

function MobileNavGroup({ item, openDropdown, setOpenDropdown }: MobileNavGroupProps) {
  const panelId = useId();
  const isOpen = openDropdown === item.href;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpenDropdown(isOpen ? null : item.href)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-base font-medium text-slate-600 transition-colors hover:bg-sky-50 hover:text-sky-600"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        {item.label}
        <svg
          className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div id={panelId} className="animate-slide-down ml-3 space-y-1 border-l-2 border-sky-200 pl-3">
          {item.children?.map((child) => (
            <MobileNavLink key={child.href} item={child} onNavigate={() => setOpenDropdown(null)} nested />
          ))}
        </div>
      )}
    </div>
  );
}

function MobileNavLink({ item, onNavigate, nested = false }: { item: NavItem; onNavigate: () => void; nested?: boolean }) {
  return (
    <NavLink
      to={item.href}
      onClick={onNavigate}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-3 text-base font-medium transition-colors ${nested ? 'text-sm' : ''} ${
          isActive ? 'bg-sky-50 text-sky-600' : 'text-slate-600 hover:bg-sky-50 hover:text-sky-600'
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}
