import { Link } from 'react-router-dom';

const footerSections = [
  {
    title: 'Clínica',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Sobre nosotros', href: '/about' },
      { label: 'Especialidades', href: '/specialties' },
      { label: 'Profesionales', href: '/professionals' },
      { label: 'Contacto', href: '/contact' },
    ],
  },
  {
    title: 'Pacientes',
    links: [
      { label: 'Buscar profesionales', href: '/professionals' },
      { label: 'Ver especialidades', href: '/specialties' },
      { label: 'Experiencia para pacientes', href: '/patients' },
      { label: 'Iniciar sesión', href: '/login' },
      { label: 'Crear cuenta', href: '/register' },
    ],
  },
  {
    title: 'Nosotros',
    links: [
      { label: 'Sobre nosotros', href: '/about' },
      { label: 'Nuestro equipo', href: '/about#equipo' },
      { label: 'Valores', href: '/about#valores' },
      { label: 'Preguntas frecuentes', href: '/faq' },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2" aria-label="Clínica Virtual - Inicio">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-xl font-bold text-white" aria-hidden="true">
                +
              </span>
              <span className="text-xl font-bold text-white">
                Clínica<span className="text-sky-400">Virtual</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Plataforma de telemedicina que conecta pacientes con profesionales de la salud
              para consultas por videollamada o chat.
            </p>
          </div>

          {footerSections.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className="font-semibold text-white">{section.title}</h2>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link to={link.href} className="text-sm text-slate-400 transition-colors hover:text-sky-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Clínica Virtual. Todos los derechos reservados.</p>
          <p>Las consultas virtuales no reemplazan la atención de emergencias.</p>
        </div>
      </div>
    </footer>
  );
}
