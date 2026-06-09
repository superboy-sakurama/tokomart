-- 09-fix-auth-issues.sql

-- 1. Mengonfirmasi semua akun yang belum dikonfirmasi
-- Ini akan mengatasi masalah "Email not confirmed". Anda tidak perlu mengklik link di email.
UPDATE auth.users 
SET 
  email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- 2. Memperbaiki password dan identitas untuk admin@pos.com 
-- Ini akan mengatasi masalah "Invalid login credentials" jika akun admin belum terbuat dengan sempurna oleh script sebelumnya.
DO $$
DECLARE
  admin_id UUID;
BEGIN
  -- Cek apakah admin ada
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@pos.com';

  IF admin_id IS NOT NULL THEN
    -- Update password dengan enkripsi bcrypt yang standar untuk Supabase
    UPDATE auth.users
    SET encrypted_password = crypt('admin123', gen_salt('bf'))
    WHERE id = admin_id;
    
    -- Memastikan data identities (pendaftaran via email) ada, ini kadang menjadi penyebab Invalid Credentials 
    -- walau record di auth.users sudah ada jika dibuat secara manual via SQL.
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      admin_id,
      format('{"sub":"%s","email":"%s"}', admin_id::text, 'admin@pos.com')::jsonb,
      'email',
      admin_id::text,
      NOW(),
      NOW(),
      NOW()
    ) ON CONFLICT (provider_id, provider) DO NOTHING;
  END IF;
END $$;
