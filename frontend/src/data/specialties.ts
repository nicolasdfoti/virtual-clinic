export type Specialty = {
  id: string
  name: string
  description: string
  icon: string
}

export const specialties: Specialty[] = [
  {
    id: 'medicina-general',
    name: 'Medicina General',
    description: 'Consultas médicas generales para prevención, diagnóstico y seguimiento de enfermedades comunes.',
    icon: '🩺',
  },
  {
    id: 'pediatria',
    name: 'Pediatría',
    description: 'Control de salud y atención de niños, niñas y adolescentes.',
    icon: '👶',
  },
  {
    id: 'cardiologia',
    name: 'Cardiología',
    description: 'Prevención, diagnóstico y tratamiento de enfermedades del corazón y del sistema circulatorio.',
    icon: '❤️',
  },
  {
    id: 'dermatologia',
    name: 'Dermatología',
    description: 'Estudio y tratamiento de las enfermedades de la piel, el cabello y las uñas.',
    icon: '🧴',
  },
  {
    id: 'psicologia',
    name: 'Psicología',
    description: 'Acompañamiento y tratamiento de la salud mental para todas las edades.',
    icon: '🧠',
  },
  {
    id: 'ginecologia',
    name: 'Ginecología y Obstetricia',
    description: 'Salud integral de la mujer, incluyendo el control del embarazo.',
    icon: '🌷',
  },
  {
    id: 'nutricion',
    name: 'Nutrición',
    description: 'Orientación alimentaria y planes de alimentación personalizados.',
    icon: '🥗',
  },
  {
    id: 'clinica-medica',
    name: 'Clínica Médica',
    description: 'Estudio integral del paciente adulto y coordinación entre especialistas.',
    icon: '🏥',
  },
]