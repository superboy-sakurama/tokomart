-- Tahap 1: Supabase SQL Query (Database Setup)
-- Silakan jalankan script SQL ini di fitur "SQL Editor" pada dashboard Supabase Anda secara utuh.

-- 1. Mengaktifkan ekstensi agar bisa men-generate UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Membuat tabel profiles beserta kolom yang disyaratkan secara komprehensif
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'CASHIER',
  phone_number TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pastikan kolom phone_number & avatar_url ter-add jika tabel sebelumnya sudah ada
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Mengaktifkan Row Level Security (RLS) di tabel profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Membuat Policies RLS (Perizinan Akses Row Berdasarkan Auth UID Asli Supabase)
-- Menghapus policy anonim/publik sebelumnya agar aman
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- RLS Policy: Hanya izinkan user membaca profil milik dia sendiri (UUID harus sama)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- RLS Policy: Hanya izinkan user mengupdate/mengubah profil milik dia sendiri (UUID harus sama)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 5. Membuat Fungsi Trigger Postgres (Auto-Sync Insert saat Pendaftaran di auth.users)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    -- Ambil name dari metadata raw pendaftaran, fallback ke "User Baru"
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', 'User Baru'), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'CASHIER')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Memasang Trigger ke tabel auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. (Opsional namun disarankan) Membuat Fungsi & Trigger untuk otomatis merubah kolom updated_at saat profil di-UPDATE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
