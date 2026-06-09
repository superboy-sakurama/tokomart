// src/app/(dashboard)/profile/page.tsx
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { UserCircle, Mail, Phone, Camera, Shield, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { UserService } from '../../../services/user';
import { IUserProfile } from '../../../types/user';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<IUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    avatar_url: '',
  });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!user?.id) return;
      try {
        const data = await UserService.getUserProfile(user.id);
        if (mounted && data) {
          setProfile(data);
          setFormData({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            avatar_url: data.avatar_url || 'https://i.pravatar.cc/150?img=32', // Anime aesthetic default
          });
        }
      } catch (error) {
        console.error('Failed to load profile details:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchProfile();

    return () => { mounted = false; };
  }, [user?.id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await UserService.updateUserProfile(user.id, {
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        avatar_url: formData.avatar_url,
      });
      
      if (updated) {
        setProfile(updated);
        setSaveSuccess(true);
        // Trigger event untuk memperbarui header/sidebar avatar
        window.dispatchEvent(new Event('user_profile_updated'));
      }
    } catch (error) {
       console.error("Gagal update profil:", error);
       alert("Gagal menyimpan profil.");
    } finally {
       setIsSaving(false);
       setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-indigo-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-semibold animate-pulse">Memuat data profil real-time...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl bg-white p-8 shadow-xl border border-white/40 overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center pt-8">
          <div className="relative group shrink-0">
             <div className="w-32 h-32 rounded-full p-1.5 bg-white shadow-xl">
               <img 
                 src={formData.avatar_url || 'https://i.pravatar.cc/150?img=32'} 
                 alt="Avatar" 
                 className="w-full h-full rounded-full object-cover"
               />
               <button className="absolute bottom-2 right-2 p-2.5 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 hover:scale-110 transition-all duration-300">
                 <Camera className="w-4 h-4" />
               </button>
             </div>
             {/* Decorative Anime Particle Elements */}
             <div className="absolute -top-4 -right-4 w-8 h-8 bg-yellow-300 rounded-full blur-xl opacity-50 animate-pulse" />
             <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-pink-400 rounded-full blur-xl opacity-40 animate-pulse delay-150" />
          </div>

          <div className="flex-1 space-y-2">
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{profile?.full_name || 'User Anonymous'}</h1>
             <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                  <Shield className="w-4 h-4" /> 
                  {profile?.role === 'ADMIN' ? 'Administrator' : 'Kasir Toko'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" /> {profile?.email || '-'}
                </span>
             </div>
          </div>
        </div>
      </motion.div>

      {/* Main Forms */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-lg border border-white">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                 <UserCircle className="w-6 h-6 text-indigo-500" /> Informasi Pribadi
               </h2>
             </div>

             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Nama Lengkap</label>
                     <input 
                       type="text" 
                       name="full_name"
                       value={formData.full_name}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl transition-all font-medium text-slate-900 outline-none"
                     />
                   </div>
                   
                   <div className="space-y-2">
                     <label className="text-sm font-semibold text-slate-700">Nomor Telepon</label>
                     <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                       <input 
                         type="text" 
                         name="phone_number"
                         value={formData.phone_number}
                         onChange={handleInputChange}
                         placeholder="08xxxxxxxxxx"
                         className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl transition-all font-medium text-slate-900 outline-none"
                       />
                     </div>
                   </div>

                   <div className="space-y-2 md:col-span-2">
                     <label className="text-sm font-semibold text-slate-700">URL Avatar Profil</label>
                     <input 
                       type="text" 
                       name="avatar_url"
                       value={formData.avatar_url}
                       onChange={handleInputChange}
                       className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 rounded-xl transition-all font-medium text-slate-900 outline-none"
                     />
                     <p className="text-xs text-slate-500 mt-1">Anda bisa menggunakan link pravatar (e.g. https://i.pravatar.cc/150?img=32)</p>
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
                  {saveSuccess && (
                     <motion.div 
                       initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} 
                       className="text-emerald-600 flex items-center gap-2 text-sm font-bold bg-emerald-50 px-4 py-2 rounded-lg"
                     >
                       <CheckCircle2 className="w-5 h-5" /> Profil diperbarui!
                     </motion.div>
                  )}
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="relative px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden"
                  >
                    <div className="absolute inset-0 w-full h-full bg-white/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-500 ease-out" />
                    <span className="relative flex items-center gap-2">
                      {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Perubahan'}
                    </span>
                  </button>
                </div>
             </form>
          </div>
        </motion.div>

        {/* Sidebar Info Banner */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 lg:col-span-1"
        >
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-12 mix-blend-overlay opacity-30">
               <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-48 h-48 animate-spin-slow">
                 <path fill="#FFFFFF" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18,95.5,-3C94.2,12,85.6,26,75.4,37.3C65.2,48.6,53.4,57.2,40.7,64.4C28,71.6,14,77.4,-0.4,78C-14.8,78.6,-29.6,74,-42.6,66.5C-55.6,59,-66.8,48.6,-75.3,36.2C-83.8,23.8,-89.6,9.4,-88.9,-4.7C-88.2,-18.8,-81.1,-32.6,-71.4,-43.5C-61.7,-54.4,-49.4,-62.4,-36.5,-70C-23.6,-77.6,-11.8,-84.8,1.7,-87.7C15.2,-90.6,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
               </svg>
             </div>
             
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                 <Calendar className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-xl font-bold mb-2">Member Sejak</h3>
               <p className="text-3xl font-extrabold mb-4 opacity-90 drop-shadow-md">
                 {profile?.joined_at ? new Date(profile.joined_at).getFullYear() : '2024'}
               </p>
               <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                 Terima kasih atas dedikasi Anda. Manajemen yang rapi berawal dari profil yang terorganisir.
               </p>
             </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
