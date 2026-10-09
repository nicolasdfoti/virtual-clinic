export type Value = {
  id: string
  title: string
  description: string
  icon: string
}

export const values: Value[] = [
  {
    id: 'cercania',
    title: 'Cercanía',
    description: 'Una atención a distancia con un trato humano, en un entorno digital.',
    icon: '🤝',
  },
  {
    id: 'simple',
    title: 'Simplicidad',
    description: 'Una plataforma clara, pensada para que cualquier persona pueda usarla.',
    icon: '✨',
  },
  {
    id: 'celebracion',
    title: 'Celebración',
    description: 'Disfrutamos de los logros en salud: los festejamos junto a quienes los conquistaron.',
    icon: '🎉',
  },
]

export type SecurityFeature = {
  id: string
  title: string
  description: string
  icon: string
}

export const securityFeatures: SecurityFeature[] = [
  {
    id: 'datos-minimos',
    title: 'Solo los datos necesarios',
    description: 'Pedimos únicamente la información necesaria para coordinar y realizar la consulta.',
    icon: '📋',
  },
  {
    id: 'acceso-cuenta',
    title: 'Acceso con tu cuenta',
    description: 'Tu cuenta está protegida por contraseña y solo vos podés acceder a tus consultas.',
    icon: '🔑',
  },
  {
    id: 'confidencialidad',
    title: 'Confidencialidad de la consulta',
    description: 'Todo lo que pasa en la consulta es privado entre vos y el profesional que te atiende.',
    icon: '🔒',
  },
  {
    id: 'tu-control',
    title: 'Vos tenés el control',
    description: 'Podés consultar qué información tuya guardamos y pedir su eliminación por los canales de contacto.',
    icon: '✍️',
  },
]