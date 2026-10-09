import { howItWorksSteps } from '../../data/howItWorks';
import { SectionHeader } from '../ui';

interface HowItWorksSectionProps {
  title?: string;
  description?: string;
}

export function HowItWorksSection({
  title = 'Tu consulta médica en 3 pasos',
  description = 'Un proceso simple para cuidar tu salud a distancia.',
}: HowItWorksSectionProps) {
  return (
    <section id="como-funciona" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Cómo funciona" title={title} description={description} />

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {howItWorksSteps.map((step) => (
            <li key={step.id} className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-200 text-xl font-bold text-sky-600"
                  aria-hidden="true"
                >
                  {step.number}
                </span>
                <span className="text-3xl" aria-hidden="true">
                  {step.icon}
                </span>
              </div>
              <h3 className="mt-4 font-bold text-sky-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}