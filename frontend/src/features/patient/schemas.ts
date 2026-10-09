import { z } from 'zod'

/** Fecha de hoy en la zona de la clinica, como "YYYY-MM-DD". El backend vuelve
 *  a validar; aca es solo para dar feedback inmediato en el formulario. */
function clinicToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date())
}

function isValidDni(value: string): boolean {
  return value === '' || /^\d{7,8}$/.test(value)
}

function isValidPhone(value: string): boolean {
  if (value === '') {
    return true
  }

  const digits = value.replace(/\D/g, '')

  return /^[0-9+\-()\s]+$/.test(value) && digits.length >= 6
}

export const profileSchema = z.object({
  dni: z
    .string()
    .refine(isValidDni, {
      message: 'El DNI debe tener entre 7 y 8 dígitos, sin puntos.',
    }),
  birth_date: z
    .string()
    .refine((value) => value === '' || value <= clinicToday(), {
      message: 'La fecha de nacimiento no puede ser futura.',
    }),
  sex: z
    .string()
    .max(30, 'Máximo 30 caracteres.'),
  phone: z
    .string()
    .refine(isValidPhone, { message: 'Ingresá un teléfono válido.' }),
  address: z
    .string()
    .max(200, 'Máximo 200 caracteres.'),
  city: z
    .string()
    .max(100, 'Máximo 100 caracteres.'),
  insurance_provider: z
    .string()
    .max(120, 'Máximo 120 caracteres.'),
  insurance_plan: z
    .string()
    .max(120, 'Máximo 120 caracteres.'),
  insurance_member_number: z
    .string()
    .max(60, 'Máximo 60 caracteres.'),
  emergency_contact_name: z
    .string()
    .max(120, 'Máximo 120 caracteres.'),
  emergency_contact_phone: z
    .string()
    .refine(isValidPhone, { message: 'Ingresá un teléfono válido.' }),
})

export type ProfileFormValues = z.infer<typeof profileSchema>
