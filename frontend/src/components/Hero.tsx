import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const heroFacts = [
  'Consultas por videollamada desde el navegador',
  'Recetas y órdenes de estudios en tu portal',
  'Sin instalar aplicaciones',
  'Registro de pacientes online',
];

function HeroFacts() {
  return (
    <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3" role="list">
      {heroFacts.map((fact) => (
        <li key={fact} className="flex items-center gap-2 text-sm font-medium text-slate-600">
          <svg
            className="h-5 w-5 flex-shrink-0 text-sky-500"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          {fact}
        </li>
      ))}
    </ul>
  );
}

/** Ilustración local en SVG: evita imágenes remotas. */
function HeroIllustration() {
  return (
    <svg
      className="h-[420px] w-full lg:h-[500px]"
      viewBox="0 0 440 500"
      fill="none"
      role="img"
      aria-label="Ilustración de una consulta médica por videollamada"
    >
      <defs>
        <linearGradient id="hero-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e0f2fe" />
          <stop offset="0.55" stopColor="#f0f9ff" />
          <stop offset="1" stopColor="#ccfbf1" />
        </linearGradient>
        <linearGradient id="hero-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0284c7" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
      </defs>

      <rect width="440" height="500" rx="32" fill="url(#hero-bg)" />
      <circle cx="392" cy="64" r="120" fill="#fde68a" opacity="0.25" />
      <circle cx="40" cy="448" r="112" fill="#a7f3d0" opacity="0.35" />

      {/* Tarjeta paciente */}
      <g>
        <rect x="52" y="84" width="178" height="214" rx="24" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="141" cy="140" r="34" fill="#e0f2fe" stroke="#bae6fd" strokeWidth="2" />
        <path d="M141 126v28m-14-14h28" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
        <rect x="122" y="192" width="38" height="6" rx="3" fill="#bae6fd" />
        <rect x="84" y="212" width="114" height="10" rx="5" fill="#e2e8f0" />
        <rect x="100" y="234" width="82" height="8" rx="4" fill="#f1f5f9" />
        <rect x="100" y="252" width="98" height="8" rx="4" fill="#f1f5f9" />
        <path d="M74 156h-22a12 12 0 00-12 12v28a12 12 0 0012 12h22" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" fill="none" />
        <path d="M62 166v36m-9-18h18" stroke="#0284c7" strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* Tarjeta profesional */}
      <g>
        <rect x="212" y="196" width="178" height="214" rx="24" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
        <circle cx="301" cy="252" r="34" fill="#ccfbf1" stroke="#99f6e4" strokeWidth="2" />
        <circle cx="301" cy="244" r="11" fill="#0d9488" />
        <path d="M301 258c-8 0-14-6-14-14 8 0 14 6 14 14zm0 0c0-8 6-14 14-14 0 8-6 14-14 14z" fill="#0d9488" />
        <rect x="282" y="304" width="38" height="6" rx="3" fill="#99f6e4" />
        <rect x="244" y="324" width="114" height="10" rx="5" fill="#e2e8f0" />
        <rect x="260" y="346" width="82" height="8" rx="4" fill="#f1f5f9" />
        <rect x="260" y="364" width="98" height="8" rx="4" fill="#f1f5f9" />
      </g>

      {/* Etiqueta de videollamada */}
      <g>
        <rect x="128" y="322" width="184" height="46" rx="23" fill="url(#hero-accent)" />
        <circle cx="158" cy="345" r="6" fill="#ffffff" />
        <circle cx="158" cy="345" r="3" fill="#22d3ee" />
        <path
          d="M176 345h18m-4-4l4 4-4 4"
          stroke="#ffffff"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text x="216" y="349" fill="#ffffff" fontSize="14" fontWeight="600" fontFamily="inherit">
          Videollamada...
        </text>
      </g>

      {/* Línea de pulso */}
      <path
        d="M96 438c40 0 24-34 64-34s24 34 64 34 24-34 64-34 24 34 64 34"
        stroke="#0d9488"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.55"
      />
    </svg>
  );
}

function Hero() {
  const { user } = useAuth();

  return (
    <section id="inicio" className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-semibold text-sky-600">Atención médica online</p>

            <h1 className="text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
              Tu salud,
              <span className="text-sky-600"> estés donde estés.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Clínica Virtual es una plataforma de telemedicina que conecta pacientes con
              profesionales de la salud para consultas por videollamada, sin traslados.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to={user ? '/app' : '/register'}
                className="rounded-full bg-sky-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg transition hover:bg-sky-700"
              >
                Sacá un turno
              </Link>

              <Link
                to="/professionals"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
              >
                Conocé a tu médico
              </Link>
            </div>

            <HeroFacts />
          </div>

          <div className="relative">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;