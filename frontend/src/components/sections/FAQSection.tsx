import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getFAQCategories, getFAQsByCategory } from '../../data/faqs';
import { SectionHeader, Card } from '../ui';

type CategoryId = ReturnType<typeof getFAQCategories>[0]['id'];

interface FAQSectionProps {
  title?: string;
  description?: string;
  limit?: number;
  showViewAll?: boolean;
}

export function FAQSection({
  title = 'Resolvemos tus dudas',
  description = 'Encontrá respuestas a las consultas más comunes sobre consultas virtuales, privacidad y más.',
  limit,
  showViewAll = false,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('general');
  const categories = getFAQCategories();
  const isLimited = typeof limit === 'number';
  const visibleFAQs = isLimited ? getFAQsByCategory(activeCategory).slice(0, limit) : getFAQsByCategory(activeCategory);

  return (
    <section id="faq" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Preguntas frecuentes" title={title} description={description} />

        {!isLimited && (
          <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Categorías de preguntas frecuentes">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setOpenIndex(null);
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-sky-50 hover:text-sky-700'
                }`}
                role="tab"
                aria-selected={activeCategory === category.id}
                aria-controls={`faq-panel-${category.id}`}
              >
                {category.label}
              </button>
            ))}
          </div>
        )}

        <div
          id={`faq-panel-${activeCategory}`}
          role={isLimited ? undefined : 'tabpanel'}
          aria-label={isLimited ? undefined : `${categories.find((c) => c.id === activeCategory)?.label} preguntas`}
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
                  <span className="font-semibold text-sky-900 pr-4">{faq.question}</span>
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
      </div>
    </section>
  );
}
