-- Tahap Lanjutan: Sinkronisasi User Lama (Backfill)
-- Jalankan script ini di SQL Editor Supabase Anda untuk memasukkan akun user 
-- yang sudah terdaftar DARI auth.users SEBELUM trigger dibuat.
-- Jika tabel profiles kosong, ini akan mengisinya dengan data yang benar.

INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1), 'User Lupa Nama'), 
  COALESCE(raw_user_meta_data->>'role', 'CASHIER'),
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(public.profiles.name, EXCLUDED.name);

-- Pesan sukses akan muncul jika berhasil dimasukkan.
