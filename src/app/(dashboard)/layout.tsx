// src/app/(dashboard)/layout.tsx
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, ShoppingCart, Package, Users, 
  FileText, Settings, LogOut, ChevronRight, UserCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { SettingsService } from '../../services/settings';
import { AppSettings } from '../../types';
import { UserService } from '../../services/user';
import { IUserProfile } from '../../types/user';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Kasir', path: '/pos', icon: ShoppingCart },
  { name: 'Produk', path: '/products', icon: Package },
  { name: 'Pelanggan', path: '/customers', icon: Users },
  { name: 'Laporan', path: '/reports', icon: FileText },
  { name: 'Profil', path: '/profile', icon: UserCircle },
  { name: 'Pengaturan', path: '/settings', icon: Settings },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [appSettings, setAppSettings] = useState<AppSettings>({ app_name: 'Wakhid Mart', logo_url: '' });
  const [userProfile, setUserProfile] = useState<IUserProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Fetch Settings
    const fetchSettings = async () => {
      const data = await SettingsService.getAppSettings();
      if (mounted) setAppSettings(data);
    };
    fetchSettings();

    // Fetch Profile
    const fetchProfile = async () => {
      if (user?.id) {
        try {
           const profile = await UserService.getUserProfile(user.id);
           if (mounted) setUserProfile(profile);
        } catch (error) {
           console.error("Failed to load profile:", error);
        }
      }
    };
    fetchProfile();

    const handleUpdate = () => fetchSettings();
    window.addEventListener('app_settings_updated', handleUpdate);
    const handleProfileUpdate = () => fetchProfile();
    window.addEventListener('user_profile_updated', handleProfileUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('app_settings_updated', handleUpdate);
      window.removeEventListener('user_profile_updated', handleProfileUpdate);
    };
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const currentAvatar = userProfile?.avatar_url || 'https://i.pravatar.cc/150?img=32';

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      
      {/* 
        GLASSMORPHISM SIDEBAR
      */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="w-72 bg-white/70 backdrop-blur-xl border-r border-white/20 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col h-screen fixed top-0 left-0 z-30"
      >
        <div className="p-8 pb-4">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3 backdrop-blur-sm bg-white/50 p-2.5 rounded-2xl border border-white shadow-sm"
          >
            {appSettings.logo_url ? (
              <img src={appSettings.logo_url} alt="Logo" className="w-10 h-10 object-contain rounded-xl" />
            ) : (
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-2.5 rounded-xl shadow-inner">
                <Package className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-slate-800 truncate" title={appSettings.app_name}>
              {appSettings.app_name}
            </span>
          </motion.div>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 text-[15px] font-semibold overflow-hidden",
                    isActive
                      ? "text-indigo-700 bg-white shadow-sm border border-indigo-50"
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-100/50"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <AnimatePresence>
                      {isActive && (
                        <motion.div 
                           layoutId="activeTab"
                           className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full top-1/2 -translate-y-1/2"
                           transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </AnimatePresence>
                    <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")} />
                    <span className="flex-1">{item.name}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-indigo-400" />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-6">
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex items-center gap-3 relative z-10">
              <img 
                src={currentAvatar}
                alt="Profile" 
                className="w-12 h-12 rounded-full border-2 border-white/20 object-cover shadow-inner"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{userProfile?.full_name || user?.name || 'Loading...'}</p>
                <p className="text-indigo-200 text-xs font-medium tracking-wide uppercase mt-0.5">{userProfile?.role || user?.role || 'User'}</p>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          </motion.div>
        </div>
      </motion.aside>

      {/* 
        MAIN CONTENT AREA WITH GLASSMORPHISM TOPBAR
      */}
      <main className="flex-1 ml-72 flex flex-col min-h-screen relative bg-slate-50/50">
        
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-20 px-8 flex items-center justify-between bg-white/40 backdrop-blur-xl border-b border-white/40">
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Workspace</h2>
          
          <div className="flex items-center gap-4">
             {/* Notification / Utils Mock */}
             <button className="w-10 h-10 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
               <div className="relative">
                 <Package className="w-5 h-5" />
                 <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-500 rounded-full animate-pulse" />
               </div>
             </button>
          </div>
        </header>

        {/* Content Router Outlet */}
        <div className="flex-1 p-8 relative overflow-y-auto custom-scrollbar">
           <AnimatePresence mode="wait">
             <motion.div
               key={location.pathname}
               initial={{ opacity: 0, y: 15 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -15 }}
               transition={{ duration: 0.3, ease: "easeOut" }}
               className="h-full"
             >
                <Outlet />
             </motion.div>
           </AnimatePresence>
        </div>
        
      </main>
    </div>
  );
}
