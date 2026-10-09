import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getFAQCategories,
  getFAQsByCategory,
  type FAQCategory,
} from '../../data/faqs';
import { SectionHeader, Card } from '../ui';

export interface FAQCta {
  title: string;
  description?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

interface FAQSectionProps {
  title?: string;
  description?: string;
  limit?: number;
  showViewAll?: boolean;
  cta?: FAQCta;
}

const categoryLabels: Record<FAQCategory, string> = {
  general: 'General',
  pacientes: 'Pacientes',
  profesionales: 'Profesionales',
  tecnico: 'Técnico',
  privacidad: 'Privacidad y seguridad',
};

export function FAQSection({
  title = 'Resolvemos tus dudas',
  description = 'Encontrá respuestas a las consultas más comunes sobre consultas virtuales, privacidad y más.',
  limit,
  showViewAll = false,
  cta,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<FAQCategory>('general');
  const categories = getFAQCategories();
  const isLimited = typeof limit === 'number';
  const visibleFAQs = isLimited
    ? getFAQsByCategory(activeCategory).slice(0, limit)
    : getFAQsByCategory(activeCategory);

  return (
    <section id="faq" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Preguntas frecuentes" title={title} description={description} />

        {!isLimited && (
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Categorías de preguntas frecuentes">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setOpenIndex(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
                role="tab"
                aria-selected={activeCategory === category}
                aria-controls={`faq-panel-${category}`}
              >
                {categoryLabels[category]}
              </button>
            ))}
          </div>
        )}

        <div
          id={`faq-panel-${activeCategory}`}
          role={isLimited ? undefined : 'tabpanel'}
          aria-label={isLimited ? undefined : `${categoryLabels[activeCategory]} preguntas`}
          className="mt-8 space-y-4"
        >
          {visibleFAQs.map((faq, index) => (
            <Card key={faq.id} variant="outlined" padding="md" className="bg-white">
              <h3>
                <button
                  type="button"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-2 text-left"
                  aria-expanded={openIndex === index}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <span className="pr-4 font-semibold text-sky-900">{faq.question}</span>
                  <svg
                    className={`h-5 w-5 flex-shrink-0 text-sky-600 transition-transform ${
                      openIndex === index ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </h3>
              <div
                id={`faq-answer-${faq.id}`}
                role="region"
                aria-hidden={openIndex !== index}
                className={`animate-slide-down mt-4 border-t border-slate-100 pt-4 ${
                  openIndex === index ? 'block' : 'hidden'
                }`}
              >
                <p className="leading-relaxed text-slate-600">{faq.answer}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          {showViewAll && (
            <Link
              to="/faq"
              className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700"
            >
              Ver todas las preguntas
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
          <p className={showViewAll ? 'mt-8 text-slate-600' : 'text-slate-600'}>
            ¿No encontraste tu respuesta?{' '}
            <Link to="/contact" className="font-semibold text-sky-600 hover:text-sky-700">
              Contactanos
            </Link>
          </p>
        </div>

        {cta && (
          <div className="mt-12 rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
            <h3 className="text-2xl font-bold text-sky-900 sm:text-3xl">{cta.title}</h3>
            {cta.description && <p className="mt-3 text-lg leading-relaxed text-slate-600">{cta.description}</p>}
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                to={cta.primaryHref}
                className="rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700"
              >
                {cta.primaryLabel}
              </Link>
              {cta.secondaryLabel && cta.secondaryHref && (
                <Link
                  to={cta.secondaryHref}
                  className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
                >
                  {cta.secondaryLabel}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}