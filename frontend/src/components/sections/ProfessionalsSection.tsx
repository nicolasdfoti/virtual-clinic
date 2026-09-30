import { professionals } from '../../data/professionals';
import { SectionHeader, Card, Badge, Avatar } from '../ui';
import { Link } from 'react-router-dom';

interface ProfessionalCardProps {
  professional: typeof professionals[0];
}

export function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <Card variant="interactive" padding="lg" className="flex flex-col h-full">
      <div className="flex items-start gap-4">
        <Avatar src={professional.avatar} name={professional.name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sky-900 truncate">{professional.name}</h3>
            <Badge variant="success" size="sm" dot>
              {professional.availability === 'available' ? 'Disponible' : professional.availability === 'busy' ? 'Ocupado' : 'No disponible'}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">{professional.specialty}</p>
          <p className="text-xs text-slate-500">Matrícula: {professional.licenseNumber}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {professional.yearsExperience}+ años
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
          {professional.rating} ({professional.reviewCount})
        </span>
        <span className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
          ${professional.price.toLocaleString('es-AR')}/consulta
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {professional.modalities.map((modality) => (
          <Badge key={modality} variant="info" size="sm">
            {modality === 'video' ? 'Videollamada' : 'Chat'}
          </Badge>
        ))}
        {professional.languages.slice(0, 2).map((lang) => (
          <Badge key={lang} variant="default" size="sm">
            {lang}
          </Badge>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <Link
          to={`/professionals/${professional.id}`}
          className="block w-full text-center font-semibold text-sky-600 hover:text-sky-700 py-2"
        >
          Ver perfil y reservar
        </Link>
      </div>
    </Card>
  );
}

export function ProfessionalsSection({ limit = 4, title = 'Profesionales destacados', showViewAll = true }: { limit?: number; title?: string; showViewAll?: boolean }) {
  const featured = professionals.filter(p => p.availability === 'available').slice(0, limit);

  return (
    <section id="profesionales" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <SectionHeader
            eyebrow="Nuestro equipo"
            title={title}
            description="Profesionales certificados con años de experiencia, listos para atenderte."
            align="left"
          />
          {showViewAll && (
            <Link
              to="/professionals"
              className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700 mt-4 sm:mt-0"
            >
              Ver todos los profesionales
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      </div>
    </section>
  );
}