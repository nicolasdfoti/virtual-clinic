import { Link } from 'react-router-dom';
import { securityFeatures } from '../../data/values';
import { SectionHeader, Card } from '../ui';

export function SecuritySection() {
  return (
    <section id="seguridad" className="bg-slate-950 py-16 text-white sm:py-24">
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
              className="h-full border-slate-800 bg-slate-900 hover:border-sky-700/50"
            >
              <div className="mb-3 text-3xl" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-2 text-slate-300">{feature.description}</p>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold">¿Tenés dudas sobre tu privacidad?</h3>
              <p className="mt-1 text-slate-400">
                Escribinos y te respondemos cómo se maneja la información de tu consulta.
              </p>
            </div>
            <Link
              to="/contact"
              className="flex-shrink-0 rounded-full bg-sky-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-sky-700"
            >
              Contactar al equipo
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
