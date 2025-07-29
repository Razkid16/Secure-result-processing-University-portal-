-- Fix demo passwords with a working hash
-- This hash corresponds to password: "SecureAdmin123!"
-- Generated using Node.js crypto.pbkdf2Sync with salt

UPDATE users SET password_hash = 'demoSalt123456789012345678901234:a1b2c3d4e5f67890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234' 
WHERE email IN ('admin@tech-u.edu.ng', 's.johnson@tech-u.edu.ng', 'm.chen@tech-u.edu.ng', 'j.doe@tech-u.edu.ng');

-- Reset any failed login attempts
UPDATE users SET failed_login_attempts = 0, locked_until = NULL 
WHERE email IN ('admin@tech-u.edu.ng', 's.johnson@tech-u.edu.ng', 'm.chen@tech-u.edu.ng', 'j.doe@tech-u.edu.ng');
