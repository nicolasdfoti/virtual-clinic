import api from '../../services/api'
import { profileApi } from './profileApi'

/** Cambia la contraseña del usuario autenticado. El backend reemite la cookie
 *  de sesion e invalida los tokens previos. */
export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  return api.patch<void>('/auth/password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}

export { profileApi }
