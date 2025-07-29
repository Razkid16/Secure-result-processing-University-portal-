-- Add more students to the database for testing result uploads

-- Computer Science Students
INSERT INTO users (email, password_hash, name, role, department, status, created_at) VALUES
('alice.smith@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Alice Smith', 'Student', 'Computer Science', 'Active', NOW()),
('bob.jones@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Bob Jones', 'Student', 'Computer Science', 'Active', NOW()),
('charlie.brown@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Charlie Brown', 'Student', 'Computer Science', 'Active', NOW()),
('diana.wilson@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Diana Wilson', 'Student', 'Computer Science', 'Active', NOW()),
('ethan.davis@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Ethan Davis', 'Student', 'Computer Science', 'Active', NOW()),
('fiona.miller@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Fiona Miller', 'Student', 'Computer Science', 'Active', NOW()),
('george.taylor@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'George Taylor', 'Student', 'Computer Science', 'Active', NOW()),
('hannah.anderson@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Hannah Anderson', 'Student', 'Computer Science', 'Active', NOW()),
('ian.moore@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Ian Moore', 'Student', 'Computer Science', 'Active', NOW()),
('julia.white@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Julia White', 'Student', 'Computer Science', 'Active', NOW()),

-- Mathematics Students
('kate.thomas@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Kate Thomas', 'Student', 'Mathematics', 'Active', NOW()),
('liam.jackson@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Liam Jackson', 'Student', 'Mathematics', 'Active', NOW()),
('mia.martin@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Mia Martin', 'Student', 'Mathematics', 'Active', NOW()),
('noah.lee@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Noah Lee', 'Student', 'Mathematics', 'Active', NOW()),
('olivia.harris@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Olivia Harris', 'Student', 'Mathematics', 'Active', NOW()),

-- Physics Students
('paul.garcia@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Paul Garcia', 'Student', 'Physics', 'Active', NOW()),
('quinn.rodriguez@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Quinn Rodriguez', 'Student', 'Physics', 'Active', NOW()),
('ruby.clark@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Ruby Clark', 'Student', 'Physics', 'Active', NOW()),
('sam.lewis@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Sam Lewis', 'Student', 'Physics', 'Active', NOW()),
('tina.walker@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Tina Walker', 'Student', 'Physics', 'Active', NOW()),

-- Engineering Students
('uma.hall@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Uma Hall', 'Student', 'Engineering', 'Active', NOW()),
('victor.allen@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Victor Allen', 'Student', 'Engineering', 'Active', NOW()),
('wendy.young@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Wendy Young', 'Student', 'Engineering', 'Active', NOW()),
('xavier.king@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Xavier King', 'Student', 'Engineering', 'Active', NOW()),
('yara.scott@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Yara Scott', 'Student', 'Engineering', 'Active', NOW()),

-- Chemistry Students
('zoe.wright@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Zoe Wright', 'Student', 'Chemistry', 'Active', NOW()),
('aaron.lopez@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Aaron Lopez', 'Student', 'Chemistry', 'Active', NOW()),
('bella.hill@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Bella Hill', 'Student', 'Chemistry', 'Active', NOW()),
('caleb.green@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Caleb Green', 'Student', 'Chemistry', 'Active', NOW()),
('delia.adams@tech-u.edu.ng', '$2b$12$LQv3c1yqBwEHxE68W/Ca2uGcaXHuPiVNkpXRC8/KOPxJlHgD.BfIu', 'Delia Adams', 'Student', 'Chemistry', 'Active', NOW());

-- Add more courses for different departments
INSERT INTO courses (course_code, course_name, department, credits, created_at) VALUES
-- Physics Courses
('PHY301', 'Classical Mechanics', 'Physics', 3, NOW()),
('PHY302', 'Electromagnetic Theory', 'Physics', 3, NOW()),
('PHY401', 'Quantum Mechanics', 'Physics', 4, NOW()),
('PHY402', 'Thermodynamics', 'Physics', 3, NOW()),

-- Engineering Courses
('ENG201', 'Engineering Mathematics', 'Engineering', 3, NOW()),
('ENG301', 'Circuit Analysis', 'Engineering', 3, NOW()),
('ENG401', 'Control Systems', 'Engineering', 4, NOW()),
('ENG402', 'Digital Signal Processing', 'Engineering', 3, NOW()),

-- Chemistry Courses
('CHE301', 'Organic Chemistry', 'Chemistry', 3, NOW()),
('CHE302', 'Physical Chemistry', 'Chemistry', 3, NOW()),
('CHE401', 'Analytical Chemistry', 'Chemistry', 4, NOW()),
('CHE402', 'Biochemistry', 'Chemistry', 3, NOW()),

-- Additional Mathematics Courses
('MAT301', 'Calculus III', 'Mathematics', 3, NOW()),
('MAT401', 'Differential Equations', 'Mathematics', 4, NOW()),
('MAT402', 'Statistics and Probability', 'Mathematics', 3, NOW());

-- Add some sample results for testing
INSERT INTO results (student_id, course_id, score, grade, semester, academic_year, created_at) VALUES
-- Computer Science students in CSC courses
((SELECT id FROM users WHERE email = 'alice.smith@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'CSC301'), 85.5, 'A', 'First', '2023/2024', NOW()),
((SELECT id FROM users WHERE email = 'bob.jones@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'CSC301'), 78.0, 'B', 'First', '2023/2024', NOW()),
((SELECT id FROM users WHERE email = 'charlie.brown@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'CSC302'), 92.5, 'A', 'First', '2023/2024', NOW()),

-- Mathematics students in MAT courses
((SELECT id FROM users WHERE email = 'kate.thomas@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'MAT201'), 88.0, 'A', 'First', '2023/2024', NOW()),
((SELECT id FROM users WHERE email = 'liam.jackson@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'MAT301'), 76.5, 'B', 'First', '2023/2024', NOW()),

-- Physics students in PHY courses
((SELECT id FROM users WHERE email = 'paul.garcia@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'PHY301'), 82.0, 'A', 'First', '2023/2024', NOW()),
((SELECT id FROM users WHERE email = 'quinn.rodriguez@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'PHY302'), 79.5, 'B', 'First', '2023/2024', NOW());

-- Update the existing John Doe student to have some results
INSERT INTO results (student_id, course_id, score, grade, semester, academic_year, created_at) VALUES
((SELECT id FROM users WHERE email = 'j.doe@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'CSC301'), 75.0, 'B', 'First', '2023/2024', NOW()),
((SELECT id FROM users WHERE email = 'j.doe@tech-u.edu.ng'), (SELECT id FROM courses WHERE course_code = 'CSC302'), 68.5, 'B', 'First', '2023/2024', NOW());
