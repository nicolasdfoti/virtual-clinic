import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthProvider'
import { MainLayout, AuthLayout } from './layouts/MainLayout'
import { AppShell } from './layouts/AppShell'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { UnauthorizedRedirect } from './routes/UnauthorizedRedirect'
import { ApiError } from './services/api'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Professionals from './pages/Professionals'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import { TermsPage, PrivacyPage } from './pages/Legal'
import { PatientHome } from './pages/portal/PatientHome'
import { PlaceholderPage } from './pages/portal/PlaceholderPage'
import { ProfilePage } from './features/patient/ProfilePage'
import { ChangePasswordPage } from './features/auth/ChangePasswordPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Los errores de cliente (4xx) no se reintentan: no van a cambiar solos.
      // Los de red/5xx si, una sola vez.
      retry: (failureCount, error) => {
        if (
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) {
          return false
        }

        return failureCount < 1
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <UnauthorizedRedirect />

          <Routes>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/professionals" element={<Professionals />} />
              <Route path="/professionals/:id" element={<Navigate to="/professionals" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terminos" element={<TermsPage />} />
              <Route path="/privacidad" element={<PrivacyPage />} />

              {/* Rutas anteriores o no vigentes: se redirigen para no romper
                  links viejos. `/pacientes` y `/patients` ahora viven en el
                  portal. */}
              <Route path="/services" element={<Navigate to="/professionals" replace />} />
              <Route path="/specialties" element={<Navigate to="/professionals" replace />} />
              <Route path="/specialties/:specialtyId" element={<Navigate to="/professionals" replace />} />
              <Route path="/pacientes" element={<Navigate to="/app" replace />} />
              <Route path="/patients" element={<Navigate to="/app" replace />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>

            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Portal privado. El guard externo solo exige sesion y maneja la
                clave temporal; cada area suma su propio chequeo de rol. */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/app/cambiar-contrasena" element={<ChangePasswordPage />} />

                {/* Paciente. En la Fase 4 un ADMIN con perfil médico también
                    va a poder entrar: se suma acá a allowedRoles. */}
                <Route
                  path="/app"
                  element={<ProtectedRoute allowedRoles={['PATIENT']} />}
                >
                  <Route index element={<PatientHome />} />
                  <Route path="perfil" element={<ProfilePage />} />
                  <Route
                    path="turnos"
                    element={
                      <PlaceholderPage title="Turnos" description="Vas a poder sacar y gestionar tus turnos. Próximamente." />
                    }
                  />
                  <Route
                    path="recetas"
                    element={
                      <PlaceholderPage title="Recetas" description="Tus recetas van a estar acá. Próximamente." />
                    }
                  />
                  <Route
                    path="ordenes"
                    element={
                      <PlaceholderPage title="Órdenes" description="Tus órdenes y estudios van a estar acá. Próximamente." />
                    }
                  />
                </Route>

                {/* Médico */}
                <Route
                  path="/app/medico"
                  element={<ProtectedRoute allowedRoles={['DOCTOR']} />}
                >
                  <Route
                    index
                    element={
                      <PlaceholderPage title="Panel del médico" description="Próximamente." />
                    }
                  />
                  <Route
                    path="agenda"
                    element={<PlaceholderPage title="Agenda" description="Próximamente." />}
                  />
                  <Route
                    path="pacientes"
                    element={<PlaceholderPage title="Pacientes" description="Próximamente." />}
                  />
                </Route>

                {/* Administración */}
                <Route
                  path="/app/admin"
                  element={<ProtectedRoute allowedRoles={['ADMIN']} />}
                >
                  <Route
                    index
                    element={
                      <PlaceholderPage title="Panel de administración" description="Próximamente." />
                    }
                  />
                  <Route
                    path="medicos"
                    element={<PlaceholderPage title="Médicos" description="Próximamente." />}
                  />
                  <Route
                    path="pacientes"
                    element={<PlaceholderPage title="Pacientes" description="Próximamente." />}
                  />
                </Route>

                <Route path="/app/*" element={<Navigate to="/app" replace />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
