import Hero from '../components/Hero';
import { HowItWorksSection, ProfessionalsSection, FAQSection } from '../components/sections';

export function Home() {
  return (
    <>
      <Hero />
      <HowItWorksSection />
      <ProfessionalsSection />
      <FAQSection
        limit={3}
        showViewAll
        cta={{
          title: '¿Listo para el primer paso?',
          description: 'Registrate ahora y prepará tu perfil para sacar tu primer turno cuando lancemos la agenda.',
          primaryLabel: 'Creá tu cuenta',
          primaryHref: '/register',
          secondaryLabel: 'Conocé a tu médico',
          secondaryHref: '/professionals',
        }}
      />
    </>
  );
}

export default Home;