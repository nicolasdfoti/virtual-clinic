import { howItWorksSteps } from '../../data/howItWorks';
import { SectionHeader } from '../ui';

interface HowItWorksSectionProps {
  title?: string;
  description?: string;
}

export function HowItWorksSection({
  title = 'Tu consulta médica en 5 pasos simples',
  description = 'Diseñamos el proceso para que sea intuitivo, rápido y sin complicaciones.',
}: HowItWorksSectionProps) {
  return (
    <section id="como-funciona" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Cómo funciona" title={title} description={description} />

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {howItWorksSteps.map((step) => (
            <li key={step.id} className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-sm">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-200 text-xl font-bold text-sky-600"
                aria-hidden="true"
              >
                {step.number}
              </span>
              <div className="mt-4 flex items-center gap-2">
                <span aria-hidden="true">{step.icon}</span>
                <h3 className="font-bold text-sky-900">{step.title}</h3>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
              <ul className="mt-4 space-y-2" role="list">
                {step.details.map((detail) => (
                  <li key={detail} className="flex items-start gap-2 text-sm text-slate-600">
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-sky-500"
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
                    {detail}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
