import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './app/(dashboard)/layout';
import ProfilePage from './app/(dashboard)/profile/page';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Products } from './pages/Products';
import { POS } from './pages/POS';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Customers } from './pages/Customers';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

function Placeholder({ title }: { title: string }) {
  return (
    <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-gray-400 animate-in fade-in duration-300">
      <div className="w-16 h-16 mb-4 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
        <span className="text-2xl">⏳</span>
      </div>
      <h2 className="text-xl font-medium text-gray-900 tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-gray-500">Modul ini siap untuk dibangun pada instruksi berikutnya.</p>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route path="/" element={<Dashboard />} />
            
            {/* Kasir dan Admin bisa akses POS */}
            <Route path="/pos" element={<POS />} />
            
            {/* HANYA Admin yang bisa akses Manajemen Stok Barang */}
            <Route path="/products" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Products />
              </ProtectedRoute>
            } />
            
            {/* Kasir dan Admin bisa akses Pelanggan */}
            <Route path="/customers" element={<Customers />} />
            
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Reports />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={<ProfilePage />} />
            
            {/* HANYA Admin yang bisa akses Pengaturan */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}


