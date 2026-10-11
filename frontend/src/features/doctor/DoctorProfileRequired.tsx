import { Link } from 'react-router-dom'

import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { useAuth } from '../../context/useAuth'

export function DoctorProfileRequired() {
  const { user } = useAuth()

  return (
    <Card variant="outlined" padding="lg" className="text-center">
      <h2 className="text-lg font-semibold text-sky-900">
        No tenés un perfil de médico activo
      </h2>
      <p className="mt-2 text-slate-600">
        Para ver pacientes y turnos necesitás un perfil de médico habilitado.
      </p>
      {user?.role === 'ADMIN' && (
        <Link
          to="/app/admin"
          className={buttonClasses({ variant: 'primary', className: 'mt-4' })}
        >
          Habilitarme como médico
        </Link>
      )}
    </Card>
  )
}
