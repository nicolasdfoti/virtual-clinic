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
      'Las consultas pueden ser por videollamada desde el navegador, sin instalar aplicaciones, o presenciales. Elegís día y horario, y la receta y las órdenes de estudios quedan en tu portal para consultarlas cuando quieras.',
    category: 'general',
  },
  {
    id: 'faq-general-reserva',
    question: '¿Cómo reservo un turno?',
    answer:
      'Creás tu cuenta gratis, elegís al profesional y un horario disponible, y confirmás el turno desde la web. Después lo ves en tu portal junto con el detalle de la consulta.',
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
      'Sí. La cuenta única te permite coordinar turnos y tener tus recetas, órdenes e historial en un solo lugar. El registro es gratuito y toma unos minutos.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-cancelar',
    question: '¿Puedo cancelar o reprogramar un turno?',
    answer:
      'Sí. Podés cancelar desde tu cuenta hasta 24 horas antes del turno. Para reprogramar, cancelá y reservá otro horario disponible.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-precio',
    question: '¿Cuánto cuesta una consulta?',
    answer:
      'La plataforma no gestiona cobros. El valor de cada consulta lo define el profesional; consultalo al coordinar el turno.',
    category: 'pacientes',
  },
  {
    id: 'faq-pacientes-resultados',
    question: '¿Dónde veo mis recetas y resultados?',
    answer:
      'Tus recetas y órdenes de estudios quedan guardadas en tu portal, junto con el resto de tus consultas, para que accedas cuando quieras.',
    category: 'pacientes',
  },
  {
    id: 'faq-profesionales-alta',
    question: '¿Cómo me registro como profesional?',
    answer:
      'Las cuentas de profesionales las da de alta la administración de la plataforma. Escribinos por los canales de contacto para sumarte al equipo médico.',
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