import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout, AuthLayout } from './layouts/MainLayout'
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
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/specialties" element={<Specialties />} />
          <Route path="/specialties/:specialtyId" element={<Specialties />} />
          <Route path="/professionals" element={<Professionals />} />
          <Route path="/professionals/:id" element={<Professionals />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/services" element={<Navigate to="/specialties" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
