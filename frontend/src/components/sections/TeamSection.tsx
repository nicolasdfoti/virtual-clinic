import { SectionHeader, Card } from '../ui';

export function TeamSection() {
  return (
    <section id="equipo" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Liderazgo"
          title="El equipo detrás de Clínica Virtual"
          description="Vamos a presentar al equipo cuando esté confirmado."
        />

        <Card variant="outlined" padding="lg" className="mx-auto mt-12 max-w-2xl text-center">
          <h3 className="text-xl font-bold text-sky-900">Equipo en confirmación</h3>
          <p className="mt-2 text-slate-600">
            Todavía no publicamos los perfiles del equipo. Cuando estén confirmados, los vas a encontrar acá.
          </p>
        </Card>
      </div>
    </section>
  );
}