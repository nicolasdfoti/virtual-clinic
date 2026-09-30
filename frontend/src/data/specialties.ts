export type Specialty = {
  id: string;
  name: string;
  description: string;
  icon: string;
  professionalCount: number;
  consultationType: 'video' | 'chat' | 'both';
};

export const specialties: Specialty[] = [
  {
    id: 'medicina-general',
    name: 'Medicina General',
    description: 'Consultas médicas generales para prevención, diagnóstico y seguimiento de patologías comunes.',
    icon: '🩺',
    professionalCount: 12,
    consultationType: 'both',
  },
  {
    id: 'pediatria',
    name: 'Pediatría',
    description: 'Atención especializada para niños y adolescentes, control de crecimiento y vacunación.',
    icon: '👶',
    professionalCount: 8,
    consultationType: 'video',
  },
  {
    id: 'psicologia',
    name: 'Psicología',
    description: 'Espacios de acompañamiento y atención para cuidar tu bienestar emocional y salud mental.',
    icon: '🧠',
    professionalCount: 15,
    consultationType: 'both',
  },
  {
    id: 'nutricion',
    name: 'Nutrición',
    description: 'Orientación profesional para desarrollar hábitos alimentarios saludables y planes personalizados.',
    icon: '🥗',
    professionalCount: 6,
    consultationType: 'both',
  },
  {
    id: 'dermatologia',
    name: 'Dermatología',
    description: 'Diagnóstico y tratamiento de afecciones de la piel, cabello y uñas mediante consulta virtual.',
    icon: '🔬',
    professionalCount: 4,
    consultationType: 'video',
  },
  {
    id: 'ginecologia',
    name: 'Ginecología',
    description: 'Atención integral de la salud reproductiva, control ginecológico y asesoramiento anticonceptivo.',
    icon: '👩‍⚕️',
    professionalCount: 7,
    consultationType: 'both',
  },
  {
    id: 'cardiologia',
    name: 'Cardiología',
    description: 'Prevención, diagnóstico y seguimiento de enfermedades cardiovasculares.',
    icon: '❤️',
    professionalCount: 5,
    consultationType: 'video',
  },
  {
    id: 'traumatologia',
    name: 'Traumatología',
    description: 'Evaluación y seguimiento de lesiones musculoesqueléticas, rehabilitación y deporte.',
    icon: '🦴',
    professionalCount: 6,
    consultationType: 'video',
  },
];

export function getSpecialtyById(id: string): Specialty | undefined {
  return specialties.find((s) => s.id === id);
}

export function getSpecialtiesByType(type: 'video' | 'chat' | 'both'): Specialty[] {
  return specialties.filter((s) => s.consultationType === type || s.consultationType === 'both');
}