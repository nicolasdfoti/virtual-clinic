import Hero from '../components/Hero';
import {
  SpecialtiesSection,
  ProfessionalsSection,
  HowItWorksSection,
  BenefitsSection,
  TrustSection,
  FAQSection,
  CTAFinalSection,
} from '../components/sections';

export function Home() {
  return (
    <>
      <Hero />
      <SpecialtiesSection />
      <ProfessionalsSection limit={3} />
      <HowItWorksSection />
      <BenefitsSection />
      <TrustSection />
      <FAQSection limit={5} showViewAll />
      <CTAFinalSection />
    </>
  );
}

export default Home;
