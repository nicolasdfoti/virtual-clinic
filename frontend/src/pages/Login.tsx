import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../context/useAuth'
import { homeForRole } from '../routes/roleHome'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Si ProtectedRoute nos reboto, guarda donde queria ir el usuario. Si entro
  // directo a /login no hay `from`, y se cae al home del rol.
  const from = (location.state as { from?: string } | null)?.from

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')

    if (!email || !password) {
      setError('Completá todos los campos.')
      return
    }

    try {
      setIsLoading(true)

      const session = await login(email, password)

      navigate(from ?? homeForRole(session.role), { replace: true })
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No pudimos iniciar sesión. Intentá de nuevo.',
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-sky-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        {/* Header */}
        <div className="text-center">
          <Link
            to="/"
            className="text-2xl font-bold text-sky-900"
          >
            Clínica <span className="text-sky-600">Virtual</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-sky-900">
            Iniciar sesión
          </h1>

          <p className="mt-2 text-slate-600">
            Accedé a tu cuenta para gestionar tus turnos.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              autoComplete="email"
              disabled={isLoading}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="tu@email.com"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-slate-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Error */}
          {error && (
            <div
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Iniciando sesión…' : 'Iniciar sesión'}
          </button>

        </form>

        {/* Register */}
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Todavía no tenés una cuenta?{' '}
          <Link
            to="/register"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            Registrate
          </Link>
        </p>

      </div>
    </main>
  )
}

export default Login