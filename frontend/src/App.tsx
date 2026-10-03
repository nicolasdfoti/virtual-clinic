import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthProvider'
import { MainLayout, AuthLayout } from './layouts/MainLayout'
import { ProtectedRoute } from './routes/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Specialties from './pages/Specialties'
import Professionals from './pages/Professionals'
import Patients from './pages/Patients'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/specialties" element={<Specialties />} />
            <Route path="/specialties/:specialtyId" element={<Specialties />} />
            <Route path="/professionals" element={<Professionals />} />
            <Route path="/professionals/:id" element={<Professionals />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Navigate to="/specialties" replace />} />

            {/* `/patients` era la ruta anterior: se redirige para no romper
                links viejos ni los que quedaron guardados. */}
            <Route path="/patients" element={<Navigate to="/pacientes" replace />} />

            {/* Requiere sesion. `allowedRoles` se amplia cuando existan las
                areas de doctor y admin. */}
            <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
              <Route path="/pacientes" element={<Patients />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App