-- Run this to fix existing user passwords
-- This updates all existing demo users to password: Admin@123

UPDATE users
SET password = '$2b$10$eV0plfLoXRrD9kBlvbgcLuu4JxrrrcN4ex5Gcm.Q1PkOhtjVanBhe'
WHERE email IN (
  'admin@example.com',
  'manager@example.com',
  'staff@example.com',
  'carol@example.com',
  'dave@example.com'
);

-- Verify
SELECT name, email, role, is_active FROM users;
