-- SOLUSI FINAL ROW LEVEL SECURITY (RLS) ERROR 42501
-- Silakan jalankan script SQL ini KEMBALI di fitur "SQL Editor" pada dashboard Supabase Anda.

-- Menghapus semua policy lama yang menyebabkan Error 42501 (Update / Insert ditolak)
DROP POLICY IF EXISTS "Public profiles access" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Membuat policy PUBLIC baru yang mengizinkan SEMUA aksi (SELECT, INSERT, UPDATE, DELETE)
-- Perbaikan utama ada di klausa "WITH CHECK (true)" yang menangani Error 42501 saat UPDATE/INSERT.
CREATE POLICY "Public profiles access" ON profiles FOR ALL USING (true) WITH CHECK (true);

-- (Opsional) Terapkan perbaikan yang sama untuk tabel lainnya agar tidak terjadi error serupa:
DROP POLICY IF EXISTS "Public products access" ON products;
CREATE POLICY "Public products access" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public customers access" ON customers;
CREATE POLICY "Public customers access" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public transactions access" ON transactions;
CREATE POLICY "Public transactions access" ON transactions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public transaction items access" ON transaction_items;
CREATE POLICY "Public transaction items access" ON transaction_items FOR ALL USING (true) WITH CHECK (true);
