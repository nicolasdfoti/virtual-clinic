import { ProfessionalsSection } from '../components/sections';

function ProfessionalsHero() {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-sky-600">Directorio médico</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
            Conocé a
            <span className="text-sky-600"> nuestro equipo</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Profesionales de la salud con matrícula habilitada. Vamos a publicar los perfiles
            cuando estén confirmados.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProfessionalsPage() {
  return (
    <>
      <ProfessionalsHero />
      <ProfessionalsSection showViewAll={false} />
    </>
  );
}

export default ProfessionalsPage;