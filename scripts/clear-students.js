const fs = require('fs');
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, '..', 'data', 'in-memory-db.json');

function clearStudents() {
  try {
    console.log('Reading database from:', dbPath);
    
    // Check if file exists
    if (!fs.existsSync(dbPath)) {
      console.error('❌ Database file not found:', dbPath);
      return;
    }
    
    // Read the current database
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    
    console.log('Current users count:', dbData.users.length);
    console.log('Current users:');
    dbData.users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - ${user.email}`);
    });
    
    // Keep only essential users (Admin, Faculty, Lecturer roles)
    const essentialUsers = dbData.users.filter(user => 
      user.role === 'Administrator' || 
      user.role === 'Faculty' || 
      user.role === 'Lecturer'
    );
    
    console.log('\nEssential users to keep:', essentialUsers.length);
    console.log('Users being removed:', dbData.users.length - essentialUsers.length);
    
    // Update the database with only essential users
    dbData.users = essentialUsers;
    
    // Clear all results since they reference students
    if (dbData.results) {
      console.log('Cleared all results (count:', dbData.results.length, ')');
      dbData.results = [];
    }
    
    // Clear all result approval requests
    if (dbData.result_approval_requests) {
      console.log('Cleared all result approval requests (count:', dbData.result_approval_requests.length, ')');
      dbData.result_approval_requests = [];
    }
    
    // Clear all user sessions
    if (dbData.user_sessions) {
      console.log('Cleared all user sessions (count:', dbData.user_sessions.length, ')');
      dbData.user_sessions = [];
    }
    
    // Keep audit logs but clear any that reference deleted students
    if (dbData.audit_logs) {
      const essentialUserIds = essentialUsers.map(u => u.id);
      const originalAuditCount = dbData.audit_logs.length;
      dbData.audit_logs = dbData.audit_logs.filter(log => 
        !log.user_id || essentialUserIds.includes(log.user_id)
      );
      console.log('Cleared audit logs for deleted users (removed:', originalAuditCount - dbData.audit_logs.length, ')');
    }
    
    // Write the updated database back to file
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));
    
    console.log('\n✅ Successfully cleared all student data!');
    console.log('Remaining users:');
    essentialUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - ${user.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error clearing students:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
clearStudents(); 