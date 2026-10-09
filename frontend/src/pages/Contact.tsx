import { clinic } from '../config/clinic';
import { getFAQsByCategory } from '../data/faqs';
import { SectionHeader, Card } from '../components/ui';
import { Link } from 'react-router-dom';

function ContactHero() {
  return (
    <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-teal-900 pt-10 pb-16 sm:pt-14 sm:pb-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-teal-300">Contacto</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Estamos acá<br />
            <span className="text-teal-300">para escucharte</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-sky-100">
            Escribinos ante cualquier duda o sugerencia, y te respondemos por esos mismos canales.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactChannelsSection() {
  const channels = [
    {
      icon: '📧',
      title: 'Email',
      value: clinic.email,
      href: `mailto:${clinic.email}`,
      external: false,
      description: 'Para consultas, sugerencias y soporte',
    },
    {
      icon: '📞',
      title: 'Teléfono',
      value: clinic.phone,
      href: `tel:${clinic.phone.replace(/[^\d+]/g, '')}`,
      external: false,
      description: clinic.hours,
    },
    {
      icon: '💬',
      title: 'WhatsApp',
      value: clinic.whatsapp,
      href: `https://wa.me/${clinic.whatsapp.replace(/[^\d]/g, '')}`,
      external: true,
      description: 'Escribinos y te respondemos',
    },
    {
      icon: '📍',
      title: 'Dónde estamos',
      value: clinic.address,
      href: null as string | null,
      external: false,
      description: 'Solo correspondencia',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Canales de contacto"
          description="Elegí el canal que más te convenga. Para urgencias médicas, llamá al 107 (CABA) o 911."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {channels.map((item) => (
            <Card key={item.title} variant="outlined" padding="lg" className="text-center h-full">
              <span className="block mb-4 text-4xl" aria-hidden="true">{item.icon}</span>
              <h3 className="text-xl font-bold text-sky-900">{item.title}</h3>
              {item.href ? (
                <a
                  href={item.href}
                  className="mt-2 block font-medium text-sky-600 hover:text-sky-700"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                >
                  {item.value}
                </a>
              ) : (
                <p className="mt-2 font-medium text-slate-600">{item.value}</p>
              )}
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/** El formulario no está conectado a ningún backend (reactiva en Fase 9),
 *  así que mostramos un aviso y los canales directos de clinic.ts. */
function ContactFormNotice() {
  return (
    <section className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            title="Envianos un mensaje"
            description="El formulario no está disponible todavía. Escribinos directo por los canales de contacto."
            align="left"
          />
          <div className="mt-8 space-y-3">
            <Card variant="outlined" padding="lg" className="bg-white">
              <h3 className="font-semibold text-sky-900">Por email</h3>
              <p className="mt-1 text-slate-600">
                <a href={`mailto:${clinic.email}`} className="font-medium text-sky-600 hover:text-sky-700">
                  {clinic.email}
                </a>
              </p>
            </Card>
            <Card variant="outlined" padding="lg" className="bg-white">
              <h3 className="font-semibold text-sky-900">Por WhatsApp</h3>
              <p className="mt-1 text-slate-600">
                <a
                  href={`https://wa.me/${clinic.whatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-sky-600 hover:text-sky-700"
                >
                  {clinic.whatsapp}
                </a>
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  const topFAQs = getFAQsByCategory('general').slice(0, 4);

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <SectionHeader title="Respuestas rápidas" description="Las consultas más frecuentes de nuestros usuarios." align="left" />
          <Link to="/faq" className="flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700">
            Ver todas
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
        <div className="space-y-3">
          {topFAQs.map((faq) => (
            <details key={faq.id} className="group rounded-xl border border-sky-100 bg-sky-50 p-6">
              <summary className="flex list-none cursor-pointer items-center justify-between font-semibold text-sky-900">
                {faq.question}
                <svg className="h-5 w-5 text-sky-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <p className="mt-4 leading-relaxed text-slate-600">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  return (
    <>
      <ContactHero />
      <ContactChannelsSection />
      <ContactFormNotice />
      <FAQPreviewSection />
    </>
  );
}

export default Contact;