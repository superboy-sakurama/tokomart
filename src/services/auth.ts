import { supabase } from './db';
import { UserProfile } from '../types';

export const AuthService = {
  async signIn(email: string, password: string): Promise<UserProfile> {
    // Call ke Supabase yang Asli
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Terjadi kesalahan sistem saat login");

    // Tangani kemungkinan tabel profiles belum dibuat di Supabase
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
      
    if (profileErr) {
      console.warn('Profil gagal dimuat (tabel mungkin belum ada):', profileErr.message);
      // Fallback auth jika tabel profiles belum ada
      return { 
        id: authData.user.id, 
        email, 
        name: email.split('@')[0], 
        role: 'ADMIN' 
      };
    }
    
    return profile as UserProfile;
  },
  
  async signUp(email: string, password: string, name: string): Promise<UserProfile> {
    // Call ke Supabase yang Asli dengan menyisipkan Metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: 'ADMIN', // Atau 'CASHIER', disesuaikan
        }
      }
    });

    if (authError) throw new Error(authError.message);
    if (!authData.user) throw new Error("Terjadi kesalahan sistem saat mendaftar");

    const newProfile: UserProfile = {
       id: authData.user.id,
       email: email,
       name: name,
       role: 'ADMIN' // Default admin untuk pendaftaran pertama
    };

    // Gabungkan dengan tabel Profil
    const { error: profileErr } = await supabase
      .from('profiles')
      .insert([newProfile]);
      
    if (profileErr) {
       console.warn('Gagal memasukkan data ke tabel profiles (mungkin belum dibuat di Supabase):', profileErr.message);
       // Tetap return user meski tabel profiles belum dibuat agar tidak memblokir user
    }
    
    return newProfile;
  },

  async updateProfile(id: string, email: string, name: string, role: string, newPassword?: string): Promise<UserProfile> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error(`Sesi Anda telah kedaluwarsa atau tidak valid (mungkin masih menggunakan mode demo). Silakan Logout dan Login kembali dengan akun yang valid.`);
    }

    // Call ke Supabase yang Asli
    if (newPassword) {
      const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword });
      if (pwdErr) throw new Error(`Gagal mengubah password: ${pwdErr.message}`);
    }

    // Hanya update email jika ada perubahan, karena updateUser({ email }) sering trigger confirmation link
    if (session.user.email !== email) {
      const { error: emailErr } = await supabase.auth.updateUser({ email });
      if (emailErr) throw new Error(`Gagal mengubah email: ${emailErr.message}`);
    }

    const newProfile: UserProfile = { id, email, name, role: role as 'ADMIN' | 'CASHIER' };
    
    // Cek apakah profil sudah ada di database
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    let profileErr;
    if (existingProfile) {
       const res = await supabase.from('profiles').update({ name, role, email }).eq('id', id);
       profileErr = res.error;
    } else {
       const res = await supabase.from('profiles').insert([{ id, email, name, role }]);
       profileErr = res.error;
    }

    if (profileErr) {
       console.warn('Gagal mengubah data ke tabel profiles:', profileErr.message);
       throw new Error(`Gagal menyimpan profile: ${profileErr.message}`);
    }

    return newProfile;
  },

  async signOut() {
    await supabase.auth.signOut();
  }
};
