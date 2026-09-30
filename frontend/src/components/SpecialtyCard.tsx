import { Link } from 'react-router-dom'

type SpecialtyCardProps = {
  icon: string
  title: string
  description: string
  href?: string
}

function SpecialtyCard({
  icon,
  title,
  description,
  href,
}: SpecialtyCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">

      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-sky-100 text-2xl" aria-hidden="true">
        {icon}
      </div>

      <h3 className="text-xl font-bold text-sky-900">
        {title}
      </h3>

      <p className="mt-3 leading-relaxed text-slate-600">
        {description}
      </p>

      {href && (
        <Link to={href} className="mt-6 inline-flex items-center gap-1 font-semibold text-sky-600 hover:text-sky-700">
          Ver profesionales
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  )
}

export default SpecialtyCard
