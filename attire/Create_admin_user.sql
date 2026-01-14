-- 1. Create the user in Auth.users
-- This bypasses email verification by setting email_confirmed_at
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'adminuser@attire.com',
  crypt('SecurePass$$123', gen_salt('bf')), -- Hashes the password securely
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin User"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
RETURNING id;

-- 2. Update the profile role to 'admin'
-- Since you have a trigger that automatically creates a profile, 
-- we simply update the role for the email we just created.
UPDATE public.profiles
SET role = 'admin',
    full_name = 'Admin User'
WHERE id = (SELECT id FROM auth.users WHERE email = 'adminuser@attire.com');