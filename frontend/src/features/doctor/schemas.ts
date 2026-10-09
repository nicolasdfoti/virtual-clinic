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

export const prescriptionItemSchema = z.object({
  medication: z
    .string()
    .trim()
    .min(1, 'Ingresá el medicamento.')
    .max(200, 'El medicamento no puede superar los 200 caracteres.'),
  dose: z
    .string()
    .trim()
    .min(1, 'Ingresá la dosis.')
    .max(100, 'La dosis no puede superar los 100 caracteres.'),
  frequency: z
    .string()
    .trim()
    .min(1, 'Ingresá la frecuencia.')
    .max(200, 'La frecuencia no puede superar los 200 caracteres.'),
  duration: z
    .string()
    .trim()
    .min(1, 'Ingresá la duración.')
    .max(100, 'La duración no puede superar los 100 caracteres.'),
  instructions: z
    .string()
    .trim()
    .max(500, 'Las indicaciones no pueden superar los 500 caracteres.')
    .optional()
    .or(z.literal('')),
})

export const prescriptionFormSchema = z.object({
  items: z
    .array(prescriptionItemSchema)
    .min(1, 'Agregá al menos un medicamento.'),
})

export type PrescriptionItemFormValues = z.infer<typeof prescriptionItemSchema>
export type PrescriptionFormValues = z.infer<typeof prescriptionFormSchema>

export const medicalOrderTypeSchema = z.enum([
  'LAB',
  'IMAGING',
  'REFERRAL',
  'OTHER',
])

export const medicalOrderFormSchema = z.object({
  type: medicalOrderTypeSchema,
  studies: z
    .string()
    .trim()
    .min(1, 'Ingresá los estudios solicitados.')
    .max(5000, 'Los estudios no pueden superar los 5000 caracteres.'),
  presumptive_diagnosis: z
    .string()
    .trim()
    .max(500, 'El diagnóstico presuntivo no puede superar los 500 caracteres.')
    .optional()
    .or(z.literal('')),
})

export type MedicalOrderFormValues = z.infer<typeof medicalOrderFormSchema>
