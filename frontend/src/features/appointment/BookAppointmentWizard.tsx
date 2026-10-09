import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { api } from '../../services/api'
import type { PublicDoctor } from '../directory/types'
import { bookAppointmentSchema, type BookAppointmentForm } from './schemas'
import { useBookAppointment, useDoctorSlots } from './hooks'
import { Card } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

const MAX_DATE = format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

const inputClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const selectClasses =
  'mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

const labelClasses = () => 'block text-sm font-medium text-slate-700'

type Step = 'doctor' | 'date' | 'slot' | 'confirm'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, "EEEE d 'de' MMMM", { locale: es })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const zoned = toZonedTime(date, CLINIC_TZ)
  return format(zoned, 'HH:mm', { locale: es })
}

function StepIndicator({ currentStep }: { currentStep: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: 'doctor', label: 'Médico' },
    { key: 'date', label: 'Día' },
    { key: 'slot', label: 'Horario' },
    { key: 'confirm', label: 'Confirmar' },
  ]
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <nav className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center" aria-label="Pasos para sacar turno">
      <ol className="flex flex-1 items-center gap-2 sm:gap-4">
        {steps.map((step, index) => (
          <li key={step.key} className="flex items-center">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
              index <= currentIndex
                ? 'bg-sky-600 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}>
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div className={`hidden h-1 flex-1 sm:block ${
                index < currentIndex ? 'bg-sky-600' : 'bg-slate-200'
              }`} />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

function DoctorStep({
  doctors,
  selectedDoctorId,
  onSelectDoctor,
}: {
  doctors: PublicDoctor[]
  selectedDoctorId: number | null
  onSelectDoctor: (id: number) => void
}) {
  useEffect(() => {
    if (doctors.length === 1) {
      onSelectDoctor(doctors[0].id)
    }
  }, [doctors, onSelectDoctor])

  if (doctors.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No hay médicos disponibles para agendar.</p>
      </div>
    )
  }

  if (doctors.length === 1) {
    return (
      <div className="mb-4 p-4 rounded-lg bg-sky-50 border border-sky-200">
        <p className="font-medium text-sky-900">Médico seleccionado:</p>
        <p className="text-sky-700">{doctors[0].name} — {doctors[0].specialty}</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {doctors.map(doctor => (
        <button
          key={doctor.id}
          type="button"
          onClick={() => onSelectDoctor(doctor.id)}
          className={`p-4 text-left transition-colors rounded-xl border-2 ${selectedDoctorId === doctor.id
            ? 'border-sky-500 bg-sky-50'
            : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
        >
          <div className="font-medium text-sky-900">{doctor.name}</div>
          <div className="text-sm text-slate-600">{doctor.specialty}</div>
          <div className="text-xs text-slate-500">Matrícula: {doctor.license_number}</div>
          {doctor.bio && <div className="mt-2 text-sm text-slate-500 line-clamp-2">{doctor.bio}</div>}
        </button>
      ))}
    </div>
  )
}

function DateStep({
  selectedDate,
  onSelectDate,
  minDate,
  maxDate,
}: {
  selectedDate: string | null
  onSelectDate: (date: string) => void
  minDate: string
  maxDate: string
}) {
  const days: { value: string; label: string; isPast: boolean }[] = []
  const today = new Date(minDate + 'T00:00:00')
  const end = new Date(maxDate + 'T00:00:00')

  for (let d = new Date(today); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = format(d, 'yyyy-MM-dd')
    days.push({
      value: iso,
      label: format(toZonedTime(d, CLINIC_TZ), "EEEE d 'de' MMMM", { locale: es }),
      isPast: d < new Date(),
    })
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {days.map(day => (
        <button
          key={day.value}
          type="button"
          onClick={() => !day.isPast && onSelectDate(day.value)}
          disabled={day.isPast}
          className={`p-4 text-left transition-colors rounded-xl border-2 ${selectedDate === day.value
            ? 'border-sky-500 bg-sky-50'
            : day.isPast
              ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
              : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
        >
          <div className="font-medium text-slate-900">{day.label}</div>
        </button>
      ))}
    </div>
  )
}

function SlotStep({
  slots,
  selectedSlot,
  onSelectSlot,
}: {
  slots: { start: string; end: string }[]
  selectedSlot: string | null
  onSelectSlot: (slot: string) => void
}) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-600">No hay horarios disponibles para este día.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {slots.map(slot => (
        <button
          key={slot.start}
          type="button"
          onClick={() => onSelectSlot(slot.start)}
          className={`p-4 text-center transition-colors rounded-xl border-2 ${selectedSlot === slot.start
            ? 'border-sky-500 bg-sky-50'
            : 'border-slate-200 hover:border-sky-300 hover:bg-slate-50'}`}
        >
          <div className="font-medium text-sky-900">{formatTime(slot.start)}</div>
          <div className="text-xs text-slate-500">— {formatTime(slot.end)}</div>
        </button>
      ))}
    </div>
  )
}

function ConfirmStep({
  doctor,
  date,
  slot,
  formData,
  onSubmit,
  isSubmitting,
  errorMessage,
}: {
  doctor: PublicDoctor | null
  date: string | null
  slot: string | null
  formData: Partial<BookAppointmentForm>
  onSubmit: (e: React.FormEvent) => void
  isSubmitting: boolean
  errorMessage?: string | null
}) {
  const [modality, setModality] = useState<BookAppointmentForm['modality']>(formData.modality || 'VIDEO')

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errorMessage}
        </div>
      )}
      <Card variant="outlined" padding="lg">
        <h3 className="text-lg font-semibold text-sky-900">Resumen del turno</h3>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Médico</dt>
            <dd className="font-medium text-slate-900">{doctor?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Especialidad</dt>
            <dd className="font-medium text-slate-900">{doctor?.specialty || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Día</dt>
            <dd className="font-medium text-slate-900">{date ? formatDate(date) : '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Horario</dt>
            <dd className="font-medium text-slate-900">{slot ? formatTime(slot) : '—'}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-slate-500">Modalidad</dt>
            <dd className="font-medium text-slate-900">{modality === 'VIDEO' ? 'Video' : 'Presencial'}</dd>
          </div>
          {formData.reason && (
            <div className="sm:col-span-2">
              <dt className="text-sm text-slate-500">Motivo</dt>
              <dd className="font-medium text-slate-900">{formData.reason}</dd>
            </div>
          )}
        </dl>
      </Card>

      <div className="space-y-4">
        <div>
          <label htmlFor="reason" className={labelClasses()}>
            Motivo de la consulta (opcional)
          </label>
          <textarea
            id="reason"
            {...formData.reason ? { defaultValue: formData.reason } : {}}
            rows={3}
            className={inputClasses}
            placeholder="Ej: Control anual, dolor de cabeza recurrente..."
            maxLength={500}
          />
        </div>

        <div>
          <label htmlFor="modality" className={labelClasses()}>Modalidad</label>
          <select
            id="modality"
            value={modality}
            onChange={e => setModality(e.target.value as 'VIDEO' | 'IN_PERSON')}
            className={selectClasses}
          >
            <option value="VIDEO">Videollamada</option>
            <option value="IN_PERSON">Presencial</option>
          </select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={() => window.history.back()}
            className={buttonClasses({ variant: 'outline', size: 'md' })}
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={buttonClasses({ size: 'md' })}
          >
            {isSubmitting ? 'Confirmando...' : 'Confirmar y agendar'}
          </button>
        </div>
      </div>
    </form>
  )
}

export function BookAppointmentWizard() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('doctor')
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const { data: doctors = [] } = useQuery({
    queryKey: ['public-doctors'],
    queryFn: () => api.get<PublicDoctor[]>('/public/doctors'),
    staleTime: 60_000,
  })

  const { data: slots = [] } = useDoctorSlots(
    selectedDoctorId ?? null,
    selectedDate ?? '',
    selectedDate ?? ''
  )

  const bookMutation = useBookAppointment()

  const form = useForm<BookAppointmentForm>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: {
      doctor_id: 0,
      starts_at: '',
      modality: 'VIDEO',
      reason: '',
    },
  })

  const handleDoctorSelect = (id: number) => {
    setSelectedDoctorId(id)
    setSelectedDate(null)
    setSelectedSlot(null)
    setStep('date')
  }

  const handleDateSelect = (date: string) => {
    setSelectedDate(date)
    setSelectedSlot(null)
    setStep('slot')
  }

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot)
    setStep('confirm')
  }

  const doctor = doctors.find(d => d.id === selectedDoctorId) || null

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDoctorId || !selectedSlot) return

    setErrorMessage(null)
    const data = form.getValues()
    try {
      const result = await bookMutation.mutateAsync({
        doctor_id: selectedDoctorId,
        starts_at: selectedSlot,
        reason: data.reason,
        modality: data.modality,
      })

      if (result) {
        navigate('/app/turnos', { replace: true })
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ?? 'Error al reservar el turno.'
          : err instanceof Error
          ? err.message
          : 'Error al reservar el turno.'
      setErrorMessage(message)
    }
  }

  const canGoBack = step !== 'doctor'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <StepIndicator currentStep={step} />

      {step === 'doctor' && (
        <DoctorStep
          doctors={doctors}
          selectedDoctorId={selectedDoctorId}
          onSelectDoctor={handleDoctorSelect}
        />
      )}

      {step === 'date' && (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Seleccioná el día para tu turno con <strong>{doctor?.name}</strong>
          </p>
          <DateStep
            selectedDate={selectedDate}
            onSelectDate={handleDateSelect}
            minDate={format(new Date(), 'yyyy-MM-dd')}
            maxDate={MAX_DATE}
          />
        </>
      )}

      {step === 'slot' && (
        <>
          <p className="mb-4 text-sm text-slate-600">
            Seleccioná el horario para el <strong>{selectedDate ? formatDate(selectedDate) : 'día seleccionado'}</strong>
          </p>
          <SlotStep
            slots={slots}
            selectedSlot={selectedSlot}
            onSelectSlot={handleSlotSelect}
          />
        </>
      )}

      {step === 'confirm' && (
        <ConfirmStep
          doctor={doctor}
          date={selectedDate}
          slot={selectedSlot}
          formData={form.getValues()}
          onSubmit={onSubmit}
          isSubmitting={bookMutation.isPending}
          errorMessage={errorMessage}
        />
      )}

      {canGoBack && step !== 'confirm' && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => {
              if (step === 'date') setStep('doctor')
              else if (step === 'slot') setStep('date')
            }}
            className={buttonClasses({ variant: 'outline', size: 'sm' })}
          >
            Volver
          </button>
        </div>
      )}
    </div>
  )
}