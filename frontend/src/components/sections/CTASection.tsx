import { CTA } from '../ui';

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
  title = '¿Listo para dar el primer paso?',
  description = 'Creá tu cuenta y prepará tu perfil para sacar tu primer turno cuando lancemos la agenda.',
  primaryLabel = 'Crear cuenta',
  primaryHref = '/register',
  secondaryLabel = 'Conocé a nuestro equipo',
  secondaryHref = '/professionals',
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