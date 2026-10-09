import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toZonedTime } from 'date-fns-tz'
import { forwardRef, useState, type TextareaHTMLAttributes } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'

import { Badge, Card, TextField } from '../../components/ui'
import { buttonClasses } from '../../components/ui/buttonStyles'
import { ApiError, apiFileUrl } from '../../services/api'
import {
  useCancelOrder,
  useCancelPrescription,
  useCreateOrder,
  useCreatePrescription,
  useDoctorAppointments,
  useDoctorPatient,
  usePatientOrders,
  usePatientPrescriptions,
} from './hooks'
import {
  medicalOrderFormSchema,
  prescriptionFormSchema,
  type MedicalOrderFormValues,
  type PrescriptionFormValues,
} from './schemas'
import type {
  DoctorPatientDetail,
  MedicalOrder,
  Prescription,
} from './types'

const CLINIC_TZ = 'America/Argentina/Buenos_Aires'

const TABS = ['Perfil', 'Recetas', 'Órdenes', 'Turnos'] as const
type Tab = (typeof TABS)[number]

function value(content: string | null): string {
  return content ?? '—'
}

function formatDateTime(dateStr: string): string {
  const zoned = toZonedTime(new Date(dateStr), CLINIC_TZ)
  return format(zoned, "d 'de' MMMM yyyy, HH:mm", { locale: es })
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, error, id, name, className = '', ...props }, ref) => {
    const fieldId = id ?? name
    const errorId = error ? `${fieldId}-error` : undefined

    return (
      <div>
        <label htmlFor={fieldId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          name={name}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={`mt-2 w-full rounded-lg border px-4 py-3 outline-none transition focus:ring-2 ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
              : 'border-slate-300 focus:border-sky-500 focus:ring-sky-100'
          } ${className}`}
          {...props}
        />
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    )
  },
)
TextArea.displayName = 'TextArea'

function StatusBadge({ status }: { status: 'ACTIVE' | 'CANCELLED' }) {
  return (
    <Badge variant={status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
      {status === 'ACTIVE' ? 'Activa' : 'Anulada'}
    </Badge>
  )
}

function ProfileTab({ patient }: { patient: DoctorPatientDetail }) {
  const rows: Array<[string, string]> = [
    ['DNI', value(patient.dni)],
    ['Fecha de nacimiento', value(patient.birth_date)],
    ['Sexo', value(patient.sex)],
    ['Teléfono', value(patient.phone)],
    ['Email', patient.email],
    ['Domicilio', value(patient.address)],
    ['Ciudad', value(patient.city)],
    ['Obra social', value(patient.insurance_provider)],
    ['Plan', value(patient.insurance_plan)],
    ['N° de afiliado', value(patient.insurance_member_number)],
    ['Contacto de emergencia', value(patient.emergency_contact_name)],
    ['Teléfono de emergencia', value(patient.emergency_contact_phone)],
  ]

  return (
    <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, content]) => (
        <div key={label}>
          <dt className="text-sm font-medium text-slate-500">{label}</dt>
          <dd className="mt-0.5 text-slate-900">{content}</dd>
        </div>
      ))}
    </dl>
  )
}

const EMPTY_ITEM = {
  medication: '',
  dose: '',
  frequency: '',
  duration: '',
  instructions: '',
}

function PrescriptionForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: PrescriptionFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PrescriptionFormValues>({
    resolver: zodResolver(prescriptionFormSchema),
    defaultValues: { items: [{ ...EMPTY_ITEM }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      noValidate
    >
      {fields.map((field, index) => (
        <fieldset key={field.id} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <legend className="px-1 text-sm font-semibold text-sky-900">
            Medicamento {index + 1}
          </legend>

          <div className="grid gap-3 sm:grid-cols-2">
            <TextField
              label="Medicamento"
              error={errors.items?.[index]?.medication?.message}
              {...register(`items.${index}.medication`)}
            />
            <TextField
              label="Dosis (ej. 500 mg)"
              error={errors.items?.[index]?.dose?.message}
              {...register(`items.${index}.dose`)}
            />
            <TextField
              label="Frecuencia (ej. cada 8 horas)"
              error={errors.items?.[index]?.frequency?.message}
              {...register(`items.${index}.frequency`)}
            />
            <TextField
              label="Duración (ej. 7 días)"
              error={errors.items?.[index]?.duration?.message}
              {...register(`items.${index}.duration`)}
            />
          </div>

          <TextArea
            label="Indicaciones adicionales (opcional)"
            rows={2}
            error={errors.items?.[index]?.instructions?.message}
            {...register(`items.${index}.instructions`)}
          />

          {fields.length > 1 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-sm font-medium text-red-600 hover:underline"
            >
              Quitar medicamento
            </button>
          )}
        </fieldset>
      ))}

      {errors.items?.root?.message && (
        <p role="alert" className="text-sm text-red-600">
          {errors.items.root.message}
        </p>
      )}

      <button
        type="button"
        onClick={() => append({ ...EMPTY_ITEM })}
        className="text-sm font-medium text-sky-700 hover:underline"
      >
        + Agregar medicamento
      </button>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonClasses({ size: 'sm' })}>
          {isSubmitting ? 'Emitiendo…' : 'Emitir receta'}
        </button>
      </div>
    </form>
  )
}

function PrescriptionsTab({
  patientId,
  prescriptions,
  isLoading,
}: {
  patientId: number
  prescriptions: Prescription[]
  isLoading: boolean
}) {
  const createPrescription = useCreatePrescription(patientId)
  const cancelPrescription = useCancelPrescription(patientId)
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (values: PrescriptionFormValues) => {
    try {
      await createPrescription.mutateAsync({ patient_id: patientId, items: values.items })
      setShowForm(false)
    } catch {
      // El error se muestra desde createPrescription.error.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-sky-900">Recetas e indicaciones</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className={buttonClasses({ size: 'sm' })}
        >
          Nueva receta
        </button>
      </div>

      {createPrescription.error instanceof ApiError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {createPrescription.error.message}
        </p>
      )}

      {showForm && <PrescriptionForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      {isLoading && <p className="py-8 text-center text-slate-500">Cargando recetas…</p>}

      {!isLoading && prescriptions.length === 0 && (
        <p className="py-8 text-center text-slate-600">No hay recetas emitidas para este paciente.</p>
      )}

      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <div key={prescription.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sky-900">Receta {prescription.folio}</span>
                  <span className="text-sm text-slate-600">
                    Emitida: {formatDateTime(prescription.issued_at)}
                  </span>
                </div>
                <StatusBadge status={prescription.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-600">
                  {prescription.items.length} medicamento
                  {prescription.items.length === 1 ? '' : 's'}
                </span>
                <a
                  href={apiFileUrl(`/prescriptions/${prescription.id}/pdf`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 hover:underline"
                >
                  Descargar PDF
                </a>
                {prescription.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo de la anulación (opcional):')
                      if (reason !== null) {
                        cancelPrescription.mutate({ prescriptionId: prescription.id, reason })
                      }
                    }}
                    disabled={cancelPrescription.isPending}
                    className={buttonClasses({ variant: 'danger', size: 'sm' })}
                  >
                    {cancelPrescription.isPending ? 'Anulando…' : 'Anular'}
                  </button>
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-2">
              {prescription.items.map((item) => (
                <li key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <span className="font-medium text-slate-900">{item.medication}</span>
                  <span className="text-slate-600">
                    {' '}
                    — {item.dose}, {item.frequency}, {item.duration}
                  </span>
                  {item.instructions && (
                    <p className="mt-1 text-slate-600">{item.instructions}</p>
                  )}
                </li>
              ))}
            </ul>

            {prescription.cancel_reason && (
              <p className="mt-3 text-sm text-red-700">Motivo de anulación: {prescription.cancel_reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function OrderForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (values: MedicalOrderFormValues) => Promise<void>
  onCancel: () => void
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MedicalOrderFormValues>({
    resolver: zodResolver(medicalOrderFormSchema),
    defaultValues: { type: 'LAB', studies: '', presumptive_diagnosis: '' },
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4"
      noValidate
    >
      <div>
        <label htmlFor="order-type" className="block text-sm font-medium text-slate-700">
          Tipo de orden
        </label>
        <select
          id="order-type"
          className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          {...register('type')}
        >
          <option value="LAB">Laboratorio</option>
          <option value="IMAGING">Imágenes</option>
          <option value="REFERRAL">Interconsulta</option>
          <option value="OTHER">Otro</option>
        </select>
      </div>

      <TextArea
        label="Estudios solicitados"
        rows={4}
        error={errors.studies?.message}
        {...register('studies')}
      />

      <TextArea
        label="Diagnóstico presuntivo (opcional)"
        rows={2}
        error={errors.presumptive_diagnosis?.message}
        {...register('presumptive_diagnosis')}
      />

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
          Cancelar
        </button>
        <button type="submit" disabled={isSubmitting} className={buttonClasses({ size: 'sm' })}>
          {isSubmitting ? 'Emitiendo…' : 'Emitir orden'}
        </button>
      </div>
    </form>
  )
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  LAB: 'Laboratorio',
  IMAGING: 'Imágenes',
  REFERRAL: 'Interconsulta',
  OTHER: 'Otro',
}

function OrdersTab({
  patientId,
  orders,
  isLoading,
}: {
  patientId: number
  orders: MedicalOrder[]
  isLoading: boolean
}) {
  const createOrder = useCreateOrder(patientId)
  const cancelOrder = useCancelOrder(patientId)
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async (values: MedicalOrderFormValues) => {
    try {
      await createOrder.mutateAsync({
        patient_id: patientId,
        type: values.type,
        studies: values.studies,
        presumptive_diagnosis: values.presumptive_diagnosis || null,
      })
      setShowForm(false)
    } catch {
      // El error se muestra desde createOrder.error.
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold text-sky-900">Órdenes médicas</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          disabled={showForm}
          className={buttonClasses({ size: 'sm' })}
        >
          Nueva orden
        </button>
      </div>

      {createOrder.error instanceof ApiError && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {createOrder.error.message}
        </p>
      )}

      {showForm && <OrderForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} />}

      {isLoading && <p className="py-8 text-center text-slate-500">Cargando órdenes…</p>}

      {!isLoading && orders.length === 0 && (
        <p className="py-8 text-center text-slate-600">No hay órdenes emitidas para este paciente.</p>
      )}

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-sky-900">
                    {ORDER_TYPE_LABELS[order.type] ?? order.type} — {order.folio}
                  </span>
                  <span className="text-sm text-slate-600">
                    Emitida: {formatDateTime(order.issued_at)}
                  </span>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href={apiFileUrl(`/prescriptions/orders/${order.id}/pdf`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 hover:underline"
                >
                  Descargar PDF
                </a>
                {order.status === 'ACTIVE' && (
                  <button
                    onClick={() => {
                      const reason = prompt('Motivo de la anulación (opcional):')
                      if (reason !== null) {
                        cancelOrder.mutate({ orderId: order.id, reason })
                      }
                    }}
                    disabled={cancelOrder.isPending}
                    className={buttonClasses({ variant: 'danger', size: 'sm' })}
                  >
                    {cancelOrder.isPending ? 'Anulando…' : 'Anular'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h4 className="mb-2 font-medium text-slate-900">Estudios solicitados</h4>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{order.studies}</p>
            </div>

            {order.presumptive_diagnosis && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h4 className="mb-2 font-medium text-slate-900">Diagnóstico presuntivo</h4>
                <p className="text-sm text-slate-700">{order.presumptive_diagnosis}</p>
              </div>
            )}

            {order.cancel_reason && (
              <p className="mt-3 text-sm text-red-700">Motivo de anulación: {order.cancel_reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function AppointmentsTab({ patientId }: { patientId: number }) {
  const { data, isLoading } = useDoctorAppointments()
  const appointments = (data ?? []).filter((appointment) => appointment.patient_id === patientId)

  if (isLoading) {
    return <p className="py-8 text-center text-slate-500">Cargando turnos…</p>
  }

  if (appointments.length === 0) {
    return <p className="py-8 text-center text-slate-600">No hay turnos con este paciente.</p>
  }

  return (
    <div className="space-y-3">
      {appointments.map((appointment) => (
        <Link
          key={appointment.id}
          to={`/app/medico/turnos/${appointment.id}`}
          className="flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="font-medium text-sky-900">{formatDateTime(appointment.starts_at)}</span>
          <span className="text-sm text-slate-600">
            {appointment.modality === 'VIDEO' ? 'Videollamada' : 'Presencial'} — {appointment.status}
          </span>
        </Link>
      ))}
    </div>
  )
}

export function DoctorPatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>()
  const id = Number(patientId)
  const [tab, setTab] = useState<Tab>('Perfil')

  const { data, isLoading, isError, error } = useDoctorPatient(id)
  const { data: prescriptions, isLoading: prescriptionsLoading } = usePatientPrescriptions(id)
  const { data: orders, isLoading: ordersLoading } = usePatientOrders(id)

  const notFound = error instanceof ApiError && error.status === 404

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/app/medico" className="text-sm font-medium text-sky-700 hover:underline">
        ← Volver a mis pacientes
      </Link>

      {isLoading && (
        <p role="status" className="mt-6 text-slate-500">
          Cargando el perfil…
        </p>
      )}

      {isError && (
        <p role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {notFound
            ? 'No encontramos ese paciente entre los que atendés.'
            : 'No pudimos cargar el perfil. Recargá la página e intentá de nuevo.'}
        </p>
      )}

      {data && (
        <>
          <header className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-sky-900 sm:text-3xl">
              {data.first_name} {data.last_name}
            </h1>
            {!data.is_complete && (
              <Badge variant="warning" size="sm">
                Perfil incompleto
              </Badge>
            )}
          </header>

          <div
            role="tablist"
            aria-label="Secciones del paciente"
            className="mt-6 flex flex-wrap gap-1 border-b border-slate-200"
          >
            {TABS.map((item) => (
              <button
                key={item}
                role="tab"
                type="button"
                aria-selected={tab === item}
                onClick={() => setTab(item)}
                className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                  tab === item
                    ? 'border-b-2 border-sky-600 text-sky-700'
                    : 'text-slate-600 hover:text-sky-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <Card variant="outlined" padding="lg" className="mt-6">
            {tab === 'Perfil' && <ProfileTab patient={data} />}
            {tab === 'Recetas' && (
              <PrescriptionsTab
                patientId={id}
                prescriptions={prescriptions ?? []}
                isLoading={prescriptionsLoading}
              />
            )}
            {tab === 'Órdenes' && (
              <OrdersTab patientId={id} orders={orders ?? []} isLoading={ordersLoading} />
            )}
            {tab === 'Turnos' && <AppointmentsTab patientId={id} />}
          </Card>
        </>
      )}
    </div>
  )
}
