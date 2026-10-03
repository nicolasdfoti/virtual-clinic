import { SectionHeader, Card } from '../ui';

export function MissionSection() {
  return (
    <section id="mision" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nuestra misión"
          title="Atención médica profesional, estés donde estés"
          description="Creemos que la distancia no debería ser una barrera para acceder a una atención médica de calidad."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <Card variant="default" padding="lg" className="bg-white shadow-sm">
              <h3 className="text-xl font-bold text-sky-900">El problema que resolvemos</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Millones de personas postergan o evitan la atención médica por barreras geográficas, horarios incompatibles,
                largas esperas y trámites burocráticos. Las consultas presenciales tradicionales no se adaptan al ritmo de vida actual.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="bg-white shadow-sm">
              <h3 className="text-xl font-bold text-sky-900">Por qué existimos</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Clínica Virtual nació para democratizar el acceso a la salud. Queremos que cualquier persona, sin importar dónde viva
                o cuál sea su horario, pueda consultar a un profesional certificado en minutos, no en semanas.
              </p>
            </Card>

            <Card variant="default" padding="lg" className="bg-white shadow-sm">
              <h3 className="text-xl font-bold text-sky-900">La experiencia que ofrecemos</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                Una plataforma intuitiva donde el paciente elige al profesional, el horario y la modalidad.
                Sin llamadas, sin papeles, sin esperas. Solo salud, cuando y donde la necesites.
              </p>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="default" padding="lg" className="bg-white shadow-sm">
              <h3 className="text-xl font-bold text-sky-900">La importancia de la accesibilidad</h3>
              <p className="mt-3 leading-relaxed text-slate-600">
                La atención médica accesible no es un lujo, es un derecho. Eliminamos barreras económicas ofreciendo
                precios transparentes, barreras tecnológicas con una interfaz que funciona en cualquier dispositivo,
                y barreras geográficas conectando pacientes con profesionales de todo el país.
              </p>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: '🕐', title: 'Disponibilidad 24/7', desc: 'Agenda siempre abierta para que elijas tu horario' },
                { icon: '📱', title: 'Multi-dispositivo', desc: 'Funciona en celular, tablet y computadora sin instalar apps' },
                { icon: '🌍', title: 'Cobertura nacional', desc: 'Profesionales de todas las provincias argentinas' },
                { icon: '💰', title: 'Precios transparentes', desc: 'Sabés el costo antes de reservar, sin sorpresas' },
              ].map((item) => (
                <Card key={item.title} variant="outlined" padding="lg" className="bg-white">
                  <div className="text-3xl mb-2" aria-hidden="true">{item.icon}</div>
                  <h4 className="font-bold text-sky-900">{item.title}</h4>
                  <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}