/** Datos públicos de la clínica.
 *
 *  TODO(dueño): completar los valores reales antes de publicar. Lo que hay acá
 *  son placeholders que no deben llegar a producción tal cual.
 */
export interface ClinicConfig {
  name: string
  email: string
  phone: string
  whatsapp: string
  address: string
  hours: string
  social: {
    instagram: string
    facebook: string
  }
}

export const clinic: ClinicConfig = {
  name: 'Clínica Virtual', // TODO(dueño): nombre legal / razón social real
  email: 'contacto@clinicavirtual.com.ar', // TODO(dueño): canal oficial de contacto
  phone: '+54 11 5555-5555', // TODO(dueño): teléfono real de la clínica
  whatsapp: '+54 11 5555-5555', // TODO(dueño): número de WhatsApp (puede coincidir con el teléfono)
  address: 'Calle 123, CABA', // TODO(dueño): dirección física del consultorio (si corresponde)
  hours: 'Lunes a viernes, de 9 a 18', // TODO(dueño): horario real de atención
  social: {
    instagram: 'https://instagram.com/clinicavirtual', // TODO(dueño): cuenta real
    facebook: 'https://facebook.com/clinicavirtual', // TODO(dueño): cuenta real
  },
}