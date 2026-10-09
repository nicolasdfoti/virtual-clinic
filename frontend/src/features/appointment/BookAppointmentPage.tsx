import { BookAppointmentWizard } from './BookAppointmentWizard'

export function BookAppointmentPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-sky-900">Sacá un turno</h1>
      <BookAppointmentWizard />
    </div>
  )
}