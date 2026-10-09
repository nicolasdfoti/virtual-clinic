import { z } from 'zod'

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export const linkPatientSchema = z
  .object({
    dni: z
      .string()
      .trim()
      .max(8, 'El DNI no puede superar los 8 dígitos.'),
    email: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (!data.dni && !data.email) {
      ctx.addIssue({
        code: 'custom',
        path: ['dni'],
        message: 'Ingresá el DNI o el email del paciente.',
      })
    }

    if (data.email && !EMAIL_PATTERN.test(data.email)) {
      ctx.addIssue({
        code: 'custom',
        path: ['email'],
        message: 'Ingresá un email válido.',
      })
    }
  })

export type LinkPatientFormValues = z.infer<typeof linkPatientSchema>
