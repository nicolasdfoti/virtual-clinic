import { patientFeatures } from '../../data/howItWorks';
import { SectionHeader, Card } from '../ui';

export function BenefitsSection() {
  return (
    <section id="beneficios" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Beneficios"
          title="¿Por qué usar Clínica Virtual?"
          description="Todo lo que la plataforma resuelve para agendar y gestionar una consulta a distancia."
        />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {patientFeatures.map((benefit) => (
            <li key={benefit.id} className="h-full">
              <Card variant="outlined" padding="lg" hover className="h-full">
                <span
                  className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-2xl"
                  aria-hidden="true"
                >
                  {benefit.icon}
                </span>
                <h3 className="font-bold text-sky-900">{benefit.title}</h3>
                <p className="mt-2 text-slate-600">{benefit.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
