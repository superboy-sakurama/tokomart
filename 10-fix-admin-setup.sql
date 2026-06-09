-- 10-fix-admin-setup.sql
-- Silakan COPY dan RUN script ini di Supabase SQL Editor.
-- Script ini akan memperbaiki error "Invalid login credentials" dan "Email not confirmed".

DO $$ 
DECLARE 
  admin_id UUID;
BEGIN
  -- 1. Coba temukan user admin@pos.com
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@pos.com';

  -- 2. Jika belum ada, buat baru dengan lengkap
  IF admin_id IS NULL THEN
    admin_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    )
    VALUES (
      admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@pos.com', 
      crypt('admin123', gen_salt('bf')), 
      NOW(),
      '{"provider":"email","providers":["email"]}', '{"name": "Admin", "role": "ADMIN"}', NOW(), NOW()
    );
  ELSE
    -- 3. Jika sudah ada, FORCE CONFIRM email dan reset password ke 'admin123'
    UPDATE auth.users 
    SET 
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      encrypted_password = crypt('admin123', gen_salt('bf'))
    WHERE id = admin_id;
  END IF;

  -- 4. PENTING: Pastikan auth.identities ada agar email dapat digunakan untuk login dengan password
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  )
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
  
  -- 5. Pastikan data di tabel profiles sinkron
  INSERT INTO public.profiles (id, email, name, role, created_at, updated_at)
  VALUES (admin_id, 'admin@pos.com', 'Admin', 'ADMIN', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    role = 'ADMIN';

END $$;
