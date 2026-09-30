import { Outlet } from 'react-router-dom';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';

export function MainLayout() {
  return (
    <>
      <NavBar />
      <main id="main-content" className="pt-16 lg:pt-20 min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export function AuthLayout() {
  return (
    <>
      <NavBar />
      <main id="main-content" className="pt-16 lg:pt-20 min-h-screen flex items-center justify-center px-4 py-12">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
