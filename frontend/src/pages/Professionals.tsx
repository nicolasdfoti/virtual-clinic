import { useState, useMemo } from 'react';
import { professionals } from '../data/professionals';
import { specialties } from '../data/specialties';
import { Card, Badge, Button, Avatar } from '../components/ui';
import { ProfessionalCard } from '../components/sections';
import { useParams } from 'react-router-dom';

function ProfessionalProfile({ professional }: { professional: typeof professionals[0] }) {
  return (
    <div className="space-y-12">
      {/* Profile Header */}
      <section className="bg-sky-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <Avatar src={professional.avatar} name={professional.name} size="xl" className="lg:w-32 lg:h-32" />
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-sky-900">{professional.name}</h1>
                <Badge variant={professional.availability === 'available' ? 'success' : professional.availability === 'busy' ? 'warning' : 'default'} dot>
                  {professional.availability === 'available' ? 'Disponible' : professional.availability === 'busy' ? 'Ocupado' : 'No disponible'}
                </Badge>
              </div>
              <p className="mt-2 text-xl text-sky-600 font-medium">{professional.specialty}</p>
              <p className="mt-1 text-slate-600">Matrícula: {professional.licenseNumber}</p>
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-3 text-sm text-slate-600">
                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{professional.yearsExperience}+ años de experiencia</span>
                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>{professional.rating} ({professional.reviewCount} reseñas)</span>
                <span className="flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>${professional.price.toLocaleString('es-AR')}/consulta</span>
              </div>
              <div className="mt-4 flex flex-wrap justify-center lg:justify-start gap-2">
                {professional.modalities.map((modality) => (
                  <Badge key={modality} variant="info">{modality === 'video' ? 'Videollamada' : 'Chat'}</Badge>
                ))}
                {professional.languages.map((lang) => (
                  <Badge key={lang} variant="default">{lang}</Badge>
                ))}
              </div>
            </div>
            {professional.availability === 'available' && (
              <div className="lg:ml-auto lg:mt-0 mt-6 lg:mt-0">
                <Button size="xl" className="w-full lg:w-auto">
                  Reservar consulta
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Card variant="outlined" padding="lg">
                <h2 className="text-2xl font-bold text-sky-900">Sobre mí</h2>
                <p className="mt-4 text-slate-600 leading-relaxed">{professional.bio}</p>
              </Card>

              <Card variant="outlined" padding="lg">
                <h2 className="text-2xl font-bold text-sky-900">Formación y certificaciones</h2>
                <ul className="mt-4 space-y-3" role="list">
                  {professional.education.map((edu, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 text-sky-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      <span className="text-slate-600">{edu}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              <Card variant="outlined" padding="lg">
                <h2 className="text-2xl font-bold text-sky-900">Destacados</h2>
                <ul className="mt-4 space-y-3" role="list">
                  {professional.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg className="w-5 h-5 flex-shrink-0 text-emerald-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                      <span className="text-slate-600">{highlight}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card variant="outlined" padding="lg">
                <h3 className="font-bold text-sky-900">Información de la consulta</h3>
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Duración</dt><dd className="font-medium text-slate-900">20-30 min</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Modalidad</dt><dd className="font-medium text-slate-900">{professional.modalities.map(m => m === 'video' ? 'Videollamada' : 'Chat').join(', ')}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Idiomas</dt><dd className="font-medium text-slate-900">{professional.languages.join(', ')}</dd></div>
                  <div className="flex justify-between"><dt className="text-slate-500">Precio</dt><dd className="font-bold text-sky-900">${professional.price.toLocaleString('es-AR')}</dd></div>
                </dl>
              </Card>

              <Card variant="outlined" padding="lg">
                <h3 className="font-bold text-sky-900">Lo que incluye tu consulta</h3>
                <ul className="mt-4 space-y-2 text-sm text-slate-600" role="list">
                  {['Evaluación clínica completa', 'Receta digital (si corresponde)', 'Órdenes de estudios', 'Derivaciones a especialistas', 'Resumen de la consulta en tu historial', 'Seguimiento por chat 48hs'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2"><svg className="w-4 h-4 flex-shrink-0 text-sky-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>{item}</li>
                  ))}
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export function ProfessionalsPage() {
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
  const [selectedModality, setSelectedModality] = useState<'all' | 'video' | 'chat'>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<'all' | 'available' | 'busy'>('all');

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      const matchesSearch = !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.specialty.toLowerCase().includes(search.toLowerCase()) ||
        p.bio.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialty = selectedSpecialty === 'all' || p.specialtyId === selectedSpecialty;
      const matchesModality = selectedModality === 'all' || p.modalities.includes(selectedModality);
      const matchesAvailability = selectedAvailability === 'all' || p.availability === selectedAvailability;
      return matchesSearch && matchesSpecialty && matchesModality && matchesAvailability;
    });
  }, [search, selectedSpecialty, selectedModality, selectedAvailability]);

  const { id: profId } = useParams();

  if (profId) {
    const professional = professionals.find(p => p.id === profId);
    if (professional) {
      return <ProfessionalProfile professional={professional} />;
    }
  }

  return (
    <>
        <section className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pt-10 pb-16 sm:pt-14 sm:pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-semibold text-sky-600">Directorio médico</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
            Encontrá tu<br />
            <span className="text-sky-600">profesional ideal</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Buscá por especialidad, disponibilidad, precio o nombre. Filtrá según tus necesidades
            y reservá tu consulta en minutos.
          </p>
        </div>
      </div>
    </section>

    {/* Filters */}
    <section className="sticky top-16 z-40 border-y border-slate-200 bg-white py-10 lg:top-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end gap-6">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-1">Buscar profesional</label>
            <input
              id="search"
              type="search"
              placeholder="Nombre, especialidad, síntoma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex flex-wrap gap-4 lg:w-full lg:justify-end">
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
            >
              <option value="all">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select
              value={selectedModality}
              onChange={(e) => setSelectedModality(e.target.value as 'all' | 'video' | 'chat')}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
            >
              <option value="all">Cualquier modalidad</option>
              <option value="video">Videollamada</option>
              <option value="chat">Chat</option>
            </select>

            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value as 'all' | 'available' | 'busy')}
              className="rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
            >
              <option value="all">Todas las disponibilidades</option>
              <option value="available">Disponibles ahora</option>
              <option value="busy">Ocupados</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          {filtered.length} {filtered.length === 1 ? 'profesional' : 'profesionales'} encontrado{filtered.length !== 1 ? 's' : ''}
          {search && <span className="ml-2">para "{search}"</span>}
        </div>
      </div>
    </section>

    {/* Results */}
    <section className="py-16 sm:py-24 bg-sky-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((professional) => (
              <ProfessionalCard key={professional.id} professional={professional} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <svg className="mx-auto h-16 w-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <h2 className="mt-4 text-xl font-bold text-sky-900">No se encontraron profesionales</h2>
            <p className="mt-2 text-slate-600">Probá ajustar los filtros o buscar con otros términos.</p>
            <Button variant="ghost" onClick={() => { setSearch(''); setSelectedSpecialty('all'); setSelectedModality('all'); setSelectedAvailability('all'); }} className="mt-4">Limpiar filtros</Button>
          </div>
        )}
      </div>
    </section>
    </>
  );
}

export default ProfessionalsPage;