export type FAQCategory = 'general' | 'pacientes' | 'profesionales' | 'tecnico' | 'privacidad'

export type FAQ = {
  id: string
  question: string
  answer: string
  category: FAQCategory
}

export const faqs: FAQ[] = [
  {
    id: 'faq-general-consulta',
    question: '¿Cómo van a ser las consultas?',
    answer:
      'La idea es que las consultas sean por videollamada desde el navegador, sin instalar aplicaciones. Cuando lancemos el servicio vas a poder elegir día y horario, y la receta y las órdenes de estudios van a quedar en tu portal para consultarlas cuando quieras.',
    category: 'general',
  },
  {
    id: 'faq-general-reserva',
    question: '¿Cómo reservo un turno?',
    answer:
      'La reserva de turnos todavía no está activa: estamos construyendo la agenda. Cuando la habilitemos, vas a crear tu cuenta, elegir al profesional y el horario, y confirmar el turno desde la web. Publicamos las novedades en esta página.',
    category: 'general',
  },
  {
    id: 'faq-general-requisitos',
    question: '¿Necesito instalar alguna aplicación?',
    answer:
      'No. La plataforma se usa desde el navegador de tu celular, tablet o computadora. Solo necesitás conexión a internet, cámara y micrófono.',
    category: 'general',
  },
  {
    id: 'faq-pacientes-cuenta',
    question: '¿Necesito crear una cuenta?',
    answer:
      'Sí. La cuenta única te va a permitir coordinar turnos y tener tu historial en un solo lugar. El registro es gratuito y toma unos minutos.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-cancelar',
    question: '¿Puedo cancelar o reprogramar un turno?',
    answer:
      'Cuando lancemos la agenda vas a poder cancelar o reprogramar desde tu cuenta, respetando la política de cada profesional. Todavía no está disponible.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-precio',
    question: '¿Cuánto cuesta una consulta?',
    answer:
      'El costo lo define cada profesional y se va a mostrar antes de confirmar el turno. Hoy no se cobran consultas porque la reserva todavía no está activa.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-resultados',
    question: '¿Dónde veo mis recetas y resultados?',
    answer:
      'Las recetas y las órdenes de estudios van a quedar guardadas en tu portal, junto con el resto de tus consultas, para que accedas cuando quieras.',
    category: 'pacientes',
  },
  {
    id: 'faq-profesionales-alta',
    question: '¿Cómo me registro como profesional?',
    answer:
      'Vamos a habilitar el alta de profesionales con validación de matrícula nacional. Todavía no está activo el registro para médicos; escribinos por los canales de contacto y te avisamos cuando abra.',
    category: 'profesionales',
  },
  {
    id: 'faq-tecnico-videollamada',
    question: '¿Qué necesito técnicamente para la videollamada?',
    answer:
      'Un dispositivo con cámara y micrófono (celular, tablet o computadora), conexión a internet y un navegador actualizado. No hace falta instalar nada ni crear cuentas en otros servicios.',
    category: 'tecnico',
  },
  {
    id: 'faq-privacidad-datos',
    question: '¿Cómo se protege mi información?',
    answer:
      'Solo pedimos los datos necesarios para coordinar y realizar las consultas. La información de cada consulta es confidencial entre vos y el profesional que te atiende, y cumplimos la normativa vigente de protección de datos personales.',
    category: 'privacidad',
  },
]

export const getFAQCategories = (): FAQCategory[] => ['general', 'pacientes', 'profesionales', 'tecnico', 'privacidad']

export const getFAQsByCategory = (category: FAQCategory): FAQ[] => faqs.filter((faq) => faq.category === category)