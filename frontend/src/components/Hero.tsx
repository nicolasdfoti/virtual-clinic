import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section id="home" className="bg-gradient-to-br from-sky-50 via-white to-teal-50 pb-16 pt-10 sm:pb-20 sm:pt-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-4 font-semibold text-sky-600">
              Atención médica online
            </p>

            <h1 className="text-4xl font-bold leading-tight text-sky-900 sm:text-5xl lg:text-6xl">
              Tu salud,
              <span className="text-sky-600"> estés donde estés.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Clínica Virtual es una plataforma de telemedicina que conecta pacientes
              con profesionales de la salud por videollamada o chat, sin traslados
              y sin esperas.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/professionals"
                className="rounded-full bg-sky-600 px-7 py-3.5 text-center font-semibold text-white shadow-lg transition hover:bg-sky-700"
              >
                Buscar profesional
              </Link>

              <Link
                to="/specialties"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-center font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-600"
              >
                Ver especialidades
              </Link>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=1200&q=80"
              alt="Profesional médico atendiendo una consulta online"
              className="h-[420px] w-full rounded-3xl object-cover shadow-2xl lg:h-[500px]"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
