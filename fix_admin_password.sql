-- Fix Admin Password - Convert to Bcrypt Hash
-- Run this in Supabase SQL Editor

-- This updates the password_hash from plaintext 'admin123!' to proper bcrypt hash
UPDATE admin_credentials 
SET password_hash = '$2b$10$XqaUqpJrT8oIAs10rXoGRuTf3uy018kSO8yx7R5jljjTSl.7O8156'
WHERE username = 'admingkk2026';

-- Verify the update
SELECT id, username, LEFT(password_hash, 7) as hash_prefix, is_active 
FROM admin_credentials;
-- Hash should now start with '$2b$10$' (bcrypt identifier)
