import { FAQSection } from '../components/sections';
import { Link } from 'react-router-dom';
import { clinic } from '../config/clinic';
import { getFAQsByCategory, type FAQCategory } from '../data/faqs';

function FAQHero() {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-sky-600">Preguntas frecuentes</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
            Resolvemos<br />
            <span className="text-sky-600">tus dudas</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Encontrá respuestas sobre la plataforma, las consultas virtuales y la privacidad.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQCategoriesSection() {
  const categories: { id: FAQCategory; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '❓' },
    { id: 'pacientes', label: 'Para pacientes', icon: '👤' },
    { id: 'profesionales', label: 'Para profesionales', icon: '👨‍⚕️' },
    { id: 'tecnico', label: 'Técnico', icon: '💻' },
    { id: 'privacidad', label: 'Privacidad y seguridad', icon: '🔒' },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#faq-panel-${cat.id}`}
              className="group rounded-2xl border border-sky-100 bg-sky-50 p-6 text-center transition-all hover:border-sky-300 hover:shadow-lg"
            >
              <span className="mb-3 block text-4xl" aria-hidden="true">{cat.icon}</span>
              <h3 className="font-bold text-sky-900 group-hover:text-sky-700">{cat.label}</h3>
              <p className="mt-1 text-sm text-sky-600">{getFAQsByCategory(cat.id).length} preguntas</p>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactCTASection() {
  return (
    <section className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-sky-900">¿No encontraste tu respuesta?</h2>
          <p className="mt-4 text-lg text-slate-600">
            Escribinos y te respondemos por esos mismos canales.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/contact"
              className="rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700"
            >
              Ir a contacto
            </Link>
            <a
              href={`mailto:${clinic.email}`}
              className="rounded-full border border-slate-300 bg-white px-7 py-3.5 font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
            >
              Enviar email
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FAQPage() {
  return (
    <>
      <FAQHero />
      <FAQCategoriesSection />
      <FAQSection />
      <ContactCTASection />
    </>
  );
}

export default FAQPage;