import { Link } from 'react-router-dom'

import { buttonClasses } from '../../components/ui/buttonStyles'
import { usePatientProfile } from './usePatientProfile'

/** Aviso para el home del paciente cuando todavia faltan datos. Mientras se
 *  carga o si el perfil ya esta completo no renderiza nada. */
export function ProfileIncompleteBanner() {
  const { data, isLoading } = usePatientProfile()

  if (isLoading || !data || data.is_complete) {
    return null
  }

  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
    >
      <p className="text-sm text-amber-800">
        Completá tu perfil para que tu médico tenga tus datos antes de la
        consulta.
      </p>

      <Link
        to="/app/perfil"
        className={buttonClasses({ variant: 'outline', size: 'sm' })}
      >
        Completar perfil
      </Link>
    </div>
  )
}
