import { Link } from 'react-router-dom';
import {
  MissionSection,
  HowItWorksSection,
  ValuesSection,
  SecuritySection,
  TeamSection,
  CTAFinalSection,
} from '../components/sections';

function AboutHero() {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="font-semibold text-sky-600">Sobre nosotros</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
            Atención médica profesional,<br />
            <span className="text-sky-600">estés donde estés.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Clínica Virtual es una plataforma de telemedicina que conecta pacientes con profesionales
            de la salud con matrícula. Nuestra misión: hacer que la atención médica de calidad sea
            accesible, simple y privada para todas las personas, sin importar su ubicación.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/professionals"
              className="rounded-full bg-sky-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg transition hover:bg-sky-700"
            >
              Conocé a nuestro equipo
            </Link>
            <Link
              to="/register"
              className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
            >
              Creá tu cuenta
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function About() {
  return (
    <>
      <AboutHero />
      <MissionSection />
      <HowItWorksSection />
      <ValuesSection />
      <SecuritySection />
      <TeamSection />
      <CTAFinalSection />
    </>
  );
}

export default About;