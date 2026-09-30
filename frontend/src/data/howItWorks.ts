export type HowItWorksStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  icon: string;
  details: string[];
};

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 'step-1',
    number: 1,
    title: 'Creá tu cuenta',
    description: 'Registrate gratis en menos de 2 minutos con tu email y datos básicos.',
    icon: '👤',
    details: [
      'Email y contraseña segura',
      'Datos personales básicos',
      'Verificación de email',
      'Acceso inmediato a la plataforma',
    ],
  },
  {
    id: 'step-2',
    number: 2,
    title: 'Buscá un profesional',
    description: 'Filtrá por especialidad, disponibilidad, idioma, precio y reseñas de otros pacientes.',
    icon: '🔍',
    details: [
      '8+ especialidades disponibles',
      'Filtros avanzados de búsqueda',
      'Perfiles completos con matrícula y experiencia',
      'Reseñas y calificaciones reales',
    ],
  },
  {
    id: 'step-3',
    number: 3,
    title: 'Elegí un horario',
    description: 'Seleccioná el día y hora que mejor te convenga según la agenda del profesional.',
    icon: '📅',
    details: [
      'Agenda en tiempo real',
      'Múltiples franjas horarias',
      'Confirmación instantánea',
      'Recordatorios automáticos',
    ],
  },
  {
    id: 'step-4',
    number: 4,
    title: 'Confirmá tu consulta',
    description: 'Revisá los detalles, elegí modalidad (video/chat) y confirmá con pago seguro.',
    icon: '✅',
    details: [
      'Resumen del turno y profesional',
      'Modalidad: videollamada o chat',
      'Pago seguro online (tarjeta/transferencia)',
      'Recibo y factura automáticos',
    ],
  },
  {
    id: 'step-5',
    number: 5,
    title: 'Realizá tu consulta virtual',
    description: 'Ingresá a la sala de espera 10 min antes. El profesional se conectará en el horario pactado.',
    icon: '💻',
    details: [
      'Sin instalar apps: funciona en el navegador',
      'Videollamada HD cifrada extremo a extremo',
      'Chat seguro para compartir archivos/imágenes',
      'Receta digital y órdenes de estudios al finalizar',
    ],
  },
];

export type PatientFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const patientFeatures: PatientFeature[] = [
  {
    id: 'buscar',
    title: 'Buscar profesionales',
    description: 'Encontrá el especialista indicado filtrando por especialidad, disponibilidad, precio, idiomas y calificaciones.',
    icon: '🔍',
  },
  {
    id: 'reservar',
    title: 'Reservar turnos 24/7',
    description: 'Gestioná tus citas sin horarios de atención: la agenda está siempre disponible para que elijas cuándo y con quién.',
    icon: '📅',
  },
  {
    id: 'gestionar',
    title: 'Gestionar tus turnos',
    description: 'Reprogramá, cancelá o repetí consultas desde tu panel. Historial completo de todas tus atenciones.',
    icon: '📋',
  },
  {
    id: 'historial',
    title: 'Historial clínico digital',
    description: 'Accedé a tus recetas, órdenes de estudios, resúmenes de consulta y documentos médicos en un solo lugar.',
    icon: '📄',
  },
  {
    id: 'consulta',
    title: 'Acceder a la consulta virtual',
    description: 'Videollamadas HD seguras y chat cifrado. Compartí imágenes, estudios y documentos en tiempo real.',
    icon: '💻',
  },
  {
    id: 'perfil',
    title: 'Perfil y preferencias',
    description: 'Actualizá tus datos, métodos de pago, notificaciones, contactos de emergencia y preferencias de accesibilidad.',
    icon: '⚙️',
  },
];

export type ProfessionalFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const professionalFeatures: ProfessionalFeature[] = [
  {
    id: 'perfil-prof',
    title: 'Perfil profesional completo',
    description: 'Publicá tu matrícula, formación, experiencia, idiomas, especialidades y foto. Generá confianza antes de la primera consulta.',
    icon: '👨‍⚕️',
  },
  {
    id: 'disponibilidad',
    title: 'Gestión de disponibilidad',
    description: 'Definí tus horarios, bloqueos, vacaciones y duración de consultas. Agenda sincronizada en tiempo real.',
    icon: '📅',
  },
  {
    id: 'turnos',
    title: 'Recibir y gestionar solicitudes',
    description: 'Aceptá, rechazá o reprogramá solicitudes de turno. Lista de espera automática y confirmaciones instantáneas.',
    icon: '📥',
  },
  {
    id: 'consultas',
    title: 'Realizar consultas virtuales',
    description: 'Videollamadas profesionales con historia clínica integrada, prescripción digital, derivaciones y adjuntos.',
    icon: '💻',
  },
  {
    id: 'agenda',
    title: 'Administrar tu agenda',
    description: 'Vista semanal/mensual, estadísticas de ocupación, ingresos, cancelaciones y métricas de satisfacción.',
    icon: '📊',
  },
  {
    id: 'info-prof',
    title: 'Gestionar información profesional',
    description: 'Actualizá matrícula, títulos, especialidades, precios, modalidades y configurá tu disponibilidad por franjas.',
    icon: '⚙️',
  },
];