import { Link } from 'react-router-dom';
import { securityFeatures } from '../../data/values';
import { SectionHeader, Card } from '../ui';

export function SecuritySection() {
  return (
    <section id="seguridad" className="bg-slate-50 py-16 text-slate-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Seguridad y privacidad"
          title="Cuidamos la confidencialidad de tu consulta"
          description="La consulta es un acto privado. Te contamos de forma simple cómo funciona el manejo de tu información."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature) => (
            <Card
              key={feature.id}
              variant="outlined"
              padding="lg"
              className="flex h-full flex-col border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
            >
              {/* Contenedor del ícono con un fondo celeste/teal muy suave y amigable */}
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-2xl text-sky-600 ring-4 ring-sky-50/50" aria-hidden="true">
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 transition-colors">
                {feature.title}
              </h3>
              
              <p className="mt-2.5 flex-grow text-sm leading-relaxed text-slate-600">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Bloque CTA rediseñado con fondo claro y un degradado sutil */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-6 sm:p-10 shadow-sm relative">
          {/* Detalles decorativos de fondo que aportan dinamismo y profesionalismo */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-100/45 blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-teal-50/45 blur-2xl pointer-events-none" />
          
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h3 className="text-xl font-bold text-slate-900">¿Tenés dudas sobre tu privacidad?</h3>
              <p className="mt-2 text-sm md:text-base leading-relaxed text-slate-600">
                Escribinos y te respondemos cómo se maneja la información de tu consulta. Tu tranquilidad es nuestra prioridad.
              </p>
            </div>
            
            <Link
              to="/contact"
              className="flex-shrink-0 inline-flex items-center justify-center rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-sm transition-all hover:bg-sky-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Contactar al equipo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}