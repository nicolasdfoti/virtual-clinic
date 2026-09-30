export type Professional = {
  id: string;
  name: string;
  specialty: string;
  specialtyId: string;
  licenseNumber: string;
  yearsExperience: number;
  languages: string[];
  modalities: ('video' | 'chat')[];
  availability: 'available' | 'busy' | 'unavailable';
  rating: number;
  reviewCount: number;
  price: number;
  avatar?: string;
  bio: string;
  education: string[];
  highlights: string[];
};

export const professionals: Professional[] = [
  {
    id: 'prof-1',
    name: 'Dra. María González',
    specialty: 'Medicina General',
    specialtyId: 'medicina-general',
    licenseNumber: 'MP 12345',
    yearsExperience: 15,
    languages: ['Español', 'Inglés'],
    modalities: ['video', 'chat'],
    availability: 'available',
    rating: 4.9,
    reviewCount: 127,
    price: 8500,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    bio: 'Médica general con amplia experiencia en atención primaria y telemedicina. Especializada en medicina preventiva y manejo de enfermedades crónicas.',
    education: ['Universidad de Buenos Aires - Medicina', 'Especialización en Medicina Familiar', 'Certificación en Telemedicina'],
    highlights: ['15+ años de experiencia', 'Especialista en medicina preventiva', 'Atención en español e inglés'],
  },
  {
    id: 'prof-2',
    name: 'Dr. Carlos Rodríguez',
    specialty: 'Pediatría',
    specialtyId: 'pediatria',
    licenseNumber: 'MP 23456',
    yearsExperience: 12,
    languages: ['Español', 'Portugués'],
    modalities: ['video'],
    availability: 'available',
    rating: 4.8,
    reviewCount: 89,
    price: 9500,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    bio: 'Pediatra dedicado al cuidado integral de niños y adolescentes. Experto en desarrollo infantil, vacunación y patologías pediátricas comunes.',
    education: ['Universidad Nacional de La Plata - Medicina', 'Especialización en Pediatría', 'Fellowship en Neonatología'],
    highlights: ['12 años en pediatría', 'Experto en desarrollo infantil', 'Atención bilingüe'],
  },
  {
    id: 'prof-3',
    name: 'Lic. Ana Martínez',
    specialty: 'Psicología',
    specialtyId: 'psicologia',
    licenseNumber: 'MP 34567',
    yearsExperience: 10,
    languages: ['Español'],
    modalities: ['video', 'chat'],
    availability: 'busy',
    rating: 4.9,
    reviewCount: 203,
    price: 7500,
    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=400&q=80',
    bio: 'Psicóloga clínica con enfoque cognitivo-conductual. Especializada en ansiedad, depresión, estrés laboral y terapia de pareja.',
    education: ['Universidad de Palermo - Psicología', 'Maestría en Terapia Cognitivo-Conductual', 'Certificación en EMDR'],
    highlights: ['Especialista en ansiedad y estrés', 'Terapia individual y de pareja', 'Modalidad chat disponible'],
  },
  {
    id: 'prof-4',
    name: 'Lic. Roberto Silva',
    specialty: 'Nutrición',
    specialtyId: 'nutricion',
    licenseNumber: 'MP 45678',
    yearsExperience: 8,
    languages: ['Español', 'Inglés'],
    modalities: ['video', 'chat'],
    availability: 'available',
    rating: 4.7,
    reviewCount: 67,
    price: 6800,
    avatar: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=400&q=80',
    bio: 'Nutricionista especializado en nutrición deportiva, obesidad y trastornos de la conducta alimentaria. Enfoque basado en evidencia.',
    education: ['Universidad de Buenos Aires - Nutrición', 'Especialización en Nutrición Deportiva', 'Diplomado en Obesidad'],
    highlights: ['Nutrición deportiva', 'Trastornos alimentarios', 'Planes personalizados'],
  },
  {
    id: 'prof-5',
    name: 'Dra. Patricia López',
    specialty: 'Dermatología',
    specialtyId: 'dermatologia',
    licenseNumber: 'MP 56789',
    yearsExperience: 18,
    languages: ['Español'],
    modalities: ['video'],
    availability: 'available',
    rating: 4.9,
    reviewCount: 156,
    price: 11000,
    avatar: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=400&q=80',
    bio: 'Dermatóloga con amplia experiencia en dermatología clínica, estética y quirúrgica. Pionera en teledermatología en Argentina.',
    education: ['Universidad Nacional de Córdoba - Medicina', 'Especialización en Dermatología', 'Fellowship en Dermatología Estética'],
    highlights: ['Pionera en teledermatología', '18 años de experiencia', 'Dermatología clínica y estética'],
  },
  {
    id: 'prof-6',
    name: 'Dra. Sofía Herrera',
    specialty: 'Ginecología',
    specialtyId: 'ginecologia',
    licenseNumber: 'MP 67890',
    yearsExperience: 14,
    languages: ['Español', 'Inglés', 'Francés'],
    modalities: ['video', 'chat'],
    availability: 'available',
    rating: 4.8,
    reviewCount: 134,
    price: 9800,
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    bio: 'Ginecóloga especializada en salud reproductiva, anticoncepción y menopausia. Enfoque integral y respetuoso.',
    education: ['Universidad de Buenos Aires - Medicina', 'Especialización en Ginecología', 'Maestría en Salud Reproductiva'],
    highlights: ['Salud reproductiva', 'Trilingüe', 'Anticoncepción y menopausia'],
  },
  {
    id: 'prof-7',
    name: 'Dr. Martín Torres',
    specialty: 'Cardiología',
    specialtyId: 'cardiologia',
    licenseNumber: 'MP 78901',
    yearsExperience: 20,
    languages: ['Español'],
    modalities: ['video'],
    availability: 'unavailable',
    rating: 4.9,
    reviewCount: 198,
    price: 12500,
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
    bio: 'Cardiólogo intervencionista con amplia experiencia en prevención cardiovascular, insuficiencia cardíaca y arritmias.',
    education: ['Universidad Nacional de Rosario - Medicina', 'Especialización en Cardiología', 'Fellowship en Cardiología Intervencionista'],
    highlights: ['20 años en cardiología', 'Prevención cardiovascular', 'Cardiología intervencionista'],
  },
  {
    id: 'prof-8',
    name: 'Dr. Andrés Morales',
    specialty: 'Traumatología',
    specialtyId: 'traumatologia',
    licenseNumber: 'MP 89012',
    yearsExperience: 11,
    languages: ['Español', 'Inglés'],
    modalities: ['video'],
    availability: 'available',
    rating: 4.7,
    reviewCount: 76,
    price: 9200,
    avatar: 'https://images.unsplash.com/photo-1605296867304-46d5465a13f1?auto=format&fit=crop&w=400&q=80',
    bio: 'Traumatólogo especializado en medicina deportiva, artroscopia y rehabilitación. Atiende atletas profesionales y amateurs.',
    education: ['Universidad de Buenos Aires - Medicina', 'Especialización en Traumatología', 'Fellowship en Medicina Deportiva'],
    highlights: ['Medicina deportiva', 'Artroscopia', 'Rehabilitación deportiva'],
  },
];

export function getProfessionalById(id: string): Professional | undefined {
  return professionals.find((p) => p.id === id);
}

export function getProfessionalsBySpecialty(specialtyId: string): Professional[] {
  return professionals.filter((p) => p.specialtyId === specialtyId);
}

export function getAvailableProfessionals(): Professional[] {
  return professionals.filter((p) => p.availability === 'available');
}

export function getProfessionalsByModality(modality: 'video' | 'chat'): Professional[] {
  return professionals.filter((p) => p.modalities.includes(modality));
}

export function searchProfessionals(query: string): Professional[] {
  const lowerQuery = query.toLowerCase();
  return professionals.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.specialty.toLowerCase().includes(lowerQuery) ||
      p.bio.toLowerCase().includes(lowerQuery)
  );
}