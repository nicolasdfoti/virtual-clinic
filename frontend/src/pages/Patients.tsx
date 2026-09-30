import { Link } from 'react-router-dom';
import { patientFeatures } from '../data/howItWorks';
import { SectionHeader, Card, CTA, TrustIndicators } from '../components/ui';

function PatientsHero() {
  return (
    <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-sky-600">Para pacientes</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
            Tu salud en<br />
            <span className="text-sky-600">tus manos</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Una experiencia diseñada para que gestionar tu salud sea tan simple como pedir un delivery.
            Sin esperas, sin trámites, sin complicaciones.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row justify-center">
            <Link
              to="/register"
              className="rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700 text-center"
            >
              Crear cuenta gratis
            </Link>
            <Link
              to="/specialties"
              className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
            >
              Explorar especialidades
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid({ features, title }: { features: typeof patientFeatures; title: string }) {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader title={title} align="center" />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.id} variant="outlined" padding="lg" hover className="h-full">
              <div className="text-4xl mb-4" aria-hidden="true">{feature.icon}</div>
              <h3 className="text-xl font-bold text-sky-900">{feature.title}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{feature.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function JourneySection() {
  const steps = [
    { number: 1, title: 'Registrate', desc: 'Creá tu cuenta en 2 minutos con email y contraseña', icon: '👤' },
    { number: 2, title: 'Completá tu perfil', desc: 'Agregá tus datos, antecedentes y preferencias', icon: '📋' },
    { number: 3, title: 'Buscá un profesional', desc: 'Filtrá por especialidad, horario, precio y reseñas', icon: '🔍' },
    { number: 4, title: 'Reservá tu turno', desc: 'Elegí día y hora, confirmá con pago seguro', icon: '📅' },
    { number: 5, title: 'Realizá la consulta', desc: 'Videollamada HD o chat seguro desde tu navegador', icon: '💻' },
    { number: 6, title: 'Seguí tu tratamiento', desc: 'Recetas, órdenes y resumen en tu historial digital', icon: '📄' },
  ];

  return (
    <section id="journey" className="bg-sky-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Tu jornada en SaludOnline"
          description="Desde que te registrás hasta el seguimiento de tu tratamiento, todo en una sola plataforma."
        />
        <div className="mt-12 relative">
          <div className="hidden lg:block absolute left-1/2 top-12 -translate-x-1/2 h-full w-px bg-sky-200" aria-hidden="true" />
          <div className="grid gap-8 lg:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-sm relative lg:pl-10">
                  <div className="absolute lg:left-0 lg:top-0 lg:-translate-x-1/2 flex h-24 w-24 items-center justify-center rounded-full bg-sky-100 text-2xl font-bold text-sky-600">
                    {step.number}
                  </div>
                  <div className="mt-6 lg:mt-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl" aria-hidden="true">{step.icon}</span>
                      <h3 className="text-xl font-bold text-sky-900">{step.title}</h3>
                    </div>
                    <p className="text-slate-600">{step.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardPreviewSection() {
  return (
    <section className="bg-slate-950 text-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          title="Tu panel de control"
          description="Todo centralizado: turnos, historial, recetas, mensajes y configuración."
        />
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Card variant="outlined" padding="lg" className="bg-slate-900 border-slate-800">
            <h3 className="text-xl font-bold">Próximos turnos</h3>
            <div className="mt-4 space-y-3">
              {[
                { date: 'Mañana 10:30', professional: 'Dra. María González', specialty: 'Medicina General', status: 'Confirmado' },
                { date: 'Jueves 14:00', professional: 'Lic. Ana Martínez', specialty: 'Psicología', status: 'Pendiente' },
              ].map((t, i) => (
                <div key={i} className="p-4 bg-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t.professional}</p>
                    <p className="text-sm text-slate-400">{t.specialty} · {t.date}</p>
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full ${t.status === 'Confirmado' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-amber-900/30 text-amber-300'}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card variant="outlined" padding="lg" className="bg-slate-900 border-slate-800">
            <h3 className="text-xl font-bold">Últimos documentos</h3>
            <div className="mt-4 space-y-3">
              {['Receta digital - Antibiótico', 'Orden de análisis de sangre', 'Resumen consulta Psicología', 'Derivación a Cardiología'].map((d, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                  <span className="text-sm">{d}</span>
                  <span className="text-xs text-sky-400">Ver</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

export function PatientsPage() {
  return (
    <>
      <PatientsHero />
      <FeatureGrid features={patientFeatures} title="Todo lo que podés hacer" />
      <JourneySection />
      <DashboardPreviewSection />
      <TrustIndicators
        items={[
          { icon: '✓', label: 'Sin costo de registro' },
          { icon: '✓', label: 'Cancelación gratis hasta 2hs antes' },
          { icon: '✓', label: 'Historial clínico unificado' },
          { icon: '✓', label: 'Soporte humano 9-18hs' },
        ]}
      />
      <CTA
        title="Empezá a cuidar tu salud hoy"
        description="Registrate gratis y accedé a profesionales certificados en minutos."
        primaryAction={{ label: 'Crear mi cuenta', href: '/register' }}
        secondaryAction={{ label: 'Ver especialidades', href: '/specialties' }}
        background="sky"
      />
    </>
  );
}

export default PatientsPage;