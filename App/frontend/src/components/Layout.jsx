import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/done';

  return (
    <div className="min-h-screen bg-slate-50">
      {!hideNavbar && <Navbar />}
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
