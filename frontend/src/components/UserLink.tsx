import { useAuth } from '../context/useAuth'
import { Link } from 'react-router-dom'

type UserLinkProps = {
  userId: number
  name: string
}

/** Link a perfil de usuario que se muestra como enlace solo si el visor tiene permiso
 *  para ver ese perfil (según la política del backend). Si no tiene permiso, muestra solo texto. */
export function UserLink({ userId, name }: UserLinkProps) {
  const { user: viewer } = useAuth()

  if (!viewer) {
    return <span>{name}</span>
  }

  // No mostramos enlace al propio perfil (está en /app/perfil)
  if (userId === viewer.id) {
    return <span>{name}</span>
  }

  // Para PATIENT: no mostramos enlaces a otros usuarios (el backend decide)
  // Para DOCTOR/ADMIN: siempre muestran enlace
  if (viewer.role === 'PATIENT') {
    return <span>{name}</span>
  }

  // DOCTOR y ADMIN: siempre muestran enlace
  return (
    <Link to={`/app/perfiles/${userId}`} className="text-sky-600 hover:underline">
      {name}
    </Link>
  )
}