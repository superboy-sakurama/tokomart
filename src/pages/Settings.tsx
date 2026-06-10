import { useState, useEffect } from 'react';
import { Store, MonitorSmartphone, UserCircle, Save, CheckCircle, Package, Users, PlusCircle } from 'lucide-react';
import { SettingsService } from '../services/settings';
import { AuthService } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { StoreSettings, AppSettings } from '../types';
import { createNewUser } from '../app/actions/admin-actions';

export function Settings() {
  const { user, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'store' | 'app' | 'account' | 'staff'>('store');

  // --- Store Settings State ---
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: '',
    owner_name: '',
    phone: '',
    address: ''
  });
  const [isStoreLoading, setIsStoreLoading] = useState(false);
  const [storeMessage, setStoreMessage] = useState('');

  // --- App Settings State ---
  const [appSettings, setAppSettings] = useState<AppSettings>({
    app_name: '',
    logo_url: ''
  });
  const [isAppLoading, setIsAppLoading] = useState(false);
  const [appMessage, setAppMessage] = useState('');

  // --- Account State ---
  const [accountState, setAccountState] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'ADMIN',
    password: ''
  });
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountMessage, setAccountMessage] = useState('');

  // --- Staff State ---
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [staffMessage, setStaffMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const store = await SettingsService.getStoreSettings();
    const app = await SettingsService.getAppSettings();
    setStoreSettings(store);
    setAppSettings(app);
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStoreLoading(true);
    setStoreMessage('');
    try {
      await SettingsService.updateStoreSettings(storeSettings);
      setStoreMessage('Pengaturan toko berhasil disimpan!');
      setTimeout(() => setStoreMessage(''), 3000);
    } catch (err: any) {
      setStoreMessage(`Error: ${err.message}`);
    } finally {
      setIsStoreLoading(false);
    }
  };

  const handleSaveApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAppLoading(true);
    setAppMessage('');
    try {
      await SettingsService.updateAppSettings(appSettings);
      setAppMessage('Pengaturan aplikasi berhasil disimpan!');
      setTimeout(() => setAppMessage(''), 3000);
    } catch (err: any) {
      setAppMessage(`Error: ${err.message}`);
    } finally {
      setIsAppLoading(false);
    }
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsAccountLoading(true);
    setAccountMessage('');
    try {
      const updatedProfile = await AuthService.updateProfile(
        user.id,
        accountState.email,
        accountState.name,
        accountState.role,
        accountState.password || undefined
      );
      login(updatedProfile); // Refresh context user
      setAccountMessage('Pengaturan akun berhasil disimpan!');
      setAccountState(prev => ({ ...prev, password: '' })); // Clear password field
      setTimeout(() => setAccountMessage(''), 3000);
    } catch (err: any) {
      setAccountMessage(`Error: ${err.message}`);
    } finally {
      setIsAccountLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsStaffLoading(true);
    setStaffMessage('');
    try {
      const formData = new FormData(e.currentTarget);
      const res = await createNewUser(formData);
      if (res.success) {
        setStaffMessage('Akun staf berhasil dibuat!');
        e.currentTarget.reset();
      } else {
        setStaffMessage(`Error: ${res.error}`);
      }
      setTimeout(() => setStaffMessage(''), 4000);
    } catch (err: any) {
      setStaffMessage(`Error: ${err.message}`);
    } finally {
      setIsStaffLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-gray-500 mt-1 text-sm">Kelola informasi toko, konfigurasi aplikasi, dan preferensi akun Anda.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab('store')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                activeTab === 'store' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Store className="w-5 h-5" /> Pengaturan Toko
            </button>
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                activeTab === 'app' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <MonitorSmartphone className="w-5 h-5" /> Pengaturan Aplikasi
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                activeTab === 'account' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <UserCircle className="w-5 h-5" /> Pengaturan Akun
            </button>
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => setActiveTab('staff')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-semibold text-sm ${
                  activeTab === 'staff' ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" /> Manajemen Staf
              </button>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            
            {/* Store Settings */}
            {activeTab === 'store' && (
              <form onSubmit={handleSaveStore} className="animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Informasi Toko</h2>
                  <p className="text-sm text-gray-500">Data ini akan dicetak pada struk / invoice pelanggan.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Nama Toko *</label>
                      <input 
                        type="text" 
                        required 
                        value={storeSettings.store_name}
                        onChange={(e) => setStoreSettings({...storeSettings, store_name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Nama Pemilik</label>
                      <input 
                        type="text" 
                        value={storeSettings.owner_name}
                        onChange={(e) => setStoreSettings({...storeSettings, owner_name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Nomor Telepon</label>
                    <input 
                      type="text" 
                      value={storeSettings.phone}
                      onChange={(e) => setStoreSettings({...storeSettings, phone: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Alamat Lengkap</label>
                    <textarea 
                      rows={3}
                      value={storeSettings.address}
                      onChange={(e) => setStoreSettings({...storeSettings, address: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none" 
                    />
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    {storeMessage && (
                      <p className={`text-sm font-medium flex items-center gap-2 ${storeMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                        {!storeMessage.includes('Error') && <CheckCircle className="w-4 h-4" />} {storeMessage}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isStoreLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {isStoreLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* App Settings */}
            {activeTab === 'app' && (
              <form onSubmit={handleSaveApp} className="animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Konfigurasi Aplikasi</h2>
                  <p className="text-sm text-gray-500">Sesuaikan tampilan sistem.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Nama Aplikasi *</label>
                    <input 
                      type="text" 
                      required 
                      value={appSettings.app_name}
                      onChange={(e) => setAppSettings({...appSettings, app_name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Logo Aplikasi / Toko</label>
                    <div className="flex flex-col gap-3">
                      {appSettings.logo_url && (
                        <img src={appSettings.logo_url} alt="Logo Preview" className="h-20 w-20 object-contain rounded-xl border border-gray-200 bg-white" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAppSettings({...appSettings, logo_url: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Pilih gambar dari komputer/HP Anda. Gambar akan disimpan secara otomatis ke dalam sistem (max 2MB yang disarankan).</p>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    {appMessage && (
                      <p className={`text-sm font-medium flex items-center gap-2 ${appMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                        {!appMessage.includes('Error') && <CheckCircle className="w-4 h-4" />} {appMessage}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAppLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {isAppLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* Account Settings */}
            {activeTab === 'account' && (
              <form onSubmit={handleSaveAccount} className="animate-in slide-in-from-right-4 duration-300">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Keamanan Akun</h2>
                  <p className="text-sm text-gray-500">Kelola identitas dan kredensial login Anda.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Nama Lengkap *</label>
                      <input 
                        type="text" 
                        required 
                        value={accountState.name}
                        onChange={(e) => setAccountState({...accountState, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Email Utama (Username) *</label>
                      <input 
                        type="email" 
                        required 
                        value={accountState.email}
                        onChange={(e) => setAccountState({...accountState, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Ubah Password</label>
                      <input 
                        type="password" 
                        placeholder="Biarkan kosong jika tidak diubah"
                        value={accountState.password}
                        onChange={(e) => setAccountState({...accountState, password: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                       <label className="block text-sm font-semibold text-gray-700">Hak Akses</label>
                       <select 
                         value={accountState.role}
                         onChange={(e) => setAccountState({...accountState, role: e.target.value as any})}
                         disabled={user?.role !== 'ADMIN'}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <option value="ADMIN">Administrator</option>
                         <option value="CASHIER">Kasir</option>
                       </select>
                       {user?.role !== 'ADMIN' && <p className="text-xs text-gray-500">Hanya Admin yang dapat mengubah role.</p>}
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                  <div>
                    {accountMessage && (
                      <p className={`text-sm font-medium flex items-center gap-2 ${accountMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                        {!accountMessage.includes('Error') && <CheckCircle className="w-4 h-4" />} {accountMessage}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isAccountLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {isAccountLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Simpan Perubahan
                  </button>
                </div>
              </form>
            )}

            {/* Staff Settings */}
            {activeTab === 'staff' && user?.role === 'ADMIN' && (
              <form onSubmit={handleCreateStaff} className="animate-in slide-in-from-right-4 duration-300 flex flex-col min-h-full">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Manajemen Staf / Tambah Akun Baru</h2>
                  <p className="text-sm text-gray-500">Buat akun untuk kasir atau admin baru menggunakan layanan backend.</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Nama Lengkap Staf *</label>
                      <input 
                        type="text" 
                        name="name"
                        required 
                        placeholder="Contoh: Budi Kasir"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Alamat Email *</label>
                      <input 
                        type="email" 
                        name="email"
                        required 
                        placeholder="staf@pos.com"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-semibold text-gray-700">Kata Sandi Awal *</label>
                      <input 
                        type="password" 
                        name="password"
                        required
                        minLength={6}
                        placeholder="Min 6 karakter"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all" 
                      />
                    </div>
                    <div className="space-y-1.5">
                       <label className="block text-sm font-semibold text-gray-700">Hak Akses *</label>
                       <select 
                         name="role"
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
                       >
                         <option value="CASHIER">Kasir</option>
                         <option value="ADMIN">Administrator</option>
                       </select>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between mt-auto">
                  <div>
                    {staffMessage && (
                      <p className={`text-sm font-medium flex items-center gap-2 ${staffMessage.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
                        {!staffMessage.includes('Error') && <CheckCircle className="w-4 h-4" />} {staffMessage}
                      </p>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={isStaffLoading}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    {isStaffLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                    Buat Akun Staf
                  </button>
                </div>
              </form>
            )}
            
          </div>
        </div>
        
      </div>
    </div>
  );
}
