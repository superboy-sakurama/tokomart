import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: { 
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Memuat Sesi...</p>
        </div>
      </div>
    );
  }

  // Lempar ke login panel jika belum autentikasi
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika Route di-lock per Role (misal: Hanya Admin)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-red-100 shadow-sm max-w-lg mx-auto mt-20 fade-in animate-in duration-300">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-5 border border-red-100 shadow-inner">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akses Ditolak</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Anda login sebagai <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{user.role}</span>. <br/>Halaman ini memerlukan hak akses tingkat khusus.
        </p>
        <button 
          onClick={() => window.history.back()} 
          className="text-sm px-5 py-2.5 bg-gray-100 hover:bg-gray-200 font-bold rounded-xl text-gray-700 transition-colors shadow-sm"
        >
          Kembali ke sebelumnya
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
