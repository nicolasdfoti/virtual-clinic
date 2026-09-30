export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'pacientes' | 'profesionales' | 'tecnico' | 'privacidad';
};

export const faqs: FAQ[] = [
  {
    id: 'faq-1',
    question: '¿Cómo funciona una consulta virtual?',
    answer:
      'La consulta virtual se realiza por videollamada segura a través de nuestra plataforma. Al confirmar tu turno, recibirás un enlace para acceder a la sala de espera virtual. En el horario acordado, el profesional se conectará y realizará la consulta como lo haría presencialmente: te hará preguntas, podrá solicitarte estudios, recetar medicamentos (receta digital) y dar indicaciones. Todo queda registrado en tu historial clínico digital.',
    category: 'general',
  },
  {
    id: 'faq-2',
    question: '¿Cómo puedo reservar un turno?',
    answer:
      '1. Creá tu cuenta o iniciá sesión. 2. Buscá por especialidad, profesional o síntoma. 3. Elegí el profesional y verás su disponibilidad. 4. Seleccioná día y horario. 5. Confirmá el turno. Recibirás confirmación por email y notificación en la app. Podés pagar online o según la modalidad del profesional.',
    category: 'pacientes',
  },
  {
    id: 'faq-3',
    question: '¿Necesito crear una cuenta para reservar?',
    answer:
      'Sí, es necesario crear una cuenta para gestionar tus turnos, acceder al historial clínico, recibir recetas digitales y mantener la continuidad de tu atención. El registro es gratuito y toma menos de 2 minutos.',
    category: 'pacientes',
  },
  {
    id: 'faq-4',
    question: '¿Puedo cancelar o reprogramar un turno?',
    answer:
      'Sí, podés cancelar o reprogramar desde tu panel "Mis Turnos" hasta 2 horas antes del horario programado sin cargo. Las cancelaciones tardías pueden tener una penalización según la política de cada profesional. Los cambios se notifican automáticamente al profesional.',
    category: 'pacientes',
  },
  {
    id: 'faq-5',
    question: '¿Cómo accedo a mi consulta virtual?',
    answer:
      '10 minutos antes del turno, ingresá a "Mis Turnos" y hacé clic en "Entrar a la consulta". Se abrirá la sala de espera. Verificá que tu cámara y micrófono funcionen. El profesional se conectará en el horario pactado. No necesitás instalar nada: funciona en el navegador (Chrome, Firefox, Safari, Edge).',
    category: 'tecnico',
  },
  {
    id: 'faq-6',
    question: '¿Cómo se protege mi información médica?',
    answer:
      'Tu información está protegida con cifrado de extremo a extremo (AES-256), servidores certificados ISO 27001, autenticación de dos factores y cumplimiento de la Ley 25.326 de Protección de Datos Personales. Solo vos y los profesionales que autorices pueden acceder a tu historial. No compartimos datos con terceros sin tu consentimiento explícito.',
    category: 'privacidad',
  },
  {
    id: 'faq-7',
    question: '¿Cómo encuentro el profesional adecuado?',
    answer:
      'Podés filtrar por: especialidad, modalidad (video/chat), idiomas, precio, disponibilidad y rating. Cada perfil muestra: matrícula, experiencia, formación, reseñas de otros pacientes y especialidades. También podés usar la búsqueda libre por nombre o síntoma.',
    category: 'pacientes',
  },
  {
    id: 'faq-8',
    question: '¿La consulta virtual reemplaza una consulta presencial?',
    answer:
      'La consulta virtual es complementaria y adecuada para la mayoría de situaciones: seguimiento, recetas, resultados, orientación, salud mental, nutrición, dermatología (con fotos). No reemplaza la atención de emergencia, procedimientos físicos, estudios de imagen o exámenes que requieren presencia. El profesional evaluará si necesitás derivación presencial.',
    category: 'general',
  },
  {
    id: 'faq-9',
    question: '¿Qué necesito para una consulta virtual?',
    answer:
      'Dispositivo con cámara y micrófono (celular, tablet, computadora), conexión a internet estable (mínimo 5 Mbps), navegador actualizado (Chrome, Firefox, Safari, Edge), buena iluminación y espacio privado. Recomendamos probar la conexión 10 minutos antes.',
    category: 'tecnico',
  },
  {
    id: 'faq-10',
    question: '¿Cómo me registro como profesional en la plataforma?',
    answer:
      'Completá el formulario en "Para Profesionales" con: matrícula vigente, título, especialidad, CV, foto de documento. Nuestro equipo valida la documentación en 48-72 hs. Una vez aprobado, configurás tu perfil, disponibilidad, precios y modalidades. No hay costo de registro; la plataforma cobra una comisión por consulta realizada.',
    category: 'profesionales',
  },
  {
    id: 'faq-11',
    question: '¿Puedo atender desde cualquier lugar?',
    answer:
      'Sí, siempre que cuentes con conexión estable, dispositivo adecuado y espacio privado que garantice confidencialidad. Debés cumplir con la legislación de tu jurisdicción y la del paciente. La plataforma valida la matrícula según tu país de ejercicio.',
    category: 'profesionales',
  },
  {
    id: 'faq-12',
    question: '¿Cómo funciona el sistema de pagos?',
    answer:
      'Los pacientes pagan al confirmar el turno (tarjeta, transferencia, billetera virtual). Los fondos se retienen hasta 24 hs post-consulta. El profesional recibe el pago neto (menos comisión de plataforma) semanalmente. Emitimos factura A/B según corresponda. Los reembolsos por cancelación se procesan automáticamente.',
    category: 'general',
  },
];

export function getFAQsByCategory(category: FAQ['category']): FAQ[] {
  return faqs.filter((f) => f.category === category);
}

export function getFAQCategories(): { id: FAQ['category']; label: string }[] {
  return [
    { id: 'general', label: 'General' },
    { id: 'pacientes', label: 'Para pacientes' },
    { id: 'profesionales', label: 'Para profesionales' },
    { id: 'tecnico', label: 'Técnico' },
    { id: 'privacidad', label: 'Privacidad y seguridad' },
  ];
}