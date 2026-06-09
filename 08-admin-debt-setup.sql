-- 08-admin-debt-setup.sql

-- 1. Masukkan akun admin default
DO $$ 
DECLARE 
  uid uuid;
BEGIN
  -- Cek apakah admin sudah ada
  SELECT id INTO uid FROM auth.users WHERE email = 'admin@pos.com';
  
  -- Jika belum ada, lakukan INSERT
  IF uid IS NULL THEN
    uid := gen_random_uuid();
    INSERT INTO auth.users (
      id, 
      instance_id, 
      aud, 
      role, 
      email, 
      encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      uid, 
      '00000000-0000-0000-0000-000000000000', 
      'authenticated', 
      'authenticated', 
      'admin@pos.com', 
      crypt('admin123', gen_salt('bf')), 
      now(), 
      '{"provider":"email","providers":["email"]}',
      '{"name": "Admin", "role": "ADMIN"}',
      now(),
      now()
    );
  END IF;
END $$;


-- 2. Buat tabel debts
CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipe_transaksi TEXT NOT NULL CHECK (tipe_transaksi IN ('hutang', 'piutang')),
  jumlah NUMERIC NOT NULL,
  keterangan TEXT,
  status TEXT NOT NULL CHECK (status IN ('lunas', 'belum_lunas')) DEFAULT 'belum_lunas',
  jatuh_tempo DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 3. Aktifkan RLS dan buat policy
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;

-- Policy untuk mengizinkan semua operasi (CRUD) hanya bagi user yang sudah Auth (login)
DROP POLICY IF EXISTS "Debts CRUD rule" ON debts;
CREATE POLICY "Debts CRUD rule" ON debts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
