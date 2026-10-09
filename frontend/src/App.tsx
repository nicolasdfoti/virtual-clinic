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
import { ProfilePage } from './features/patient/ProfilePage'
import { ChangePasswordPage } from './features/auth/ChangePasswordPage'
import { AdminDashboard } from './features/admin/AdminDashboard'
import { AdminDoctorsPage } from './features/admin/AdminDoctorsPage'
import { AdminPatientsPage } from './features/admin/AdminPatientsPage'
import { AdminPrescriptionsPage } from './features/admin/AdminPrescriptionsPage'
import { AdminMedicalOrdersPage } from './features/admin/AdminMedicalOrdersPage'
import { AdminActivityPage } from './features/admin/AdminActivityPage'
import { AuditLogPage } from './features/admin/AuditLogPage'
import { DoctorDashboard } from './features/doctor/DoctorDashboard'
import { DoctorPatientDetailPage } from './features/doctor/DoctorPatientDetailPage'
import { DoctorAgendaPage } from './features/doctor/DoctorAgendaPage'
import { DoctorAppointmentDetailPage } from './features/doctor/DoctorAppointmentDetailPage'
import { BookAppointmentPage } from './features/appointment/BookAppointmentPage'
import { PatientAppointmentsPage } from './features/appointment/PatientAppointmentsPage'
import { PatientPrescriptionsPage } from './features/prescriptions/PatientPrescriptionsPage'
import { PatientOrdersPage } from './features/prescriptions/PatientOrdersPage'
import { PatientFilesPage } from './features/patient/PatientFilesPage'

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
                    <Route path="turnos" element={<PatientAppointmentsPage />} />
                    <Route path="turnos/nuevo" element={<BookAppointmentPage />} />
                    <Route path="recetas" element={<PatientPrescriptionsPage />} />
                    <Route path="ordenes" element={<PatientOrdersPage />} />
                    <Route path="estudios" element={<PatientFilesPage />} />
                  </Route>

                {/* Médico. Un ADMIN con perfil médico también entra al panel:
                    la seguridad real la aplica el backend. */}
                <Route
                  path="/app/medico"
                  element={<ProtectedRoute allowedRoles={['DOCTOR', 'ADMIN']} />}
                >
                  <Route index element={<DoctorDashboard />} />
                  <Route path="agenda" element={<DoctorAgendaPage />} />
                  {/* "Pacientes" comparte la tabla del panel; el detalle vive
                      bajo este prefijo para que el nav lo marque activo. */}
                  <Route
                    path="pacientes"
                    element={<Navigate to="/app/medico" replace />}
                  />
                  <Route
                    path="pacientes/:patientId"
                    element={<DoctorPatientDetailPage />}
                  />
                  <Route
                    path="turnos/:appointmentId"
                    element={<DoctorAppointmentDetailPage />}
                  />
                </Route>

                {/* Administración */}
                <Route
                  path="/app/admin"
                  element={<ProtectedRoute allowedRoles={['ADMIN']} />}
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="medicos" element={<AdminDoctorsPage />} />
                  <Route path="pacientes" element={<AdminPatientsPage />} />
                  <Route path="recetas" element={<AdminPrescriptionsPage />} />
                  <Route path="ordenes" element={<AdminMedicalOrdersPage />} />
                  <Route path="actividad" element={<AdminActivityPage />} />
                  <Route path="auditoria" element={<AuditLogPage />} />
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
