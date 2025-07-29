# Results Management System

This document explains how to use the new results management system that has been completely rebuilt to remove hardcoded data and use a real database.

## 🗄️ Database Structure

The system now uses an in-memory database with file persistence located at `data/in-memory-db.json`. The database contains:

- **Users**: Administrators, Faculty, and Students
- **Academic Results**: All student results with proper relationships
- **Audit Logs**: Security and activity tracking
- **User Sessions**: Authentication management

## 🔧 Setup

1. **Clear existing hardcoded results** (already done):
   ```bash
   node scripts/clear-results.js
   ```

2. **Start the application**:
   ```bash
   pnpm dev
   ```

3. **Access the application** at `http://localhost:3001`

## 👥 User Roles & Permissions

### Administrator
- ✅ View all results
- ✅ Add individual results
- ✅ Bulk upload results
- ✅ Edit any result
- ✅ Delete any result
- ✅ Manage users
- ✅ View audit logs
- ✅ View security events

### Faculty
- ✅ View their course results
- ✅ Add results for their courses
- ✅ Edit their course results
- ❌ Delete results
- ❌ Bulk upload
- ❌ Manage users

### Student
- ✅ View their own results only
- ❌ Add/edit/delete results
- ❌ Bulk upload
- ❌ Manage users

## 📊 Adding Results

### Method 1: Individual Results
1. Login as Administrator or Faculty
2. Go to **Results** section
3. Click **"Add Result"** button
4. Fill in the form:
   - Student ID
   - Course Code
   - Course Title
   - Semester (First/Second)
   - Session (e.g., 2023/2024)
   - CA Score (0-30)
   - Exam Score (0-70)
   - Status (Draft/Under Review/Published)

### Method 2: Bulk Upload (Administrators Only)
1. Login as Administrator
2. Go to **Results** section
3. Scroll down to **Bulk Upload** section
4. Download the CSV template
5. Fill in your data following the template format
6. Upload the CSV file
7. Set semester, session, and status
8. Click **"Upload Results"**

## 📋 CSV Template Format

```csv
student_id,course_code,course_title,ca_score,exam_score
1001,CSC101,Introduction to Computer Science,25,65
1002,CSC101,Introduction to Computer Science,28,72
1003,CSC102,Programming Fundamentals,22,68
```

**Required fields:**
- `student_id`: Must exist in the database
- `course_code`: Course identifier
- `course_title`: Full course name
- `ca_score`: Continuous Assessment (0-30)
- `exam_score`: Final Exam (0-70)

## 🔍 Viewing Results

### Dashboard Statistics
- **Total Results**: Shows actual count from database
- **Published Results**: Results with "Published" status
- **Draft Results**: Results with "Draft" status
- **Security Alerts**: System security events

### Results Table
- **Search**: By student name, course code, or title
- **Filter**: By status and semester
- **Sort**: By various columns
- **Actions**: Edit/Delete (based on permissions)

## 🛡️ Security Features

### Audit Logging
All actions are logged with:
- User information
- Action performed
- Resource accessed
- IP address
- User agent
- Risk level assessment

### Role-Based Access Control (RBAC)
- Strict permission checking
- Unauthorized access blocking
- Activity monitoring

### Data Validation
- Input validation for all forms
- Score range validation (CA: 0-30, Exam: 0-70)
- Student ID verification
- Grade calculation automation

## 📈 API Endpoints

### Results Management
- `GET /api/results` - Get filtered results
- `POST /api/results` - Create new result
- `PUT /api/results/[id]` - Update result
- `DELETE /api/results/[id]` - Delete result

### Bulk Operations
- `POST /api/results/bulk` - Bulk upload results

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🗂️ Database Functions

### Core Functions
- `createResult()` - Add new result
- `updateResult()` - Modify existing result
- `deleteResult()` - Remove result
- `getAllResults()` - Get all results
- `getStudentResults()` - Get student's results
- `getFacultyResults()` - Get faculty's course results

### Utility Functions
- `calculateGrade()` - Convert score to grade
- `logAuditEvent()` - Record security events
- `validateInput()` - Data validation

## 🔄 Data Persistence

- **Automatic**: Database saves every 30 seconds
- **Manual**: Use `forceSaveDatabase()` function
- **File Location**: `data/in-memory-db.json`
- **Backup**: Database file can be backed up manually

## 🚀 Getting Started

1. **First Time Setup**:
   ```bash
   # Clear any existing hardcoded data
   node scripts/clear-results.js
   
   # Start the application
   pnpm dev
   ```

2. **Login Credentials**:
   - **Admin**: `admin@example.com` / `password123`
   - **Faculty**: `john.faculty@example.com` / `password123`
   - **Student**: `jane.student@example.com` / `password123`

3. **Add Your First Results**:
   - Login as Administrator
   - Go to Results section
   - Use Bulk Upload for multiple results
   - Or add individual results manually

## 📝 Notes

- All hardcoded results have been removed
- The system now uses real database operations
- All actions are logged for security
- Grade calculation is automatic
- Data persists between application restarts
- Role-based filtering is enforced at API level

## 🆘 Troubleshooting

### Common Issues
1. **"No results found"**: Database is empty, add results first
2. **"Permission denied"**: Check user role and permissions
3. **"Invalid student ID"**: Ensure student exists in database
4. **"Score validation failed"**: Check score ranges (CA: 0-30, Exam: 0-70)

### Reset Database
```bash
node scripts/clear-results.js
```

### Check Database State
```bash
# View database file
cat data/in-memory-db.json
``` 