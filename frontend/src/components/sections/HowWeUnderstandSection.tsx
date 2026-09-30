import { SectionHeader, Card, Badge } from '../ui';

export function HowWeUnderstandSection() {
  const careModel = [
    {
      icon: '💻',
      title: 'Consulta online',
      description: 'Videollamadas HD seguras y chat cifrado. Funciona en el navegador sin instalar aplicaciones.',
      details: ['Cifrado extremo a extremo', 'Compatible con Chrome, Firefox, Safari, Edge', 'Compartir pantalla y archivos', 'Grabación opcional con consentimiento'],
    },
    {
      icon: '👨‍⚕️',
      title: 'Profesionales especializados',
      description: 'Médicos y licenciados con matrícula vigente, experiencia verificada y formación continua.',
      details: ['Verificación de matrícula y títulos', 'Especialistas en 8+ áreas médicas', 'Rating y reseñas de pacientes reales', 'Actualización profesional constante'],
    },
    {
      icon: '📅',
      title: 'Turnos coordinados',
      description: 'Agenda en tiempo real con confirmación instantánea y recordatorios automáticos.',
      details: ['Disponibilidad en tiempo real', 'Confirmación por email y notificación', 'Recordatorios 24h y 1h antes', 'Reprogramación y cancelación fácil'],
    },
    {
      icon: '🏠',
      title: 'Atención desde cualquier lugar',
      description: 'Conectate desde tu casa, trabajo o donde te sientas cómodo. Solo necesitás internet y un dispositivo.',
      details: ['Sin desplazamientos ni salas de espera', 'Privacidad de tu entorno', 'Accesible desde zonas rurales', 'Compatible con datos móviles'],
    },
    {
      icon: '📋',
      title: 'Seguimiento cuando corresponda',
      description: 'Historial clínico unificado, recetas digitales, órdenes de estudios y derivaciones integradas.',
      details: ['Historial accesible siempre', 'Recetas digitales válidas en farmacias', 'Órdenes de estudios y derivaciones', 'Continuidad de atención garantizada'],
    },
  ];

  return (
    <section id="modelo-atencion" className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Nuestro modelo"
          title="Cómo entendemos la atención virtual"
          description="No es solo una videollamada. Es un ecosistema completo de atención médica diseñado para la era digital."
        />

        <div className="mt-12 space-y-8">
          {careModel.map((item) => (
            <Card key={item.title} variant="interactive" padding="lg" className="lg:flex lg:gap-8">
              <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center rounded-2xl bg-sky-100 text-3xl lg:w-20 lg:h-20">
                <span aria-hidden="true">{item.icon}</span>
              </div>
              <div className="mt-4 flex-1 lg:mt-0 lg:pt-1">
                <h3 className="text-xl font-bold text-sky-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {item.details.map((detail, i) => (
                    <Badge key={i} variant="info" size="sm" className="bg-sky-50 text-sky-700 border-sky-200">
                      {detail}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-sky-50 border border-sky-200">
          <h4 className="text-lg font-bold text-sky-900">Lo que NO hacemos</h4>
          <ul className="mt-4 space-y-2 text-slate-600">
            <li className="flex items-start gap-2">✗ No reemplazamos emergencias médicas (llamá al 107 o 911)</li>
            <li className="flex items-start gap-2">✗ No realizamos procedimientos físicos ni estudios de imagen</li>
            <li className="flex items-start gap-2">✗ No emitimos certificados médicos que requieren examen presencial</li>
            <li className="flex items-start gap-2">✗ No sustituimos el control presencial cuando el profesional lo indica</li>
          </ul>
        </div>
      </div>
    </section>
  );
}