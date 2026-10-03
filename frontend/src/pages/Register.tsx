import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
  
function Register() {
  const navigate = useNavigate()
  const [first_name, setFirstName] = useState('')
  const [last_name, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('') 
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!first_name || !last_name || !email || !password || !confirmPassword) {
      setError('Completá todos los campos.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    try {
      setIsLoading(true)

      await api.post("/auth/register", {
        first_name,
        last_name,
        email,
        password,
      })

      setSuccess("Cuenta creada correctamente")
      setTimeout(() => {
        navigate("/login")
      }, 1500)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ocurrió un error al crear la cuenta.",
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
            Clínica<span className="text-sky-600">Virtual</span>
          </Link>

          <h1 className="mt-8 text-3xl font-bold text-sky-900">
            Crear cuenta
          </h1>

          <p className="mt-2 text-slate-600">
            Registrate para gestionar tus turnos médicos.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* First Name */}
          <div>
            <label
              htmlFor="first_name"
              className="block text-sm font-medium text-slate-700"
            >
              Nombre
            </label>

            <input
              id="first_name"
              name="first_name"
              type="text"
              autoComplete="given-name"
              disabled={isLoading}
              value={first_name}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Juan"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Last Name */}
          <div>
            <label
              htmlFor="last_name"
              className="block text-sm font-medium text-slate-700"
            >
              Apellido
            </label>

            <input
              id="last_name"
              name="last_name"
              type="text"
              autoComplete="family-name"
              disabled={isLoading}
              value={last_name}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Pérez"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

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
              name="email"
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
              name="password"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700"
            >
              Confirmar contraseña
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isLoading}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
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

          {/* Success */}
          {success && (
            <div
              className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              role="status"
            >
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

        </form>

        {/* Login */}
        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Ya tenés una cuenta?{' '}
          <Link
            to="/login"
            className="font-semibold text-sky-600 hover:text-sky-700"
          >
            Iniciar sesión
          </Link>
        </p>

      </div>
    </main>
  )
}

export default Register