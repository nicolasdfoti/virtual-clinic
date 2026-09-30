import { CTA, TrustIndicators } from '../ui';

interface CTAFinalSectionProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  background?: 'none' | 'sky' | 'slate' | 'white';
}

export function CTAFinalSection({
  title = '¿Listo para encontrar tu profesional?',
  description = 'Explorá las especialidades disponibles, conocé los perfiles de nuestros profesionales y coordiná tu consulta virtual.',
  primaryLabel = 'Buscar profesionales',
  primaryHref = '/professionals',
  secondaryLabel = 'Ver especialidades',
  secondaryHref = '/specialties',
  background = 'sky',
}: CTAFinalSectionProps = {}) {
  return (
    <CTA
      title={title}
      description={description}
      primaryAction={{ label: primaryLabel, href: primaryHref }}
      secondaryAction={{ label: secondaryLabel, href: secondaryHref }}
      background={background}
    />
  );
}

const trustItems = [
  { icon: '👨‍⚕️', label: 'Perfiles con especialidad, matrícula y experiencia' },
  { icon: '📹', label: 'Consultas por videollamada o chat' },
  { icon: '🌐', label: 'Acceso desde el navegador, sin instalar nada' },
  { icon: '🕒', label: 'Consultas disponibles todos los días' },
  { icon: '📄', label: 'Información clara de cada profesional antes de reservar' },
  { icon: '💬', label: 'Canal de contacto para resolver dudas' },
];

export function TrustSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50 py-12" aria-label="Características de la plataforma">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TrustIndicators items={trustItems} />
      </div>
    </section>
  );
}
