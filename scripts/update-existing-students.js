const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'in-memory-db.json');

function updateExistingStudents() {
  try {
    console.log('🔄 Updating existing students with level and matric_number fields...');
    
    if (!fs.existsSync(dbPath)) {
      console.log('❌ Database file not found');
      return;
    }

    const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    let updated = false;

    // Update existing students
    dbData.users.forEach((user, index) => {
      if (user.role === 'Student') {
        console.log(`📝 Updating student: ${user.name} (ID: ${user.id})`);
        
        // Add level and matric_number if they don't exist
        if (!user.hasOwnProperty('level')) {
          dbData.users[index].level = null;
          updated = true;
        }
        if (!user.hasOwnProperty('matric_number')) {
          dbData.users[index].matric_number = null;
          updated = true;
        }
        
        // Also ensure other new fields exist
        if (!user.hasOwnProperty('public_key')) {
          dbData.users[index].public_key = null;
        }
        if (!user.hasOwnProperty('private_key')) {
          dbData.users[index].private_key = null;
        }
        if (!user.hasOwnProperty('certificate')) {
          dbData.users[index].certificate = null;
        }
        if (!user.hasOwnProperty('certificate_valid_until')) {
          dbData.users[index].certificate_valid_until = null;
        }
      }
    });

    if (updated) {
      fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
      console.log('✅ Successfully updated existing students');
      console.log('📊 Updated students:');
      dbData.users.filter(u => u.role === 'Student').forEach(student => {
        console.log(`   - ${student.name}: level=${student.level}, matric_number=${student.matric_number}`);
      });
    } else {
      console.log('ℹ️  No updates needed - all students already have the required fields');
    }

  } catch (error) {
    console.error('❌ Error updating students:', error);
  }
}

updateExistingStudents(); 