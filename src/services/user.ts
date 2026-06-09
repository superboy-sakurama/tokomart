// src/services/user.ts
import { supabase } from './db';
import { IUserProfile } from '../types/user';

export const UserService = {
  /**
   * Mengambil detail profil user berdasarkan ID.
   * Dilengkapi penanganan error yang menangkap pesan asli dari Supabase.
   */
  async getUserProfile(userId: string): Promise<IUserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Supabase Fetch Error]:', error);
        throw new Error(`[Supabase Error - Code: ${error.code}]: ${error.message}`);
      }

      if (!data) return null;

      // Transformasi bentuk DB internal ke standard interface TypeScript
      return {
        id: data.id,
        full_name: data.name || data.full_name || 'Anonymous',
        role: data.role as 'ADMIN' | 'CASHIER',
        email: data.email,
        phone_number: data.phone_number || '',
        avatar_url: data.avatar_url || '',
        joined_at: data.created_at || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[UserService.getUserProfile] Failed:', error);
      throw error;
    }
  },

  /**
   * Memperbarui tabel profile berdasarkan User ID (RLS-compliant).
   * Hanya kolom yang disediakan di payload 'updates' yang akan disinkron.
   */
  async updateUserProfile(userId: string, updates: Partial<IUserProfile>): Promise<IUserProfile | null> {
    try {
      // Pemetaan ketat interface ke struktur kolom DB Postgres aktual
      const dbPayload: any = {};
      if (updates.full_name !== undefined) dbPayload.name = updates.full_name;
      if (updates.phone_number !== undefined) dbPayload.phone_number = updates.phone_number;
      if (updates.avatar_url !== undefined) dbPayload.avatar_url = updates.avatar_url;

      // Ambil data user yang sedang login untuk mendapatkan email (dibutuhkan jika harus INSERT)
      const { data: authData } = await supabase.auth.getUser();
      const currentEmail = authData?.user?.email || 'no-email@example.com';

      // Cek apakah profil sudah ada
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      const performUpdateOrInsert = async (payloadToUse: any) => {
        let query;
        if (existingProfile) {
          query = supabase
            .from('profiles')
            .update(payloadToUse)
            .eq('id', userId);
        } else {
          const insertPayload = {
            id: userId,
            email: currentEmail,
            name: payloadToUse.name || 'User Tambahan',
            role: updates.role || 'CASHIER',
            ...(payloadToUse.phone_number && { phone_number: payloadToUse.phone_number }),
            ...(payloadToUse.avatar_url && { avatar_url: payloadToUse.avatar_url })
          };
          query = supabase.from('profiles').insert([insertPayload]);
        }
        return query.select('*').maybeSingle();
      };

      let response = await performUpdateOrInsert(dbPayload);

      // Auto-Heal: Jika kolom avatar_url atau phone_number belum dibuat oleh user di Supabase (PGRST204)
      if (response.error && response.error.code === 'PGRST204') {
        console.warn('Kolom avatar_url/phone_number tidak ditemukan di DB. Mencoba menyimpan tanpa data tersebut...');
        const fallbackPayload = { ...dbPayload };
        delete fallbackPayload.phone_number;
        delete fallbackPayload.avatar_url;
        
        response = await performUpdateOrInsert(fallbackPayload);
      }

      if (response.error) {
        console.error('[Supabase Update Error]:', response.error);
        throw new Error(`[Supabase Error - Code: ${response.error.code}]: ${response.error.message}`);
      }

      const { data } = response;
      if (!data) return null;

      // Transformasi balik dari response DB ke objek UI TS Formatted
      return {
        id: data.id,
        full_name: data.name || data.full_name || 'Anonymous',
        role: data.role as 'ADMIN' | 'CASHIER',
        email: data.email,
        phone_number: data.phone_number || '',
        avatar_url: data.avatar_url || '',
        joined_at: data.created_at || new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[UserService.updateUserProfile] Failed:', error);
      throw error;
    }
  }
};

