import { z } from 'zod'

/** Bio del médico: opcional, máx 1000 caracteres. */
export const doctorBioSchema = z.object({
  bio: z
    .string()
    .max(1000, 'Máximo 1000 caracteres.')
    .nullable(),
})

export type DoctorBioFormValues = z.infer<typeof doctorBioSchema>