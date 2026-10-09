import { Link } from 'react-router-dom';
import { clinic } from '../config/clinic';

const footerSections = [
  {
    title: 'Clínica',
    links: [
      { label: 'Inicio', href: '/' },
      { label: 'Sobre nosotros', href: '/about' },
      { label: 'Profesionales', href: '/professionals' },
      { label: 'Preguntas frecuentes', href: '/faq' },
      { label: 'Contacto', href: '/contact' },
    ],
  },
  {
    title: 'Cuenta',
    links: [
      { label: 'Iniciar sesión', href: '/login' },
      { label: 'Crear cuenta', href: '/register' },
    ],
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
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
              para consultas por videollamada desde el navegador.
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
          <p>© {currentYear} {clinic.name}. Todos los derechos reservados.</p>
          <nav className="flex flex-wrap gap-4" aria-label="Legal">
            <Link to="/terminos" className="transition-colors hover:text-sky-400">
              Términos y condiciones
            </Link>
            <Link to="/privacidad" className="transition-colors hover:text-sky-400">
              Política de privacidad
            </Link>
          </nav>
        </div>

        <p className="mt-4 text-xs text-slate-600">
          Las consultas virtuales no reemplazan la atención de emergencias.
        </p>
      </div>
    </footer>
  );
}