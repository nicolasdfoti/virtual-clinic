export type Value = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const values: Value[] = [
  {
    id: 'confianza',
    title: 'Confianza',
    description: 'Construimos relaciones basadas en la transparencia, la honestidad y el cumplimiento de nuestra palabra con cada paciente y profesional.',
    icon: '🤝',
  },
  {
    id: 'accesibilidad',
    title: 'Accesibilidad',
    description: 'Eliminamos barreras geográficas, económicas y tecnológicas para que la atención médica de calidad esté al alcance de todos.',
    icon: '🌐',
  },
  {
    id: 'profesionalismo',
    title: 'Profesionalismo',
    description: 'Nuestro equipo médico cumple con los más altos estándares de formación, ética y actualización continua en sus especialidades.',
    icon: '🎓',
  },
  {
    id: 'privacidad',
    title: 'Privacidad',
    description: 'Protegemos la información sensible de nuestros usuarios con tecnología de vanguardia y cumplimiento estricto de normativas vigentes.',
    icon: '🔒',
  },
  {
    id: 'tecnologia',
    title: 'Tecnología al servicio de la salud',
    description: 'Innovamos constantemente para ofrecer una experiencia digital fluida, segura y que potencia la relación médico-paciente.',
    icon: '💻',
  },
  {
    id: 'paciente-centrico',
    title: 'Atención centrada en el paciente',
    description: 'Cada decisión la tomamos pensando en la experiencia, comodidad y bienestar de quien confía en nosotros su salud.',
    icon: '❤️',
  },
];

export type SecurityFeature = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const securityFeatures: SecurityFeature[] = [
  {
    id: 'cifrado',
    title: 'Comunicaciones protegidas',
    description: 'Las consultas se realizan por canales cifrados mediante videollamada o chat dentro de la plataforma.',
    icon: '🔐',
  },
  {
    id: 'datos',
    title: 'Solo los datos necesarios',
    description: 'Solicitamos únicamente los datos personales necesarios para coordinar y realizar la consulta.',
    icon: '📋',
  },
  {
    id: 'acceso',
    title: 'Acceso a tu cuenta',
    description: 'Tu cuenta requiere contraseña y solo vos podés acceder a la información de tus consultas.',
    icon: '🛡️',
  },
  {
    id: 'privacidad',
    title: 'Confidencialidad de la consulta',
    description: 'El detalle de cada consulta es confidencial entre vos y el profesional que la atiende.',
    icon: '📝',
  },
  {
    id: 'navegador',
    title: 'Acceso desde el navegador',
    description: 'No necesitás instalar aplicaciones: la plataforma funciona desde el navegador de tu dispositivo.',
    icon: '☁️',
  },
  {
    id: 'control',
    title: 'Vos tenés el control',
    description: 'Podés consultar qué información tuya tenemos almacenada y solicitar su eliminación escribiendo a nuestro equipo.',
    icon: '✍️',
  },
];

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar?: string;
  linkedin?: string;
};

export const teamMembers: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Dr. Alejandro Ruiz',
    role: 'Director Médico',
    bio: 'Médico clínico con 20 años de experiencia en gestión de salud y telemedicina. Lidera el comité médico y define estándares clínicos.',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'tm-2',
    name: 'Lic. Carolina Vega',
    role: 'Directora de Operaciones',
    bio: 'Especialista en gestión de servicios de salud y experiencia del paciente. Diseña los flujos de atención y calidad asistencial.',
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'tm-3',
    name: 'Ing. Marcos Silva',
    role: 'CTO',
    bio: 'Ingeniero en sistemas con foco en healthtech, seguridad de datos y arquitectura escalable. Lidera el desarrollo tecnológico.',
    avatar: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'tm-4',
    name: 'Dra. Lucía Fernández',
    role: 'Directora Clínica',
    bio: 'Psiquiatra y experta en salud mental digital. Supervisa la calidad de la atención psicológica y psiquiátrica en plataforma.',
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
  },
];