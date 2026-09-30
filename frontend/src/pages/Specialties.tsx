import { specialties, getSpecialtyById } from '../data/specialties';
import { getProfessionalsBySpecialty } from '../data/professionals';
import { useParams, Link } from 'react-router-dom';
import { SectionHeader, Card, Badge } from '../components/ui';
import { ProfessionalCard } from '../components/sections/ProfessionalsSection';

function SpecialtyDetail({ specialty }: { specialty: typeof specialties[0] }) {
  const specialtyProfessionals = getProfessionalsBySpecialty(specialty.id);

  return (
    <div className="space-y-16">
      {/* Specialty Hero */}
      <section className="bg-sky-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-6xl block mb-4" aria-hidden="true">{specialty.icon}</span>
            <h1 className="text-4xl font-bold text-sky-900 sm:text-5xl">{specialty.name}</h1>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">{specialty.description}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Badge variant="info">{specialty.consultationType === 'video' ? 'Videollamada' : specialty.consultationType === 'chat' ? 'Chat' : 'Video y chat'}</Badge>
              <Badge variant="success" dot>{specialty.professionalCount} profesionales</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* What this specialty covers */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeader
            title="¿Qué incluye esta especialidad?"
            description="Nuestros profesionales atienden una amplia gama de consultas dentro de esta área."
            align="left"
          />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              'Consulta inicial y diagnóstico',
              'Seguimiento y control de tratamientos',
              'Recetas digitales y órdenes de estudios',
              'Derivaciones a otros especialistas',
              'Certificados médicos (cuando corresponda)',
              'Educación y prevención en salud',
            ].map((item, i) => (
              <Card key={i} variant="outlined" padding="lg" className="bg-white">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 flex-shrink-0 text-sky-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  <span className="text-slate-600">{item}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Professionals */}
      <section className="bg-sky-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <SectionHeader
              title="Profesionales disponibles"
              description="Elegí el profesional que mejor se adapte a tus necesidades."
              align="left"
            />
            <Link
              to="/professionals"
              className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700"
            >
              Ver todos
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {specialtyProfessionals.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold text-sky-900">¿Listo para tu consulta?</h2>
            <p className="mt-4 text-lg text-slate-600">Seleccioná un profesional, elegí tu horario y confirmá tu turno en minutos.</p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
              <Link
                to="/professionals"
                className="rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700 text-center"
              >
                Ver profesionales y reservar
              </Link>
              <Link
                to="/specialties"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
              >
                Volver a especialidades
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function SpecialtiesPage() {
  const params = useParams();
  const specialtyId = params.specialtyId;
  const specialty = specialtyId ? getSpecialtyById(specialtyId) : null;

  return (
    <>
      {specialty ? (
        <SpecialtyDetail specialty={specialty} />
      ) : (
        <>
        <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <p className="font-semibold text-sky-600">Especialidades médicas</p>
              <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
                Encontrá la atención<br />
                <span className="text-sky-600">que necesitás</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-slate-600">
                Contamos con profesionales certificados en más de 8 especialidades médicas,
                disponibles para consultas por video o chat desde cualquier lugar.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-sky-50 py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {specialties.map((specialty) => (
                <Link key={specialty.id} to={`/specialties/${specialty.id}`} className="group">
                  <Card variant="interactive" padding="lg" className="h-full text-center group-hover:border-sky-300 group-hover:shadow-lg">
                    <span className="text-5xl block mb-4" aria-hidden="true">{specialty.icon}</span>
                    <h3 className="text-xl font-bold text-sky-900 group-hover:text-sky-700">{specialty.name}</h3>
                    <p className="mt-2 text-slate-600 line-clamp-2">{specialty.description}</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Badge variant="info" size="sm">{specialty.consultationType === 'video' ? 'Video' : specialty.consultationType === 'chat' ? 'Chat' : 'Video + Chat'}</Badge>
                      <Badge variant="default" size="sm">{specialty.professionalCount} profesionales</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="mx-auto max-w-2xl">
              <h2 className="text-3xl font-bold text-sky-900">¿No sabés qué especialidad elegir?</h2>
              <p className="mt-4 text-lg text-slate-600">Comenzá con una consulta de Medicina General. El profesional te orientará y derivará si es necesario.</p>
              <Link
                to="/specialties/medicina-general"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-sky-600 px-7 py-3.5 font-semibold text-white shadow-lg transition hover:bg-sky-700"
              >
                Empezar con Medicina General
              </Link>
            </div>
          </div>
        </section>
        </>
      )}
    </>
  );
}

export default SpecialtiesPage;