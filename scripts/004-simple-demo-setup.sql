-- Simple demo setup - just ensure users exist with any password hash
-- The crypto service will handle demo password verification

-- Ensure demo users exist
INSERT INTO users (email, password_hash, name, role, department, status) VALUES
('admin@tech-u.edu.ng', 'demo_hash', 'System Administrator', 'Administrator', 'IT Services', 'Active'),
('s.johnson@tech-u.edu.ng', 'demo_hash', 'Dr. Sarah Johnson', 'Faculty', 'Computer Science', 'Active'),
('m.chen@tech-u.edu.ng', 'demo_hash', 'Prof. Michael Chen', 'Faculty', 'Mathematics', 'Active'),
('j.doe@tech-u.edu.ng', 'demo_hash', 'John Doe', 'Student', 'Computer Science', 'Active')
ON CONFLICT (email) DO UPDATE SET
  password_hash = 'demo_hash',
  failed_login_attempts = 0,
  locked_until = NULL,
  status = 'Active';

-- Reset any failed login attempts
UPDATE users SET failed_login_attempts = 0, locked_until = NULL 
WHERE email IN ('admin@tech-u.edu.ng', 's.johnson@tech-u.edu.ng', 'm.chen@tech-u.edu.ng', 'j.doe@tech-u.edu.ng');
