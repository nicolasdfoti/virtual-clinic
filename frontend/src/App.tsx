import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './context/AuthProvider'
import { MainLayout, AuthLayout } from './layouts/MainLayout'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import Professionals from './pages/Professionals'
import FAQ from './pages/FAQ'
import Contact from './pages/Contact'
import { TermsPage, PrivacyPage } from './pages/Legal'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
                links viejos. En la Fase 2B `/pacientes` pasa al portal `/app`. */}
            <Route path="/services" element={<Navigate to="/professionals" replace />} />
            <Route path="/specialties" element={<Navigate to="/professionals" replace />} />
            <Route path="/specialties/:specialtyId" element={<Navigate to="/professionals" replace />} />
            <Route path="/pacientes" element={<Navigate to="/login" replace />} />
            <Route path="/patients" element={<Navigate to="/login" replace />} />

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