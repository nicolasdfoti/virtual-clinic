import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const heroFacts = [
  'Consultas por videollamada o presenciales',
  'Recetas y órdenes de estudios en tu portal',
  'Sin instalar aplicaciones',
  'Registro de pacientes online',
];

function HeroFacts() {
  return (
    <ul className="mt-10 grid gap-4 sm:grid-cols-2" role="list">
      {heroFacts.map((fact) => (
        <li key={fact} className="flex items-start gap-3 text-sm font-medium text-slate-600">
          <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-sky-100">
            <svg
              className="h-3.5 w-3.5 text-sky-600"
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
          </div>
          <span className="leading-snug">{fact}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ilustración local en SVG rediseñada: Composición moderna, animaciones suaves y glassmorphism. */
function HeroIllustration() {
  return (
    <div className="relative w-full transition-transform duration-700 hover:scale-[1.02]">
      <svg
        className="h-auto w-full max-w-[500px] mx-auto lg:h-[520px]"
        viewBox="0 0 480 520"
        fill="none"
        role="img"
        aria-label="Ilustración moderna de una videollamada médica"
      >
        <style>{`
          @keyframes float-1 {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
          }
          @keyframes float-2 {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(15px); }
          }
          @keyframes float-3 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(2deg); }
          }
          @keyframes pulse-ring {
            0% { transform: scale(0.8); opacity: 0.5; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          .anim-float-1 { animation: float-1 6s ease-in-out infinite; }
          .anim-float-2 { animation: float-2 7s ease-in-out infinite; }
          .anim-float-3 { animation: float-3 5.5s ease-in-out infinite; }
          .anim-pulse-ring { animation: pulse-ring 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite; transform-origin: center; }
        `}</style>

        <defs>
          {/* Gradientes de fondo y elementos */}
          <linearGradient id="bg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f0f9ff" />
            <stop offset="0.5" stopColor="#e0f2fe" />
            <stop offset="1" stopColor="#ccfbf1" />
          </linearGradient>
          <linearGradient id="doc-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#7dd3fc" />
          </linearGradient>
          <linearGradient id="pat-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#a7f3d0" />
            <stop offset="1" stopColor="#6ee7b7" />
          </linearGradient>
          <linearGradient id="icon-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0284c7" />
            <stop offset="1" stopColor="#0d9488" />
          </linearGradient>

          {/* Filtros de sombra realistas */}
          <filter id="shadow-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0f172a" floodOpacity="0.06" />
          </filter>
          <filter id="shadow-md" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#0f172a" floodOpacity="0.08" />
          </filter>
          <filter id="shadow-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="24" stdDeviation="32" floodColor="#0284c7" floodOpacity="0.12" />
          </filter>
          <filter id="blur-blob" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="40" />
          </filter>
        </defs>

        {/* --- FONDO --- */}
        <rect width="480" height="520" rx="40" fill="url(#bg-grad)" />
        
        {/* Manchas de luz abstractas (Blobs) */}
        <circle cx="100" cy="120" r="140" fill="#38bdf8" opacity="0.25" filter="url(#blur-blob)" />
        <circle cx="380" cy="400" r="160" fill="#2dd4bf" opacity="0.25" filter="url(#blur-blob)" />
        <circle cx="400" cy="100" r="100" fill="#fde047" opacity="0.15" filter="url(#blur-blob)" />

        {/* --- DISPOSITIVO CENTRAL (Tablet/Pantalla) --- */}
        <g filter="url(#shadow-lg)">
          <rect x="60" y="70" width="360" height="380" rx="36" fill="#ffffff" />
          
          {/* Pantalla interna (Doctor) */}
          <rect x="76" y="86" width="328" height="260" rx="24" fill="#f8fafc" />
          
          {/* Avatar Médico (Composición Geométrica) */}
          <g transform="translate(240, 230)">
            <circle cx="0" cy="-60" r="45" fill="url(#doc-grad)" />
            <path d="M-70 70 Q0 -10 70 70 L70 116 L-70 116 Z" fill="url(#doc-grad)" />
            
            {/* Detalle estetoscopio/cruz */}
            <circle cx="0" cy="-60" r="33" fill="#ffffff" opacity="0.3" />
            <rect x="-40" y="30" width="24" height="24" rx="8" fill="#ffffff" />
            <path d="M-30 38 h 4 v 4 h 4 v 4 h-4 v 4 h-4 v-4 h-4 v-4 h 4 z" fill="#0284c7" />
          </g>

          {/* Controles de Videollamada (Abajo central) */}
          <g transform="translate(240, 400)">
            {/* Botón Micrófono */}
            <circle cx="-60" cy="0" r="24" fill="#f1f5f9" />
            <path d="M-64 -6 v 6 c 0 2.2 1.8 4 4 4 s 4 -1.8 4 -4 v -6 c 0 -2.2 -1.8 -4 -4 -4 s -4 1.8 -4 4 z" fill="#64748b" />
            <path d="M-70 0 v 2 c 0 5.5 4.5 10 10 10 s 10 -4.5 10 -10 v -2" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            
            {/* Botón Cámara */}
            <circle cx="0" cy="0" r="24" fill="#f1f5f9" />
            <rect x="-10" y="-8" width="16" height="12" rx="3" stroke="#64748b" strokeWidth="2.5" fill="none" />
            <path d="M 6 -4 l 6 -4 v 12 l -6 -4" fill="#64748b" />

            {/* Botón Colgar (Rojo) */}
            <circle cx="60" cy="0" r="24" fill="#ef4444" />
            <path d="M 50 2 c 0 -4 20 -4 20 0 l 3 3 c 1 1 0 3 -2 2 l -4 -2 c -2 0 -4 0 -6 0 l -4 2 c -2 1 -3 -1 -2 -2 z" fill="#ffffff" />
          </g>
        </g>

        {/* --- VENTANA PIP PACIENTE (Flotante derecha) --- */}
        <g className="anim-float-2">
          <rect x="290" y="240" width="140" height="180" rx="28" fill="#ffffff" filter="url(#shadow-md)" />
          <rect x="302" y="252" width="116" height="156" rx="20" fill="#f1f5f9" />
          
          {/* Avatar Paciente */}
          <g transform="translate(360, 360)">
            <circle cx="0" cy="-40" r="30" fill="url(#pat-grad)" />
            <path d="M-50 48 Q0 -10 50 48 L50 48 L-50 48 Z" fill="url(#pat-grad)" />
          </g>

          {/* Indicador de conexión verde */}
          <circle cx="324" cy="274" r="6" fill="#10b981" />
          <circle cx="324" cy="274" r="6" fill="#10b981" className="anim-pulse-ring" style={{ transformOrigin: '324px 274px' }} />
        </g>

        {/* --- TARJETA MÉTRICA (Flotante izquierda superior) --- */}
        <g className="anim-float-1">
          <rect x="20" y="140" width="160" height="84" rx="24" fill="#ffffff" filter="url(#shadow-sm)" />
          
          {/* Icono Corazón */}
          <rect x="36" y="156" width="44" height="44" rx="14" fill="#fee2e2" />
          <path d="M 58 170 c -3 -3 -8 -3 -11 0 c -3 3 -3 7 0 10 l 11 11 l 11 -11 c 3 -3 3 -7 0 -10 c -3 -3 -8 -3 -11 0 z" fill="#ef4444" />
          
          {/* Mini ECG (Línea de pulso) */}
          <path d="M 94 178 l 10 0 l 6 -12 l 8 22 l 6 -10 l 16 0" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <rect x="94" y="196" width="40" height="6" rx="3" fill="#cbd5e1" />
        </g>

        {/* --- NOTIFICACIÓN (Flotante izquierda inferior) --- */}
        <g className="anim-float-3" style={{ animationDelay: '1s' }}>
          <rect x="10" y="360" width="220" height="72" rx="36" fill="#ffffff" filter="url(#shadow-md)" />
          
          {/* Círculo Check */}
          <circle cx="46" cy="396" r="20" fill="url(#icon-grad)" />
          <path d="M 38 396 l 5 5 l 10 -10" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          
          {/* Líneas de texto simuladas */}
          <rect x="82" y="382" width="100" height="10" rx="5" fill="#334155" />
          <rect x="82" y="400" width="60" height="8" rx="4" fill="#94a3b8" />
        </g>

        {/* --- ELEMENTOS DECORATIVOS --- */}
        {/* Cruces abstractas flotando */}
        <path d="M 400 200 h 12 M 406 194 v 12" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" opacity="0.6" className="anim-float-1" />
        <path d="M 80 80 h 8 M 84 76 v 8" stroke="#14b8a6" strokeWidth="3" strokeLinecap="round" opacity="0.5" className="anim-float-2" />
      </svg>
    </div>
  );
}

function Hero() {
  const { user } = useAuth();

  return (
    <section 
      id="inicio" 
      className="relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-teal-50 pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-8">
          <div className="max-w-2xl">
            {/* Eyebrow badge moderno */}
            <div className="mb-6 inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700">
              <span className="flex h-2 w-2 rounded-full bg-sky-500 mr-2 animate-pulse"></span>
              Atención médica online
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Tu salud,
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">
                estés donde estés.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-slate-600 sm:text-xl">
              Clínica Virtual es una plataforma de telemedicina que conecta pacientes con
              profesionales de la salud para consultas por videollamada o presenciales.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                to={user ? '/app' : '/register'}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition-all hover:bg-sky-500 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Sacá un turno
              </Link>

              <Link
                to="/professionals"
                className="inline-flex items-center justify-center rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition-all hover:bg-slate-50 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                Conocé a tu médico
              </Link>
            </div>

            <HeroFacts />
          </div>

          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <HeroIllustration />
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;