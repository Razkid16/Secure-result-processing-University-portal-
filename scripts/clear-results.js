const fs = require('fs')
const path = require('path')

// Path to the database file
const dbPath = path.join(process.cwd(), 'data', 'in-memory-db.json')

console.log('Clearing all academic results from database...')

try {
  // Check if database file exists
  if (fs.existsSync(dbPath)) {
    // Read current database
    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'))
    
    // Clear academic results
    dbData.academic_results = []
    
    // Save updated database
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2))
    
    console.log('✅ Successfully cleared all academic results')
    console.log('📊 Database now contains:')
    console.log(`   - ${dbData.users.length} users`)
    console.log(`   - ${dbData.audit_logs.length} audit logs`)
    console.log(`   - ${dbData.academic_results.length} academic results`)
    console.log(`   - ${dbData.user_sessions.length} user sessions`)
  } else {
    console.log('❌ Database file not found. Creating new database...')
    
    // Create new database with empty results
    const newDb = {
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
        },
        {
          id: 3,
          email: 'jane.student@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'Jane Student',
          role: 'Student',
          department: 'Computer Science',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        }
      ],
      audit_logs: [],
      academic_results: [],
      user_sessions: [],
      security_events: [],
      courses: []
    }
    
    // Ensure data directory exists
    const dataDir = path.dirname(dbPath)
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    // Save new database
    fs.writeFileSync(dbPath, JSON.stringify(newDb, null, 2))
    
    console.log('✅ Created new database with empty results')
  }
} catch (error) {
  console.error('❌ Error clearing results:', error)
  process.exit(1)
}

console.log('\n🎉 Database is now ready for manual result uploads!')
console.log('📝 You can now:')
console.log('   1. Login as Administrator')
console.log('   2. Go to Results section')
console.log('   3. Use the Bulk Upload feature to add results')
console.log('   4. Or add individual results manually') 