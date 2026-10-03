import { useState, type FormEvent } from 'react';
import { contactInfo, contactSubjects, type ContactFormData } from '../data/contact';
import { SectionHeader, Card, Button } from '../components/ui';
import { Link } from 'react-router-dom';

function ContactHero() {
  return (
    <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-teal-900 pt-10 pb-16 sm:pt-14 sm:pb-20 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-teal-300">Contacto</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            Estamos acá<br />
            <span className="text-teal-300">para ayudarte</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-sky-100">
            Tenés dudas, sugerencias o necesitás ayuda. Escribinos y te respondemos
            en menos de 24hs hábiles.
          </p>
        </div>
      </div>
    </section>
  );
}

function ContactInfoSection() {
  const infoItems = [
    { icon: '📧', title: 'Email', value: contactInfo.email, href: `mailto:${contactInfo.email}`, description: 'Respondemos en 24hs hábiles' },
    { icon: '📞', title: 'Teléfono', value: contactInfo.phone, href: `tel:${contactInfo.phone}`, description: contactInfo.hours },
    { icon: '📍', title: 'Oficina', value: contactInfo.address, href: '#', description: 'Solo correspondencia' },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Canales de contacto"
          description="Elegí el canal que más te convenga. Para urgencias médicas, llamá al 107 o 911."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {infoItems.map((item, i) => (
            <Card key={i} variant="outlined" padding="lg" className="text-center h-full">
              <span className="text-4xl block mb-4" aria-hidden="true">{item.icon}</span>
              <h3 className="text-xl font-bold text-sky-900">{item.title}</h3>
              <a
                href={item.href}
                className="mt-2 block font-medium text-sky-600 hover:text-sky-700"
                target={item.href === '#' ? undefined : '_blank'}
                rel={item.href === '#' ? undefined : 'noopener noreferrer'}
              >
                {item.value}
              </a>
              <p className="mt-1 text-sm text-slate-500">{item.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: 'general',
    message: '',
  });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'unavailable'>('idle');

  const validate = (data: ContactFormData) => {
    const newErrors: Partial<ContactFormData> = {};
    if (!data.name.trim()) newErrors.name = 'El nombre es obligatorio';
    if (!data.email.trim()) newErrors.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) newErrors.email = 'Email inválido';
    if (!data.message.trim()) newErrors.message = 'El mensaje es obligatorio';
    else if (data.message.trim().length < 10) newErrors.message = 'El mensaje debe tener al menos 10 caracteres';
    return newErrors;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors = validate(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // TODO(contact): falta el endpoint POST /api/contact. Cuando exista, hacer
    // la llamada aca, mover los `disabled={isSubmitting}` a true durante la
    // request y recién entonces mostrar el estado de exito.
    //
    // Antes esto hacia un setTimeout de 1.5s y logueaba el formulario a la
    // consola, y despues mostraba "Mensaje enviado". Eso era falso: no se
    // mandaba nada y ademas dejaba PII (nombre, email, mensaje) en la consola
    // del navegador. Ahora se valida y se dice explicitamente que el canal no
    // esta disponible.
    setSubmitStatus('unavailable');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (submitStatus === 'unavailable') {
      setSubmitStatus('idle');
    }
  };

  return (
    <section className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            title="Envianos un mensaje"
            description="Cuando habilitemos el formulario, te vamos a responder a la brevedad."
            align="left"
          />

          <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <p className="font-semibold text-amber-800">El formulario todavía no está disponible</p>
                <p className="text-sm text-amber-700">
                  El formulario no está disponible todavía. Mientras tanto,
                  escribinos directo a{' '}
                  <a href="mailto:contacto@clinicavirtual.com" className="font-medium underline">contacto@clinicavirtual.com</a>.
                </p>
              </div>
            </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Nombre completo <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Juan Pérez"
                  className={`mt-1 w-full rounded-lg border px-4 py-3 outline-none transition ${errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'}`}
                  aria-invalid={errors.name ? 'true' : 'false'}
                  aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={`mt-1 w-full rounded-lg border px-4 py-3 outline-none transition ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'}`}
                  aria-invalid={errors.email ? 'true' : 'false'}
                  aria-describedby={errors.email ? 'email-error' : undefined}
                />
                {errors.email && <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700">
                Asunto <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              >
                {contactSubjects.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700">
                Mensaje <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={5}
                placeholder="Describínos tu consulta, duda o sugerencia..."
                className={`mt-1 w-full rounded-lg border px-4 py-3 outline-none transition resize-none ${errors.message ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'}`}
                aria-invalid={errors.message ? 'true' : 'false'}
                aria-describedby={errors.message ? 'message-error' : 'message-hint'}
              />
              {errors.message && <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">{errors.message}</p>}
              <p id="message-hint" className="mt-1 text-sm text-slate-500">Mínimo 10 caracteres</p>
            </div>

            {submitStatus === 'unavailable' && (
              <p role="status" className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Todavía no pudimos enviar tu mensaje: este formulario no está conectado a ningún
                servicio. Escribinos directo a{' '}
                <a href="mailto:contacto@clinicavirtual.com" className="font-medium underline">contacto@clinicavirtual.com</a>.
              </p>
            )}

            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Enviar mensaje
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}

function FAQPreviewSection() {
  const topFAQs = [
    { q: '¿Cómo funciona una consulta virtual?', a: 'Se realiza por videollamada segura en el navegador. Recibís un enlace 10 min antes del turno.' },
    { q: '¿Puedo cancelar o reprogramar un turno?', a: 'Sí, hasta 2 horas antes sin cargo desde tu panel "Mis Turnos".' },
    { q: '¿Cómo se protege mi información médica?', a: 'Cifrado AES-256, servidores ISO 27001, cumplimiento Ley 25.326 y 2FA disponible.' },
    { q: '¿Necesito crear una cuenta para reservar?', a: 'Sí, es gratis y toma 2 minutos. Necesaria para historial, recetas y continuidad.' },
  ];

  return (
    <section className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <SectionHeader title="Respuestas rápidas" description="Las consultas más frecuentes de nuestros usuarios." align="left" />
          <Link to="/faq" className="font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
            Ver todas <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>
        <div className="space-y-3">
          {topFAQs.map((faq, i) => (
            <details key={i} className="group bg-sky-50 rounded-xl p-6 border border-sky-100">
              <summary className="flex items-center justify-between cursor-pointer list-none font-semibold text-sky-900">
                {faq.q}
                <svg className="w-5 h-5 text-sky-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </summary>
              <p className="mt-4 text-slate-600 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactInfoSection />
      <ContactFormSection />
      <FAQPreviewSection />
    </>
  );
}

export default ContactPage;