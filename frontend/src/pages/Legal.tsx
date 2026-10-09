interface LegalPageProps {
  title: string;
  intro: string;
}

function LegalPage({ title, intro }: LegalPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
        <strong>BORRADOR</strong> — debe revisarlo un abogado antes de publicar.
      </p>
      <h1 className="mt-6 text-3xl font-bold text-sky-900 sm:text-4xl">{title}</h1>
      <p className="mt-4 leading-relaxed text-slate-600">{intro}</p>
      <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
        TODO(dueño): redactar los artículos de este documento con asesoramiento legal. Hoy es solo un
        marcador de posición.
      </p>
    </div>
  );
}

export function TermsPage() {
  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Acá van a estar los términos y condiciones de uso de la plataforma Clínica Virtual."
    />
  );
}

export function PrivacyPage() {
  return (
    <LegalPage
      title="Política de privacidad"
      intro="Acá va a estar la política de tratamiento de datos personales conforme la normativa vigente."
    />
  );
}