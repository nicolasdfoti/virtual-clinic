type PlaceholderPageProps = {
  title: string
  description?: string
}

/** Pagina honesta para secciones que todavia no existen: dice que estan por
 *  venir en vez de simular datos o funcionalidad. */
export function PlaceholderPage({
  title,
  description = 'Esta sección va a estar disponible próximamente.',
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-2xl font-bold text-sky-900">{title}</h1>
        <p className="mt-2 text-slate-600">{description}</p>
      </div>
    </div>
  )
}
