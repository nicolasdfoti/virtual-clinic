import { values } from '../../data/values';
import { SectionHeader, Card } from '../ui';

export function ValuesSection() {
  return (
    <section id="valores" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nuestra filosofía"
          title="Valores que guían nuestra práctica"
          description="Cada decisión la tomamos pensando en la experiencia, comodidad y bienestar de quien confía en nosotros su salud."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value) => (
            <Card key={value.id} variant="outlined" padding="lg" hover className="h-full">
              <div className="text-4xl mb-4" aria-hidden="true">{value.icon}</div>
              <h3 className="text-xl font-bold text-sky-900">{value.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{value.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}