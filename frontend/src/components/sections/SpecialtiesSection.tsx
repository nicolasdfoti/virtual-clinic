import { Link } from 'react-router-dom';
import { specialties } from '../../data/specialties';
import SpecialtyCard from '../SpecialtyCard';
import { SectionHeader } from '../ui';

interface SpecialtiesSectionProps {
  title?: string;
  description?: string;
  limit?: number;
}

export function SpecialtiesSection({
  title = 'Encontrá la especialidad que necesitás',
  description = 'Profesionales de la salud en las especialidades más consultadas, disponibles por video o chat.',
  limit,
}: SpecialtiesSectionProps) {
  const visibleSpecialties = typeof limit === 'number' ? specialties.slice(0, limit) : specialties;
  const hasMore = visibleSpecialties.length < specialties.length;

  return (
    <section id="especialidades" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Nuestros servicios" title={title} description={description} />

        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {visibleSpecialties.map((specialty) => (
            <li key={specialty.id} className="h-full">
              <SpecialtyCard
                icon={specialty.icon}
                title={specialty.name}
                description={specialty.description}
                href={`/specialties/${specialty.id}`}
              />
            </li>
          ))}
        </ul>

        {hasMore && (
          <div className="mt-10 text-center">
            <Link
              to="/specialties"
              className="inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700"
            >
              Ver todas las especialidades
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
