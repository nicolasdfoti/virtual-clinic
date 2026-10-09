import { Link } from 'react-router-dom';
import { SectionHeader, Card, Avatar } from '../ui';
import type { PublicDoctor } from '../../features/directory/types';
import { usePublicDoctors } from '../../features/directory/usePublicDoctors';

interface ProfessionalCardProps {
  professional: PublicDoctor;
  featured?: boolean;
}

export function ProfessionalCard({ professional, featured = false }: ProfessionalCardProps) {
  return (
    <Card
      variant="interactive"
      padding="lg"
      className={`flex h-full flex-col ${featured ? 'ring-2 ring-sky-300' : ''}`}
    >
      <div className="flex items-start gap-4">
        <Avatar name={professional.name} size="lg" />
        <div className="min-w-0">
          <h3 className="truncate font-bold text-sky-900">{professional.name}</h3>
          <p className="mt-1 text-sm text-slate-600">{professional.specialty}</p>
          <p className="text-xs text-slate-500">Matrícula: {professional.license_number}</p>
        </div>
      </div>
      {professional.bio && (
        <p className="mt-4 text-sm leading-relaxed text-slate-600">{professional.bio}</p>
      )}
    </Card>
  );
}

function ProfessionalsEmptyState() {
  return (
    <Card variant="outlined" padding="lg" className="mx-auto max-w-2xl text-center">
      <h3 className="text-xl font-bold text-sky-900">Próximamente publicaremos a nuestro equipo</h3>
      <p className="mt-2 text-slate-600">
        Estamos terminando de integrar los perfiles de los profesionales.
      </p>
    </Card>
  );
}

export function ProfessionalsSection({
  limit = 3,
  title = 'Profesionales',
  showViewAll = true,
}: {
  limit?: number;
  title?: string;
  showViewAll?: boolean;
}) {
  const { data, isLoading, isError } = usePublicDoctors();
  const visible = (data ?? []).slice(0, limit);

  return (
    <section id="profesionales" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            eyebrow="Nuestro equipo"
            title={title}
            description="Profesionales de la salud con matrícula habilitada."
            align="left"
          />
          {showViewAll && visible.length > 0 && (
            <Link
              to="/professionals"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-sky-600 hover:text-sky-700 sm:mt-0"
            >
              Ver todos los profesionales
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          )}
        </div>

        {isLoading ? (
          <p role="status" className="mt-10 text-center text-slate-500">
            Cargando profesionales…
          </p>
        ) : isError ? (
          <Card variant="outlined" padding="lg" className="mx-auto max-w-2xl text-center">
            <p role="alert" className="text-slate-600">
              No pudimos cargar los profesionales. Recargá la página e intentá de nuevo.
            </p>
          </Card>
        ) : visible.length === 0 ? (
          <div className="mt-10">
            <ProfessionalsEmptyState />
          </div>
        ) : visible.length === 1 ? (
          <div className="mx-auto mt-10 max-w-md">
            <ProfessionalCard professional={visible[0]} featured />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((professional) => (
              <ProfessionalCard
                key={professional.license_number}
                professional={professional}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
