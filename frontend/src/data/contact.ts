export type ContactInfo = {
  email: string;
  phone: string;
  address: string;
  hours: string;
  social: {
    linkedin: string;
    twitter: string;
    instagram: string;
  };
};

export const contactInfo: ContactInfo = {
  email: 'hola@saludonline.ar',
  phone: '+54 11 4000-0000',
  address: 'Av. Corrientes 1234, CABA, Argentina',
  hours: 'Lunes a Viernes 9:00 - 18:00',
  social: {
    linkedin: 'https://linkedin.com/company/saludonline',
    twitter: 'https://twitter.com/saludonline',
    instagram: 'https://instagram.com/saludonline',
  },
};

export type ContactFormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export const contactSubjects = [
  { value: 'general', label: 'Consulta general' },
  { value: 'turnos', label: 'Problemas con turnos' },
  { value: 'tecnico', label: 'Soporte técnico' },
  { value: 'profesional', label: 'Quiero ser profesional' },
  { value: 'institucional', label: 'Consulta institucional' },
  { value: 'privacidad', label: 'Privacidad y datos' },
  { value: 'otro', label: 'Otro' },
];