-- Update RBAC permissions to properly enforce role-based access
-- This script ensures the correct permissions are set for each role

-- Clear existing role permissions
DELETE FROM role_permissions;

-- Insert permissions if they don't exist
INSERT INTO permissions (name, resource, action, description) VALUES
('view_results', 'results', 'read', 'View academic results'),
('edit_results', 'results', 'write', 'Edit academic results'),
('delete_results', 'results', 'delete', 'Delete academic results'),
('export_data', 'results', 'export', 'Export academic data'),
('manage_users', 'users', 'manage', 'Manage user accounts'),
('view_audit_logs', 'audit', 'read', 'View audit logs'),
('system_config', 'system', 'configure', 'Configure system settings'),
('view_security_events', 'security', 'read', 'View security events')
ON CONFLICT (name) DO NOTHING;

-- ADMINISTRATOR: Full system access
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Administrator', (SELECT id FROM permissions WHERE name = 'view_results'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'edit_results'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'delete_results'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'export_data'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'manage_users'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'view_audit_logs'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'system_config'), true),
('Administrator', (SELECT id FROM permissions WHERE name = 'view_security_events'), true);

-- FACULTY: Manage results for their courses
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Faculty', (SELECT id FROM permissions WHERE name = 'view_results'), true),
('Faculty', (SELECT id FROM permissions WHERE name = 'edit_results'), true),
('Faculty', (SELECT id FROM permissions WHERE name = 'export_data'), true),
('Faculty', (SELECT id FROM permissions WHERE name = 'view_audit_logs'), true);

-- STUDENT: View own results only
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Student', (SELECT id FROM permissions WHERE name = 'view_results'), true);

-- STAFF: Basic viewing permissions
INSERT INTO role_permissions (role, permission_id, granted) VALUES
('Staff', (SELECT id FROM permissions WHERE name = 'view_results'), true),
('Staff', (SELECT id FROM permissions WHERE name = 'view_audit_logs'), true);
