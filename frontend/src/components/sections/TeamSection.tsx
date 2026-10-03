import { teamMembers } from '../../data/values';
import { SectionHeader, Card, Avatar } from '../ui';

export function TeamSection() {
  return (
    <section id="equipo" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Liderazgo"
          title="El equipo detrás de Clínica Virtual"
          description="Médicos, ingenieros y especialistas en salud digital trabajando juntos para transformar el acceso a la atención médica."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {teamMembers.map((member) => (
            <Card key={member.id} variant="outlined" padding="lg" className="text-center h-full">
              <Avatar src={member.avatar} name={member.name} size="xl" className="mx-auto mb-4" />
              <h3 className="font-bold text-sky-900">{member.name}</h3>
              <p className="mt-1 text-sm text-sky-600 font-medium">{member.role}</p>
              <p className="mt-3 text-sm text-slate-600">{member.bio}</p>
              {member.linkedin && (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-sky-600 hover:text-sky-700"
                >
                  LinkedIn
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}