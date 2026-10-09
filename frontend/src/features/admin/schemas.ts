import { z } from 'zod'

const specialty = z
  .string()
  .trim()
  .min(1, 'Ingresá la especialidad.')
  .max(100, 'Máximo 100 caracteres.')

const licenseNumber = z
  .string()
  .trim()
  .min(1, 'Ingresá la matrícula.')
  .max(40, 'Máximo 40 caracteres.')

const bio = z
  .string()
  .trim()
  .max(500, 'Máximo 500 caracteres.')
  .optional()

export const doctorSchema = z.object({
  email: z.string().trim().min(1, 'Ingresá el email.').email('Ingresá un email válido.'),
  first_name: z
    .string()
    .trim()
    .min(1, 'Ingresá el nombre.')
    .max(80, 'Máximo 80 caracteres.'),
  last_name: z
    .string()
    .trim()
    .min(1, 'Ingresá el apellido.')
    .max(80, 'Máximo 80 caracteres.'),
  specialty,
  license_number: licenseNumber,
  bio,
})

export type DoctorFormValues = z.infer<typeof doctorSchema>

export const doctorProfileSchema = z.object({
  specialty,
  license_number: licenseNumber,
  bio,
})

export type DoctorProfileFormValues = z.infer<typeof doctorProfileSchema>
