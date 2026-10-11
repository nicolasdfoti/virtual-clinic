export type HowItWorksStep = {
  id: string
  number: number
  title: string
  description: string
  icon: string
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    id: 'step-1',
    number: 1,
    title: 'Registrate y completá tu perfil',
    description: 'Creá tu cuenta online y cargá tus datos personales para empezar.',
    icon: '👤',
  },
  {
    id: 'step-2',
    number: 2,
    title: 'Elegí día y horario',
    description: 'Seleccioná al profesional y elegí la franja que mejor te quede.',
    icon: '📅',
  },
  {
    id: 'step-3',
    number: 3,
    title: 'Consultá por videollamada o presencial y recibí tus recetas y órdenes en tu portal',
    description: 'Elegí la consulta por videollamada desde el navegador o el turno presencial, y todo queda registrado en tu portal.',
    icon: '💻',
  },
]