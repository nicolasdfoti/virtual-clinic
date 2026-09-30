import { FAQSection } from '../components/sections';
import { Link } from 'react-router-dom';

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
            Encontrá respuestas rápidas a las consultas más comunes sobre nuestra plataforma,
            consultas virtuales, privacidad, pagos y más.
          </p>
        </div>
      </div>
    </section>
  );
}

function FAQCategoriesSection() {
  const categories = [
    { id: 'general', label: 'General', icon: '❓', count: 3 },
    { id: 'pacientes', label: 'Para pacientes', icon: '👤', count: 4 },
    { id: 'profesionales', label: 'Para profesionales', icon: '👨‍⚕️', count: 2 },
    { id: 'tecnico', label: 'Técnico', icon: '💻', count: 2 },
    { id: 'privacidad', label: 'Privacidad y seguridad', icon: '🔒', count: 2 },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href={`#faq-panel-${cat.id}`}
              className="group p-6 rounded-2xl bg-sky-50 border border-sky-100 hover:border-sky-300 hover:shadow-lg transition-all text-center"
            >
              <span className="text-4xl block mb-3" aria-hidden="true">{cat.icon}</span>
              <h3 className="font-bold text-sky-900 group-hover:text-sky-700">{cat.label}</h3>
              <p className="mt-1 text-sm text-sky-600">{cat.count} preguntas</p>
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
          <p className="mt-4 text-lg text-slate-600">Nuestro equipo de soporte está disponible para ayudarte. Respondemos en menos de 24hs hábiles.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
            <Link
              to="/contact"
              className="rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700"
            >
              Contactar soporte
            </Link>
            <a
              href="mailto:hola@saludonline.ar"
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