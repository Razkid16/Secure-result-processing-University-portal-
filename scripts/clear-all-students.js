const fs = require('fs');
const path = require('path');

// Path to the database file
const dbPath = path.join(__dirname, '..', 'data', 'in-memory-db.json');

function clearAllStudents() {
  try {
    console.log('🗑️  Clearing all student data...');
    
    // Delete the existing database file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
      console.log('✅ Deleted existing database file');
    }
    
    // Create a clean database with only essential users
    const cleanDatabase = {
      users: [
        {
          id: 1,
          email: 'admin@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'System Administrator',
          role: 'Administrator',
          department: null,
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 2,
          email: 'john.faculty@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'John Faculty',
          role: 'Faculty',
          department: 'Computer Science',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        }
      ],
      audit_logs: [
        {
          id: 1,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'LOGIN',
          resource: 'auth',
          resource_id: null,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'LOW',
          details: { reason: 'Successful login' },
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 2,
          user_id: 2,
          user_email: 'john.faculty@example.com',
          user_name: 'John Faculty',
          action: 'VIEW_RESULTS',
          resource: 'results',
          resource_id: null,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'LOW',
          details: { reason: 'Faculty viewing course results' },
          created_at: new Date(Date.now() - 1800000).toISOString()
        }
      ],
      results: [],
      result_approval_requests: [],
      user_sessions: [],
      courses: [],
      security_events: [],
      security_patterns: []
    };
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Write the clean database
    fs.writeFileSync(dbPath, JSON.stringify(cleanDatabase, null, 2));
    
    console.log('✅ Successfully created clean database!');
    console.log('📊 Clean database contains:');
    console.log(`   - ${cleanDatabase.users.length} users (Admin + Faculty only)`);
    console.log(`   - ${cleanDatabase.audit_logs.length} audit logs`);
    console.log(`   - ${cleanDatabase.results.length} results`);
    console.log(`   - ${cleanDatabase.result_approval_requests.length} approval requests`);
    console.log(`   - ${cleanDatabase.user_sessions.length} user sessions`);
    
    console.log('\n👥 Remaining users:');
    cleanDatabase.users.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.email}`);
    });
    
    console.log('\n🎯 All hardcoded student data has been cleared!');
    console.log('🔄 Please restart your server to use the clean database.');
    
  } catch (error) {
    console.error('❌ Error clearing students:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the function
clearAllStudents(); 