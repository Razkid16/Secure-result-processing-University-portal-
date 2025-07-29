-- Seed demo users for each main role
-- Passwords are hashed using bcrypt with cost factor 10
--  admin:    Admin@123
--  faculty:  Faculty@123
--  student:  Student@123

INSERT INTO users (email, password_hash, name, role, department)
VALUES
  ('admin@example.com',   '$2b$10$u1RJc90iwaCbGyF/F7fspekY.zku0Q5FbCND6k12palAWjuOqPiqe', 'System Administrator', 'Administrator', NULL),
  ('john.faculty@example.com', '$2b$10$e0MYzXyjpJS7Pd0RVvHwHeFXf5dmj8bGEhl1C8YHUUtQzlTF/1E.G', 'John Faculty', 'Faculty', 'Computer Science'),
  ('jane.student@example.com', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoehIx4x5HJ2lmJK0yWy', 'Jane Student', 'Student', 'Computer Science'); 