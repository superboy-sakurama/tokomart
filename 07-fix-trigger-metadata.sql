-- Memperbaiki masalah Sinkronisasi dan Null Constraint
-- Silakan jalankan kueri ini di SQL Editor Supabase

-- 1. Buat Ulang Fungsi Trigger dengan Toleransi Null / Coalesce
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- COALESCE: Jika nama dari frontend null, gunakan bagian depan email sebagai fallback
    COALESCE(
      NEW.raw_user_meta_data->>'name', 
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1), 
      'User Baru'
    ), 
    -- COALESCE: Jika role dari frontend null, gunakan 'CASHIER'
    COALESCE(
      NEW.raw_user_meta_data->>'role', 
      'CASHIER'
    )
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    role = COALESCE(public.profiles.role, EXCLUDED.role);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Pastikan trigger dipasang ke kejadian INSERT auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW 
  EXECUTE PROCEDURE public.handle_new_user();

-- 3. MIGRASI DATA / BACKFILL MANUAL
-- Menarik semua user dari auth.users yang belum ada di public.profiles 
-- (berguna untuk sinkronisasi akun lama)
INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
SELECT 
  id, 
  email, 
  COALESCE(
      raw_user_meta_data->>'name', 
      raw_user_meta_data->>'full_name', 
      split_part(email, '@', 1), 
      'User Diperbarui'
  ) AS name, 
  COALESCE(
      raw_user_meta_data->>'role', 
      'CASHIER'
  ) AS role,
  created_at,
  updated_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = COALESCE(public.profiles.name, EXCLUDED.name);

-- Selesai! Pesan sukses akan muncul setelah dijalankan.
