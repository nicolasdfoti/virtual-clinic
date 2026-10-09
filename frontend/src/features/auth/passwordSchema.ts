import { z } from 'zod'

// bcrypt trunca a 72 bytes: la misma regla que aplica el backend.
const MAX_PASSWORD_BYTES = 72

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length
}

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Ingresá tu contraseña actual.'),
    new_password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .refine(
        (value) => byteLength(value) <= MAX_PASSWORD_BYTES,
        'La contraseña es demasiado larga.',
      ),
    confirm_password: z.string(),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    path: ['confirm_password'],
    message: 'Las contraseñas no coinciden.',
  })

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>
