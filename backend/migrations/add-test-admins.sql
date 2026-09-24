-- SQL Script to add test Super Admin users
-- Passwords are hashed using bcrypt (cost factor 10)

-- Test Admin Accounts:
-- 1. Email: admin@idtrust.com, Password: admin123
-- 2. Email: testadmin@idtrust.com, Password: test123
-- 3. Email: demo@idtrust.com, Password: demo123

-- Insert test admins (skip if already exists)
INSERT INTO super_admins (name, email, password, "createdAt", "updatedAt")
VALUES 
  (
    'Super Admin',
    'admin@idtrust.com',
    '$2b$10$U/DkAPdYqzpMJ9GIdM/4qOtrEhH5jV8Mj2nGn7o09fQu0dMjsRY9O', -- admin123
    NOW(),
    NOW()
  ),
  (
    'Test Admin',
    'testadmin@idtrust.com',
    '$2b$10$EqwbslGNLZjJD9buaTVD..ZnZ.a/JyFW8WasUR5ZV/iunIjsT3GKy', -- test123
    NOW(),
    NOW()
  ),
  (
    'Demo Admin',
    'demo@idtrust.com',
    '$2b$10$k5q5GqK0../6EBoxqFi9u.7/KkNo87vR6GwTyjIY2L/DnFZd2nSZe', -- demo123
    NOW(),
    NOW()
  )
ON CONFLICT (email) DO NOTHING;

-- Verify the inserted admins
SELECT id, name, email, "createdAt" FROM super_admins WHERE email IN (
  'admin@idtrust.com',
  'testadmin@idtrust.com',
  'demo@idtrust.com'
) ORDER BY id;
