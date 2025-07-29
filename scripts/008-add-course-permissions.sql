-- Add missing course-related permissions to the database
-- This script adds the course management permissions that are missing from the initial schema

-- Insert course-related permissions if they don't exist
INSERT INTO permissions (name, resource, action, description) VALUES
('view_courses', 'courses', 'read', 'View academic courses'),
('create_courses', 'courses', 'create', 'Create new academic courses'),
('update_courses', 'courses', 'update', 'Update existing academic courses'),
('delete_courses', 'courses', 'delete', 'Delete academic courses')
ON CONFLICT (name) DO NOTHING;

-- Grant course permissions to Administrator role (FULL ACCESS)
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Administrator', (SELECT id FROM permissions WHERE name = 'view_courses'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'create_courses'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'update_courses'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'delete_courses'), true)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant course viewing permission to Faculty role
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Faculty', (SELECT id FROM permissions WHERE name = 'view_courses'), true),
('Faculty', (SELECT id FROM permissions WHERE name = 'create_courses'), true),
('Faculty', (SELECT id FROM permissions WHERE name = 'update_courses'), true)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant course viewing permission to Lecturer role
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Lecturer', (SELECT id FROM permissions WHERE name = 'view_courses'), true)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant course viewing permission to Student role (for course information)
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Student', (SELECT id FROM permissions WHERE name = 'view_courses'), true)
ON CONFLICT (role, permission_id) DO NOTHING;

-- Grant course viewing permission to Staff role
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Staff', (SELECT id FROM permissions WHERE name = 'view_courses'), true)
ON CONFLICT (role, permission_id) DO NOTHING; 