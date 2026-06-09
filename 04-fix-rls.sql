-- Tahap Perbaikan RLS (Row Level Security)
-- Silakan jalankan script SQL ini di fitur "SQL Editor" pada dashboard Supabase Anda.

-- Menghapus policy anonim/publik sebelumnya agar aman
DROP POLICY IF EXISTS "Public profiles access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Pastikan RLS Aktif
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. RLS Policy: Izinkan user membaca profil milik dia sendiri (UUID harus sama)
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. RLS Policy: Izinkan user mengupdate profil milik dia sendiri
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. RLS Policy: Izinkan user melakukan insert untuk profil dia sendiri (jika trigger gagal)
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- (Opsional tapi disarankan) Mengizinkan admin melihat semua profil, 
-- namun kita akan abaikan dulu jika belum ada auth.role custom. 
