// NOTE: This file is intended for server-side use, but Next.js bundles all
// modules in the browser too.  We therefore guard the DB connection so it only
// happens when running on the server and when the env var is present.

// Temporarily disabled PostgreSQL for in-memory database
// import { Pool } from "pg"

// Import CryptoService for digital signatures
import { CryptoService } from './crypto'

// Dynamic imports for Node.js modules (server-side only)
let fs: any = null
let path: any = null

if (typeof window === "undefined") {
  // Server-side only
  try {
    fs = require('fs')
    path = require('path')
  } catch (error) {
    console.error('Failed to load Node.js modules:', error)
  }
}

const isServer = typeof window === "undefined"
const hasEnv = false // Force in-memory database

// Create a PostgreSQL connection pool
const pool = null // Force in-memory database

// Mock client for browser
const mockClient = {
  query: async () => ({ rows: [] })
}

// Global in-memory database that persists across all modules
declare global {
  var __inMemoryDB: any
  var __databaseSaveInterval: NodeJS.Timeout | null
}

// File path for database persistence (only defined on server)
let DB_FILE_PATH: string | null = null

if (isServer && path) {
  DB_FILE_PATH = path.join(process.cwd(), 'data', 'in-memory-db.json')
}

// Ensure data directory exists
function ensureDataDirectory() {
  if (!isServer || !fs || !path || !DB_FILE_PATH) return
  
  const dataDir = path.dirname(DB_FILE_PATH)
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Save database to file
// Debounced save mechanism
let saveTimeout: NodeJS.Timeout | null = null
const SAVE_DELAY = 1000 // 1 second delay

function saveDatabaseToFile() {
  if (!isServer || !global.__inMemoryDB || !fs || !path || !DB_FILE_PATH) {
    console.log('Cannot save database - missing requirements:', {
      isServer,
      hasDB: !!global.__inMemoryDB,
      hasFS: !!fs,
      hasPath: !!path,
      hasFilePath: !!DB_FILE_PATH
    })
    return
  }
  
  // Clear existing timeout
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  // Set new timeout for debounced save
  saveTimeout = setTimeout(() => {
    try {
      ensureDataDirectory()
      const dataToSave = JSON.stringify(global.__inMemoryDB, null, 2)
      fs.writeFileSync(DB_FILE_PATH, dataToSave)
      console.log('Database saved to file:', DB_FILE_PATH, 'Size:', dataToSave.length, 'bytes')
    } catch (error) {
      console.error('Failed to save database to file:', error)
    }
  }, SAVE_DELAY)
}



// Load database from file
function loadDatabaseFromFile() {
  if (!isServer || !fs || !path || !DB_FILE_PATH) {
    console.log('Cannot load database - missing requirements:', {
      isServer,
      hasFS: !!fs,
      hasPath: !!path,
      hasFilePath: !!DB_FILE_PATH
    })
    return null
  }
  
  try {
    ensureDataDirectory()
    if (fs.existsSync(DB_FILE_PATH)) {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf8')
      const db = JSON.parse(data)
      console.log('Database loaded from file:', DB_FILE_PATH, 'Size:', data.length, 'bytes')
      return db
    } else {
      console.log('Database file does not exist:', DB_FILE_PATH)
    }
  } catch (error) {
    console.error('Failed to load database from file:', error)
  }
  return null
}

// Initialize global in-memory database if it doesn't exist
if (!global.__inMemoryDB) {
  console.log('Initializing global in-memory database...')
  
  // Try to load from file first
  const savedDB = loadDatabaseFromFile()
  
  if (savedDB) {
    console.log('Loaded existing database from file')
    global.__inMemoryDB = savedDB
  } else {
    console.log('Creating new database with default data')
    // Initialize with default data
    global.__inMemoryDB = {
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
          email: 'sarah.lecturer@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'Sarah Johnson',
          role: 'Lecturer',
          department: 'Law',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 4,
          email: 'michael.lecturer@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'Michael Chen',
          role: 'Lecturer',
          department: 'Law',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 5,
          email: 'emma.lecturer@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'Emma Wilson',
          role: 'Lecturer',
          department: 'Computer Science',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 6,
          email: 'david.lecturer@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'David Brown',
          role: 'Lecturer',
          department: 'Engineering',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 7,
          email: 'lisa.lecturer@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'Lisa Garcia',
          role: 'Lecturer',
          department: 'Medicine',
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_login: null,
          failed_login_attempts: 0,
          locked_until: null
        },
        {
          id: 8,
          email: 'student@example.com',
          password_hash: '$2b$10$RlEqczi0mV9NAjhZbJe8G.J.kpFCrKwhAyl5vaxWzLmHO67as5E0y',
          name: 'St ud',
          role: 'Student',
          department: 'Law',
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
          created_at: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
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
          created_at: new Date(Date.now() - 1800000).toISOString() // 30 minutes ago
        },

        {
          id: 4,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'VIEW_AUDIT_LOGS',
          resource: 'audit_logs',
          resource_id: null,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'LOW',
          details: { reason: 'Administrator viewing audit logs' },
          created_at: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
        },
        {
          id: 5,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'CREATE_RESULT',
          resource: 'results',
          resource_id: '101',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'LOW',
          details: { studentId: 3, courseCode: 'CS101', score: 85 },
          created_at: new Date(Date.now() - 240000).toISOString() // 4 minutes ago
        },
        {
          id: 6,
          user_id: 2,
          user_email: 'john.faculty@example.com',
          user_name: 'John Faculty',
          action: 'UPDATE_RESULT',
          resource: 'results',
          resource_id: '102',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'MEDIUM',
          details: { newScore: 92, newGrade: 'A' },
          created_at: new Date(Date.now() - 180000).toISOString() // 3 minutes ago
        },
        {
          id: 7,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'DELETE_RESULT',
          resource: 'results',
          resource_id: '103',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'HIGH',
          details: { deletedResult: { id: 103, studentId: 3, courseCode: 'CS102', score: 78 } },
          created_at: new Date(Date.now() - 120000).toISOString() // 2 minutes ago
        },
        {
          id: 8,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'CREATE_USER',
          resource: 'users',
          resource_id: '4',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'MEDIUM',
          details: { createdUserEmail: 'new.student@example.com', role: 'Student' },
          created_at: new Date(Date.now() - 60000).toISOString() // 1 minute ago
        },
        {
          id: 9,
          user_id: 1,
          user_email: 'admin@example.com',
          user_name: 'System Administrator',
          action: 'DELETE_USER',
          resource: 'users',
          resource_id: '5',
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'HIGH',
          details: { deletedUserEmail: 'old.student@example.com', role: 'Student' },
          created_at: new Date(Date.now() - 30000).toISOString() // 30 seconds ago
        },
        {
          id: 10,
          user_id: 2,
          user_email: 'john.faculty@example.com',
          user_name: 'John Faculty',
          action: 'BULK_CREATE_RESULTS',
          resource: 'results',
          resource_id: null,
          ip_address: '127.0.0.1',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'SUCCESS',
          risk_level: 'MEDIUM',
          details: { totalRecords: 15, processedRecords: 14, errorCount: 1, department: 'Computer Science', role: 'Faculty' },
          created_at: new Date(Date.now() - 15000).toISOString() // 15 seconds ago
        }
      ],
      user_sessions: [],
      results: [
        {
          id: 1,
          student_id: 8,
          course_code: 'LAW101',
          course_title: 'Introduction to Law',
          semester: 'Second',
          session: '2025/2026',
          ca_score: 23,
          exam_score: 32,
          total_score: 55,
          grade: 'C',
          grade_point: 3.0,
          faculty_id: 1,
          status: 'Published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          lecturer_email: 'sarah.lecturer@example.com'
        },
        {
          id: 2,
          student_id: 8,
          course_code: 'LAW102',
          course_title: 'Introduction to Law 11',
          semester: 'Second',
          session: '2025/2026',
          ca_score: 23,
          exam_score: 32,
          total_score: 55,
          grade: 'C',
          grade_point: 3.0,
          faculty_id: 1,
          status: 'Published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          lecturer_email: 'sarah.lecturer@example.com'
        },
        {
          id: 3,
          student_id: 8,
          course_code: 'LAW103',
          course_title: 'Introduction to Law 111',
          semester: 'Second',
          session: '2025/2026',
          ca_score: 23,
          exam_score: 32,
          total_score: 55,
          grade: 'C',
          grade_point: 3.0,
          faculty_id: 1,
          status: 'Published',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          lecturer_email: 'sarah.lecturer@example.com'
        }
      ],
      security_events: [],
      courses: [
        {
          id: 1,
          course_code: 'CS101',
          course_title: 'Introduction to Computer Science',
          department: 'Computer Science',
          credits: 3,
          semester: 'First',
          academic_year: '2024/2025',
          lecturer_id: 2,
          lecturer_name: 'John Faculty',
          capacity: 50,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 2,
          course_code: 'CS201',
          course_title: 'Data Structures and Algorithms',
          department: 'Computer Science',
          credits: 4,
          semester: 'Second',
          academic_year: '2024/2025',
          lecturer_id: 2,
          lecturer_name: 'John Faculty',
          capacity: 40,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 3,
          course_code: 'MATH101',
          course_title: 'Calculus I',
          department: 'Mathematics',
          credits: 3,
          semester: 'First',
          academic_year: '2024/2025',
          lecturer_id: null,
          lecturer_name: null,
          capacity: 60,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 4,
          course_code: 'ENG101',
          course_title: 'Technical Writing',
          department: 'Engineering',
          credits: 2,
          semester: 'First',
          academic_year: '2024/2025',
          lecturer_id: null,
          lecturer_name: null,
          capacity: 45,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 5,
          course_code: 'LAW101',
          course_title: 'Introduction to Law',
          department: 'Law',
          credits: 3,
          semester: 'First',
          academic_year: '2024/2025',
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          capacity: 35,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 6,
          course_code: 'LAW102',
          course_title: 'Introduction to Law 11',
          department: 'Law',
          credits: 14,
          semester: 'Second',
          academic_year: '2024/2025',
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          capacity: 30,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        },
        {
          id: 7,
          course_code: 'LAW103',
          course_title: 'Introduction to Law 111',
          department: 'Law',
          credits: 3,
          semester: 'Second',
          academic_year: '2024/2025',
          lecturer_id: 3,
          lecturer_name: 'Sarah Johnson',
          capacity: 25,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 1
        }
      ],
      result_approvals: [],
      course_registrations: []
    }
    
    // Save the initial database to file
    saveDatabaseToFile()
  }
}

// Set up periodic database save (every 30 seconds) to ensure data persistence
if (isServer && !global.__databaseSaveInterval) {
  global.__databaseSaveInterval = setInterval(() => {
    if (global.__inMemoryDB) {
      console.log('Periodic database save...')
      saveDatabaseToFile()
    }
  }, 30000) // 30 seconds
  
  console.log('Periodic database save interval set up')
}

// Set up periodic session cleanup (every 5 minutes) to prevent accumulation of expired sessions
if (isServer && !(global as any).__sessionCleanupInterval) {
  (global as any).__sessionCleanupInterval = setInterval(async () => {
    if (global.__inMemoryDB) {
      console.log('Periodic session cleanup...')
      await cleanupExpiredSessions()
    }
  }, 300000) // 5 minutes
  
  console.log('Periodic session cleanup interval set up')
}

export const db = isServer && hasEnv ? pool : (isServer ? global.__inMemoryDB : mockClient)

if (isServer && !hasEnv) {
  // Fallback to in-memory database when DATABASE_URL is not set
  console.warn("DATABASE_URL environment variable is not set - using in-memory database with file persistence")
}

// Database utility functions
export async function executeQuery(query: string, params: any[] = []) {
  try {
    if (!isServer) {
      return { success: false, error: "Database not available" }
    }
    
    // In-memory database query - return empty for now
    return { success: true, data: [] }
  } catch (error) {
    console.error("Database query error:", error)
    return { success: false, error: "Database query failed" }
  }
}

export async function getUserByEmail(email: string) {
  if (!isServer) {
    return null
  }

  // In-memory database only
  const user = global.__inMemoryDB.users.find((u: any) => u.email === email)
  return user || null
}

export async function getUserById(id: number) {
  if (!isServer) {
    return null
  }

  // In-memory database only
  const user = global.__inMemoryDB.users.find((u: any) => u.id === id)
  return user || null
}

export async function updateLastLogin(userId: number) {
  if (!isServer) return

  // In-memory database only
  const user = global.__inMemoryDB.users.find((u: any) => u.id === userId)
  if (user) {
    user.last_login = new Date().toISOString()
    saveDatabaseToFile() // Save changes to file
  }
}

export async function incrementFailedLogins(email: string) {
  if (!isServer) return

  // In-memory database only
  const user = global.__inMemoryDB.users.find((u: any) => u.email === email)
  if (user) {
    user.failed_login_attempts = (user.failed_login_attempts || 0) + 1
    saveDatabaseToFile() // Save changes to file
  }
}

export async function resetFailedLogins(email: string) {
  if (!isServer) return

  // In-memory database only
  const user = global.__inMemoryDB.users.find((u: any) => u.email === email)
  if (user) {
    user.failed_login_attempts = 0
    user.locked_until = null
    saveDatabaseToFile() // Save changes to file
  }
}

export async function logAuditEvent(event: {
  userId?: number
  userEmail: string
  action: string
  resource?: string
  resourceId?: string
  ipAddress?: string
  userAgent?: string
  status: "SUCCESS" | "FAILED" | "BLOCKED"
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  details?: any
}) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // In-memory database only
  const auditLog = {
    id: global.__inMemoryDB.audit_logs.length + 1,
    user_id: event.userId || null,
    user_email: event.userEmail,
    action: event.action,
    resource: event.resource || null,
    resource_id: event.resourceId || null,
    ip_address: event.ipAddress || null,
    user_agent: event.userAgent || null,
    status: event.status,
    risk_level: event.riskLevel,
    details: event.details ? JSON.stringify(event.details) : null,
    created_at: new Date().toISOString()
  }

  global.__inMemoryDB.audit_logs.push(auditLog)
  saveDatabaseToFile() // Save changes to file
  return { success: true, data: auditLog }
}

export async function getAuditLogs(limit = 50, offset = 0) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // Ensure database is initialized
  ensureDatabaseInitialized()

  // In-memory database only
  const logs = global.__inMemoryDB.audit_logs
    .map((log: any) => {
      const user = global.__inMemoryDB.users.find((u: any) => u.id === log.user_id)
      return {
        ...log,
        user_name: user ? user.name : null
      }
    })
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(offset, offset + limit)

  return { success: true, data: logs }
}

// Session management functions
export async function createSession(userId: number, sessionToken: string, ipAddress: string, userAgent: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }
  
  // Ensure database is initialized
  ensureDatabaseInitialized()
  
  console.log("createSession called for user:", userId, "token:", sessionToken.substring(0, 10) + "...")
  
  // In-memory database only
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  const session = {
    id: global.__inMemoryDB.user_sessions.length + 1,
    user_id: userId,
    session_token: sessionToken,
    ip_address: ipAddress,
    user_agent: userAgent,
    expires_at: expiresAt.toISOString(),
    created_at: new Date().toISOString(),
    last_activity: new Date().toISOString()
  }
  
  global.__inMemoryDB.user_sessions.push(session)
  console.log("Session created, total sessions:", global.__inMemoryDB.user_sessions.length)
  saveDatabaseToFile() // Save changes to file
  return { success: true, data: session }
}

export async function getValidSession(sessionToken: string) {
  if (!isServer) {
    return null
  }
  
  // Ensure database is initialized
  ensureDatabaseInitialized()
  
  // In-memory database only
  const session = global.__inMemoryDB.user_sessions.find((s: any) => {
    const tokenMatch = s.session_token === sessionToken
    const notExpired = new Date(s.expires_at) > new Date()
    return tokenMatch && notExpired
  }) as any
  
  if (session) {
    const user = global.__inMemoryDB.users.find((u: any) => u.id === session.user_id)
    if (user) {
      return {
        session_token: session.session_token,
        user_id: session.user_id,
        ip_address: session.ip_address,
        user_agent: session.user_agent,
        expires_at: session.expires_at,
        created_at: session.created_at,
        last_activity: session.last_activity,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        faculty_id: user.faculty_id || null,
        lecturer_id: user.lecturer_id || null,
        gender: user.gender || null
      }
    }
  }
  
  return null
}

export async function updateLastActivity(sessionToken: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // In-memory database only
  const session = global.__inMemoryDB.user_sessions.find((s: any) => s.session_token === sessionToken)
  if (session) {
    session.last_activity = new Date().toISOString()
    saveDatabaseToFile() // Save changes to file
  }
  
  return { success: true }
}

export async function clearAllAuditLogs() {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  try {
    const totalCount = global.__inMemoryDB.audit_logs.length
    
    // If there are logs, keep only the most recent one (the clearing action)
    if (totalCount > 0) {
      const mostRecentLog = global.__inMemoryDB.audit_logs[totalCount - 1]
      global.__inMemoryDB.audit_logs = [mostRecentLog]
      const clearedCount = totalCount - 1 // Number of logs actually cleared
      saveDatabaseToFile() // Save changes to file
      return { success: true, clearedCount }
    } else {
      // No logs to clear
      return { success: true, clearedCount: 0 }
    }
  } catch (error) {
    console.error("Error clearing audit logs:", error)
    return { success: false, error: "Failed to clear audit logs" }
  }
}

export async function deleteSession(sessionToken: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  // In-memory database only
  const sessionIndex = global.__inMemoryDB.user_sessions.findIndex((s: any) => s.session_token === sessionToken)
  if (sessionIndex !== -1) {
    global.__inMemoryDB.user_sessions.splice(sessionIndex, 1)
    saveDatabaseToFile() // Save changes to file
  }
  
  return { success: true }
}

export async function clearAllSessions() {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  // Clear all sessions
  global.__inMemoryDB.user_sessions = []
  saveDatabaseToFile() // Save changes to file
  console.log("All sessions cleared")
  return { success: true, message: "All sessions cleared" }
}

export async function cleanupExpiredSessions() {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const now = new Date()
  const initialCount = global.__inMemoryDB.user_sessions.length
  
  // Remove expired sessions
  global.__inMemoryDB.user_sessions = global.__inMemoryDB.user_sessions.filter((session: any) => {
    const expiresAt = new Date(session.expires_at)
    return expiresAt > now
  })

  const removedCount = initialCount - global.__inMemoryDB.user_sessions.length
  
  if (removedCount > 0) {
    console.log(`Cleaned up ${removedCount} expired sessions`)
    saveDatabaseToFile() // Save changes to file
  }
  
  return { success: true, removedCount }
}

// Helper function to ensure database is properly initialized
export function ensureDatabaseInitialized() {
  if (!global.__inMemoryDB) {
    console.log('Database not initialized, reinitializing...')
    const savedDB = loadDatabaseFromFile()
    if (savedDB) {
      global.__inMemoryDB = savedDB
      console.log('Database reinitialized from file')
    } else {
      console.log('Failed to reinitialize database from file')
    }
  }
  return !!global.__inMemoryDB
}

// Debug function to check database state
export function debugDatabaseState() {
  if (!isServer) {
    console.log('Debug: Not on server side')
    return
  }
  
  console.log('Debug: Database state:', {
    hasGlobalDB: !!global.__inMemoryDB,
    userCount: global.__inMemoryDB?.users?.length || 0,
    sessionCount: global.__inMemoryDB?.user_sessions?.length || 0,
    auditLogCount: global.__inMemoryDB?.audit_logs?.length || 0,
    hasFile: isServer && fs && path && DB_FILE_PATH ? fs.existsSync(DB_FILE_PATH) : false
  })
}

// Force save database
export function forceSaveDatabase() {
  if (!isServer) {
    console.log('Cannot save database - not on server side')
    return false
  }
  
  // Clear any pending debounced save
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  
  ensureDatabaseInitialized()
  
  // Force immediate save
  try {
    ensureDataDirectory()
    const dataToSave = JSON.stringify(global.__inMemoryDB, null, 2)
    fs.writeFileSync(DB_FILE_PATH, dataToSave)
    console.log('Database force saved to file:', DB_FILE_PATH, 'Size:', dataToSave.length, 'bytes')
  } catch (error) {
    console.error('Failed to force save database to file:', error)
    return false
  }
  
  return true
}

// Cleanup function to clear the save interval
export function cleanupDatabase() {
  if (global.__databaseSaveInterval) {
    clearInterval(global.__databaseSaveInterval)
    global.__databaseSaveInterval = null
    console.log('Database save interval cleared')
  }
  
  if ((global as any).__sessionCleanupInterval) {
    clearInterval((global as any).__sessionCleanupInterval)
    ;(global as any).__sessionCleanupInterval = null
    console.log('Session cleanup interval cleared')
  }
  
  // Clear any pending debounced save
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
    console.log('Database save timeout cleared')
  }
}

// Function to clear all academic results
export function clearAllResults() {
  if (!isServer) {
    console.log('Cannot clear results - not on server side')
    return false
  }

  ensureDatabaseInitialized()
  
  // Clear all results
  global.__inMemoryDB.academic_results = []
  
  console.log('Cleared all academic results')
  saveDatabaseToFile()
  return true
}

// Permission management functions
export async function getUserPermissions(role: string) {
  if (!isServer) {
    return []
  }
  
  // In-memory database only - return hardcoded permissions
  const rolePermissions = {
    Administrator: [
      { name: "view_results", description: "View all results", resource: "results", action: "view" },
      { name: "edit_results", description: "Edit results", resource: "results", action: "edit" },
      { name: "delete_results", description: "Delete results", resource: "results", action: "delete" },
      { name: "export_data", description: "Export data", resource: "data", action: "export" },
      { name: "manage_users", description: "Manage users", resource: "users", action: "manage" },
      { name: "view_audit_logs", description: "View audit logs", resource: "audit", action: "view" },
      { name: "system_config", description: "System configuration", resource: "system", action: "config" },
      { name: "view_security_events", description: "View security events", resource: "security", action: "view" },
      { name: "bulk_operations", description: "Bulk operations", resource: "operations", action: "bulk" },
      { name: "view_courses", description: "View academic courses", resource: "courses", action: "view" },
      { name: "create_courses", description: "Create new academic courses", resource: "courses", action: "create" },
      { name: "update_courses", description: "Update existing academic courses", resource: "courses", action: "update" },
      { name: "delete_courses", description: "Delete academic courses", resource: "courses", action: "delete" },
      { name: "view_course_registrations", description: "View all course registrations", resource: "course_registrations", action: "view" },
      { name: "create_course_registrations", description: "Create course registrations", resource: "course_registrations", action: "create" },
      { name: "update_course_registrations", description: "Update course registrations", resource: "course_registrations", action: "update" },
      { name: "delete_course_registrations", description: "Delete course registrations", resource: "course_registrations", action: "delete" },
      { name: "approve_course_registrations", description: "Approve course registrations", resource: "course_registrations", action: "approve" },
      { name: "reject_course_registrations", description: "Reject course registrations", resource: "course_registrations", action: "reject" }
    ],
    Faculty: [
      { name: "view_results", description: "View results", resource: "results", action: "view" },
      { name: "edit_results", description: "Edit results", resource: "results", action: "edit" },
      { name: "export_data", description: "Export data", resource: "data", action: "export" },
      { name: "approve_results", description: "Approve lecturer result uploads", resource: "results", action: "approve" },
      { name: "view_courses", description: "View academic courses", resource: "courses", action: "view" },
      { name: "create_courses", description: "Create new academic courses", resource: "courses", action: "create" },
      { name: "update_courses", description: "Update existing academic courses", resource: "courses", action: "update" },
      { name: "view_course_registrations", description: "View course registrations in department", resource: "course_registrations", action: "view" },
      { name: "create_course_registrations", description: "Create course registrations", resource: "course_registrations", action: "create" },
      { name: "update_course_registrations", description: "Update course registrations", resource: "course_registrations", action: "update" },
      { name: "delete_course_registrations", description: "Delete course registrations", resource: "course_registrations", action: "delete" },
      { name: "approve_course_registrations", description: "Approve course registrations", resource: "course_registrations", action: "approve" },
      { name: "reject_course_registrations", description: "Reject course registrations", resource: "course_registrations", action: "reject" }
    ],
    Lecturer: [
      { name: "view_results", description: "View results", resource: "results", action: "view" },
      { name: "request_result_upload", description: "Request result upload approval", resource: "results", action: "request_upload" },
      { name: "export_data", description: "Export data", resource: "data", action: "export" },
      { name: "view_courses", description: "View academic courses", resource: "courses", action: "view" },
      { name: "view_course_registrations", description: "View course registrations for assigned courses", resource: "course_registrations", action: "view" }
    ],
    Student: [
      { name: "view_results", description: "View own results", resource: "results", action: "view" },
      { name: "view_courses", description: "View academic courses", resource: "courses", action: "view" },
      { name: "view_course_registrations", description: "View own course registrations", resource: "course_registrations", action: "view" },
      { name: "create_course_registrations", description: "Create course registrations", resource: "course_registrations", action: "create" },
      { name: "update_course_registrations", description: "Update own course registrations", resource: "course_registrations", action: "update" },
      { name: "delete_course_registrations", description: "Delete own course registrations", resource: "course_registrations", action: "delete" }
    ],
    Staff: [
      { name: "view_results", description: "View results", resource: "results", action: "view" },
      { name: "view_audit_logs", description: "View audit logs", resource: "audit", action: "view" },
      { name: "view_courses", description: "View academic courses", resource: "courses", action: "view" }
    ]
  }
  
  return rolePermissions[role as keyof typeof rolePermissions] || []
}

export async function hasUserPermission(role: string, permissionName: string): Promise<boolean> {
  if (!isServer) {
  return false
}

  // In-memory database only - check hardcoded permissions
  const permissions = await getUserPermissions(role)
  return permissions.some(perm => perm.name === permissionName)
}

// Results management functions
export async function getStudentResults(studentId: number) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const results = global.__inMemoryDB.academic_results.filter((result: any) => result.student_id === studentId)
  return { success: true, data: results }
}

export async function getFacultyResults(facultyId: number) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const results = global.__inMemoryDB.academic_results.filter((result: any) => result.faculty_id === facultyId)
  return { success: true, data: results }
}

export async function getAllResults() {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const results = global.__inMemoryDB.results || []
  return { success: true, data: results }
}

export async function createResult(resultData: {
  student_id: number
  course_code: string
  course_title: string
  semester: string
  session: string
  ca_score: number
  exam_score: number
  total_score: number
  grade: string
  grade_point: number
  faculty_id: number
  status?: "Draft" | "Published" | "Under Review" | "Pending" | "Denied"
  faculty_note?: string | null
  hash?: string | null
  lecturer_id?: number | null
  lecturer_email?: string | null
  lecturer_name?: string | null
  ip_address?: string | null
  location?: string | null
  user_agent?: string | null
}) {
  console.log('createResult called with:', resultData);
  console.log('- Hash value:', resultData.hash);
  console.log('- Hash type:', typeof resultData.hash);
  
  if (!isServer) {
    console.log('createResult: Not on server');
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const newResult = {
    id: (global.__inMemoryDB.results?.length || 0) + 1,
    student_id: resultData.student_id,
    course_code: resultData.course_code,
    course_title: resultData.course_title,
    semester: resultData.semester,
    session: resultData.session,
    ca_score: resultData.ca_score,
    exam_score: resultData.exam_score,
    total_score: resultData.total_score,
    grade: resultData.grade,
    grade_point: resultData.grade_point,
    faculty_id: resultData.faculty_id,
    status: resultData.status || "Draft",
    faculty_note: resultData.faculty_note || null,
    hash: resultData.hash || null,
    lecturer_id: resultData.lecturer_id || null,
    lecturer_email: resultData.lecturer_email || null,
    lecturer_name: resultData.lecturer_name || null,
    ip_address: resultData.ip_address || null,
    location: resultData.location || null,
    user_agent: resultData.user_agent || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (!global.__inMemoryDB.results) {
    global.__inMemoryDB.results = []
  }
  global.__inMemoryDB.results.push(newResult)
  console.log('Result saved successfully. Total results:', global.__inMemoryDB.results.length);
  await saveDatabaseToFile()
  return { success: true, data: newResult }
}

export async function updateResult(resultId: number, updateData: {
  course_code?: string
  course_title?: string
  semester?: string
  session?: string
  ca_score?: number
  exam_score?: number
  total_score?: number
  grade?: string
  grade_point?: number
  status?: "Draft" | "Published" | "Under Review" | "Pending" | "Denied"
  approval_notes?: string | null
  approved_by?: number | null
  approved_at?: string | null
  faculty_note?: string | null
}) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const resultIndex = global.__inMemoryDB.results?.findIndex((r: any) => r.id === resultId) || -1
  if (resultIndex === -1) {
    return { success: false, error: "Result not found" }
  }

  const updatedResult = {
    ...global.__inMemoryDB.results[resultIndex],
    ...updateData,
    updated_at: new Date().toISOString()
  }

  global.__inMemoryDB.results[resultIndex] = updatedResult
  await saveDatabaseToFile()
  return { success: true, data: updatedResult }
}

export async function deleteResult(resultId: number) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const resultIndex = global.__inMemoryDB.results?.findIndex((r: any) => r.id === resultId) || -1
  if (resultIndex === -1) {
    return { success: false, error: "Result not found" }
  }

  const deletedResult = global.__inMemoryDB.results[resultIndex]
  global.__inMemoryDB.results.splice(resultIndex, 1)
  saveDatabaseToFile()
  return { success: true, data: deletedResult }
}

// User management functions
export async function createUser(userData: {
  email: string
  name: string
  password_hash: string
  role: string
  department: string
  faculty_id?: number | null
  level?: string | null
  matric_number?: string | null
  lecturer_id?: string | null
  gender?: string | null
}) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // Ensure database is initialized
  ensureDatabaseInitialized()

  // In-memory database only
  const newUser = {
    id: global.__inMemoryDB.users.length + 1,
    email: userData.email,
    name: userData.name,
    password_hash: userData.password_hash,
    role: userData.role,
    department: userData.department,
    faculty_id: userData.faculty_id || null,
    level: userData.level || null,
    matric_number: userData.matric_number || null,
    lecturer_id: userData.lecturer_id || null,
    gender: userData.gender || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null,
    failed_login_attempts: 0,
    is_active: true
  }

  global.__inMemoryDB.users.push(newUser)
  saveDatabaseToFile() // Save changes to file
  return { success: true, data: newUser }
}

export async function getUsers() {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // Ensure database is initialized
  ensureDatabaseInitialized()

  // In-memory database only - return users without password hashes
  const users = global.__inMemoryDB.users.map((user: any) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    department: user.department,
    faculty_id: user.faculty_id || null,
    level: user.level || null,
    matric_number: user.matric_number || null,
    lecturer_id: user.lecturer_id || null,
    gender: user.gender || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login: user.last_login,
    failed_login_attempts: user.failed_login_attempts,
    is_active: user.is_active,
    public_key: user.public_key || null,
    private_key: user.private_key || null,
    certificate: user.certificate || null,
    certificate_valid_until: user.certificate_valid_until || null
  }))

  return { success: true, data: users }
}

export async function updateUser(userId: number, updateData: {
  email?: string
  name?: string
  role?: string
  department?: string
  faculty_id?: number | null
  is_active?: boolean
  lecturer_id?: string | null
  gender?: string | null
  private_key_password?: string | null
  public_key?: string | null
  private_key?: string | null
  certificate?: string | null
  certificate_valid_until?: string | null
}) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const userIndex = global.__inMemoryDB.users.findIndex((user: any) => user.id === userId)
  if (userIndex === -1) {
    throw new Error("User not found")
  }

  console.log('updateUser debug:');
  console.log('- User ID:', userId);
  console.log('- Update data:', updateData);
  console.log('- Current user data:', global.__inMemoryDB.users[userIndex]);

  global.__inMemoryDB.users[userIndex] = {
    ...global.__inMemoryDB.users[userIndex],
    ...updateData,
    updated_at: new Date().toISOString(),
  }

  console.log('- Updated user data:', global.__inMemoryDB.users[userIndex]);

  await saveDatabaseToFile()
  return global.__inMemoryDB.users[userIndex]
}

export async function deleteUser(userId: number) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  // In-memory database only
  const userIndex = global.__inMemoryDB.users.findIndex((u: any) => u.id === userId)
  if (userIndex === -1) {
    return { success: false, error: "User not found" }
  }

  const deletedUser = global.__inMemoryDB.users[userIndex]
  global.__inMemoryDB.users.splice(userIndex, 1)

  // Also delete associated sessions
  global.__inMemoryDB.user_sessions = global.__inMemoryDB.user_sessions.filter((s: any) => s.user_id !== userId)

  saveDatabaseToFile() // Save changes to file
  return { success: true, data: deletedUser }
}

export async function getLecturersByDepartment(department: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  // Filter users to get only lecturers in the specified department
  const lecturers = global.__inMemoryDB.users
    .filter((user: any) => user.role === "Lecturer" && user.department === department)
    .map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      department: user.department,
      faculty_id: user.faculty_id || null,
      lecturer_id: user.lecturer_id || null,
      created_at: user.created_at,
      updated_at: user.updated_at,
      last_login: user.last_login,
      is_active: user.is_active,
      public_key: user.public_key || null,
      private_key: user.private_key || null,
      certificate: user.certificate || null,
      certificate_valid_until: user.certificate_valid_until || null
    }))

  return { success: true, data: lecturers }
}

// Result Approval Workflow Functions
export async function createResultApprovalRequest(requestData: {
  lecturer_id: number
  faculty_id: number
  course_code: string
  course_title: string
  semester: string
  session: string
  student_count: number
  reason: string
  ipAddress?: string
  userAgent?: string
}) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const newRequest = {
    id: global.__inMemoryDB.result_approvals.length + 1,
    lecturer_id: requestData.lecturer_id,
    faculty_id: requestData.faculty_id,
    course_code: requestData.course_code,
    course_title: requestData.course_title,
    semester: requestData.semester,
    session: requestData.session,
    student_count: requestData.student_count,
    reason: requestData.reason,
    status: "PENDING",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    approved_at: null,
    denied_at: null,
    approved_by: null,
    denied_by: null,
    denial_reason: null
  }

  global.__inMemoryDB.result_approvals.push(newRequest)
  saveDatabaseToFile()

  return { success: true, data: newRequest }
}

export async function getResultApprovalRequests(userId: number, userRole: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  let requests = global.__inMemoryDB.result_approvals

  // Filter based on user role
  if (userRole === "Lecturer") {
    requests = requests.filter((req: any) => req.lecturer_id === userId)
  } else if (userRole === "Faculty") {
    requests = requests.filter((req: any) => req.faculty_id === userId)
  }
  // Administrators can see all requests

  return { success: true, data: requests }
}

export async function approveResultRequest(requestId: number, facultyId: number, approvalReason?: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const requestIndex = global.__inMemoryDB.result_approvals.findIndex((req: any) => req.id === requestId)
  if (requestIndex === -1) {
    return { success: false, error: "Request not found" }
  }

  const request = global.__inMemoryDB.result_approvals[requestIndex]
  if (request.status !== "PENDING") {
    return { success: false, error: "Request is not pending" }
  }

  if (request.faculty_id !== facultyId) {
    return { success: false, error: "Unauthorized to approve this request" }
  }

  const updatedRequest = {
    ...request,
    status: "APPROVED",
    approved_at: new Date().toISOString(),
    approved_by: facultyId,
    updated_at: new Date().toISOString()
  }

  global.__inMemoryDB.result_approvals[requestIndex] = updatedRequest
  saveDatabaseToFile()

  return { success: true, data: updatedRequest }
}

export async function denyResultRequest(requestId: number, facultyId: number, denialReason: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  const requestIndex = global.__inMemoryDB.result_approvals.findIndex((req: any) => req.id === requestId)
  if (requestIndex === -1) {
    return { success: false, error: "Request not found" }
  }

  const request = global.__inMemoryDB.result_approvals[requestIndex]
  if (request.status !== "PENDING") {
    return { success: false, error: "Request is not pending" }
  }

  if (request.faculty_id !== facultyId) {
    return { success: false, error: "Unauthorized to deny this request" }
  }

  const updatedRequest = {
    ...request,
    status: "DENIED",
    denied_at: new Date().toISOString(),
    denied_by: facultyId,
    denial_reason: denialReason,
    updated_at: new Date().toISOString()
  }

  global.__inMemoryDB.result_approvals[requestIndex] = updatedRequest
  saveDatabaseToFile()

  return { success: true, data: updatedRequest }
}

export async function canLecturerUploadResults(lecturerId: number, courseCode: string, semester: string, session: string) {
  if (!isServer) {
    return { success: false, error: "Database not available" }
  }

  ensureDatabaseInitialized()

  // Check if there's an approved request for this lecturer and course
  const approvedRequest = global.__inMemoryDB.result_approvals.find((req: any) => 
    req.lecturer_id === lecturerId &&
    req.course_code === courseCode &&
    req.semester === semester &&
    req.session === session &&
    req.status === "APPROVED"
  )

  return { 
    success: true, 
    canUpload: !!approvedRequest,
    request: approvedRequest || null
  }
} 

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'faculty' | 'lecturer' | 'student';
  department?: string;
  faculty?: string;
  isOnline: boolean;
  lastSeen: string;
  public_key?: string;
  private_key?: string;
  certificate?: string;
  certificate_valid_until?: string;
} 

interface AcademicResult {
  id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  course_title: string;
  course_code: string;
  score: number;
  grade: string;
  semester: string;
  academic_year: string;
  status: 'draft' | 'pending' | 'published' | 'denied';
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by?: number;
  hash?: string | null;
  lecturer_id?: number | null;
  lecturer_email?: string | null;
  lecturer_name?: string | null;
  ip_address?: string | null;
  location?: string | null;
  user_agent?: string | null;
  signatures?: {
    [action: string]: {
      userId: number;
      userName: string;
      userEmail: string;
      signature: string;
      timestamp: string;
      action: string;
    };
  };
} 

// Digital Signature Functions
export function generateUserKeys(userId: number): { publicKey: string; privateKey: string; certificate: string } | null {
  console.log('generateUserKeys called with userId:', userId);
  
  if (!isServer) {
    console.log('Not on server, returning null');
    return null;
  }

  try {
    ensureDatabaseInitialized();
    console.log('Database initialized');
    
    const userIndex = global.__inMemoryDB.users.findIndex((u: any) => u.id === userId);
    console.log('User index:', userIndex);
    
    if (userIndex === -1) {
      console.log('User not found');
      return null;
    }

    const user = global.__inMemoryDB.users[userIndex];
    console.log('Found user:', user.name);
    
    console.log('Generating key pair...');
    const { publicKey, privateKey } = CryptoService.generateKeyPair();
    console.log('Key pair generated');
    
    console.log('Generating certificate...');
    const certificate = CryptoService.generateCertificate(
      publicKey,
      user.id,
      user.name,
      user.email,
      user.role
    );
    console.log('Certificate generated');

    // Update user with keys
    user.public_key = publicKey;
    user.private_key = privateKey;
    user.certificate = certificate;
    user.certificate_valid_until = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

    global.__inMemoryDB.users[userIndex] = user;
    saveDatabaseToFile();
    console.log('User updated and database saved');

    return { publicKey, privateKey, certificate };
  } catch (error) {
    console.error('Error in generateUserKeys:', error);
    throw error;
  }
}

export function getUserCertificate(userId: number): string | null {
  if (!isServer) {
    return null;
  }

  ensureDatabaseInitialized();
  
  const user = global.__inMemoryDB.users.find((u: any) => u.id === userId);
  return user?.certificate || null;
}

export function getUserPrivateKey(userId: number): string | null {
  if (!isServer) {
    return null;
  }

  ensureDatabaseInitialized();
  
  const user = global.__inMemoryDB.users.find((u: any) => u.id === userId);
  return user?.private_key || null;
}

export function resetAllDigitalSignatures(): boolean {
  if (!isServer) {
    return false;
  }

  try {
    ensureDatabaseInitialized();
    
    // Reset all users' digital signature data and passwords
    global.__inMemoryDB.users = global.__inMemoryDB.users.map((user: any) => ({
      ...user,
      public_key: undefined,
      private_key: undefined,
      certificate: undefined,
      certificate_valid_until: undefined,
      private_key_password: undefined
    }));

    saveDatabaseToFile();
    console.log('All digital signatures and passwords have been reset');
    return true;
  } catch (error) {
    console.error('Error resetting digital signatures:', error);
    return false;
  }
}

export function signResult(resultId: number, userId: number, action: 'submit' | 'approve' | 'deny' | 'publish'): boolean {
  if (!isServer) {
    return false;
  }

  ensureDatabaseInitialized();
  
  const user = global.__inMemoryDB.users.find((u: any) => u.id === userId);
  const resultIndex = global.__inMemoryDB.results?.findIndex((r: any) => r.id === resultId) || -1;
  
  if (!user || resultIndex === -1 || !user.private_key) return false;

  const result = global.__inMemoryDB.results[resultIndex];
  const timestamp = new Date().toISOString();
  const dataHash = CryptoService.generateHash(JSON.stringify({
    resultId,
    student_id: result.student_id,
    course_code: result.course_code,
    score: result.score,
    timestamp
  }));

  const signatureData = CryptoService.createResultSignature(
    resultId,
    userId,
    action,
    timestamp,
    dataHash
  );

  const signature = CryptoService.signData(signatureData, user.private_key);

  // Initialize signatures object if it doesn't exist
  if (!result.signatures) {
    result.signatures = {};
  }

  result.signatures[action] = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    signature,
    timestamp,
    action
  };

  global.__inMemoryDB.results[resultIndex] = result;
  saveDatabaseToFile();

  return true;
}

export function verifyResultSignature(resultId: number, action: string): boolean {
  if (!isServer) {
    return false;
  }

  ensureDatabaseInitialized();
  
  const result = global.__inMemoryDB.results?.find((r: any) => r.id === resultId);
  if (!result || !result.signatures || !result.signatures[action]) return false;

  const signatureInfo = result.signatures[action];
  const user = global.__inMemoryDB.users.find((u: any) => u.id === signatureInfo.userId);
  if (!user || !user.public_key) return false;

  const timestamp = signatureInfo.timestamp;
  const dataHash = CryptoService.generateHash(JSON.stringify({
    resultId,
    student_id: result.student_id,
    course_code: result.course_code,
    score: result.score,
    timestamp
  }));

  const signatureData = CryptoService.createResultSignature(
    resultId,
    signatureInfo.userId,
    action as any,
    timestamp,
    dataHash
  );

  return CryptoService.verifyResultSignature(signatureData, signatureInfo.signature, user.public_key);
}

// Course management functions
export async function createCourse(courseData: {
  course_code: string
  course_title: string
  department: string
  credits: number
  semester: string
  academic_year: string
  lecturer_id?: number | null
  capacity: number
  is_active?: boolean
  created_by: number
}) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const newCourse = {
    id: global.__inMemoryDB.courses.length + 1,
    ...courseData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: courseData.is_active !== undefined ? courseData.is_active : true,
  }

  global.__inMemoryDB.courses.push(newCourse)
  await saveDatabaseToFile()
  
  return newCourse
}

export async function getCourses() {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()
  return global.__inMemoryDB.courses
}

export async function getCourseById(courseId: number) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()
  return global.__inMemoryDB.courses.find((course: any) => course.id === courseId)
}

export async function updateCourse(courseId: number, updateData: {
  course_code?: string
  course_title?: string
  department?: string
  credits?: number
  semester?: string
  academic_year?: string
  lecturer_id?: number | null
  capacity?: number
  is_active?: boolean
}) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const courseIndex = global.__inMemoryDB.courses.findIndex((course: any) => course.id === courseId)
  if (courseIndex === -1) {
    throw new Error("Course not found")
  }

  global.__inMemoryDB.courses[courseIndex] = {
    ...global.__inMemoryDB.courses[courseIndex],
    ...updateData,
    updated_at: new Date().toISOString(),
  }

  await saveDatabaseToFile()
  return global.__inMemoryDB.courses[courseIndex]
}

export async function deleteCourse(courseId: number) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const courseIndex = global.__inMemoryDB.courses.findIndex((course: any) => course.id === courseId)
  if (courseIndex === -1) {
    throw new Error("Course not found")
  }

  const deletedCourse = global.__inMemoryDB.courses.splice(courseIndex, 1)[0]
  await saveDatabaseToFile()
  
  return deletedCourse
}

// Course registration functions
export async function createCourseRegistration(registrationData: {
  student_id: number
  course_id: number
  semester: string
  session: string
  notes?: string | null
}) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  // Get student and course details
  const student = global.__inMemoryDB.users.find((u: any) => u.id === registrationData.student_id)
  const course = global.__inMemoryDB.courses.find((c: any) => c.id === registrationData.course_id)

  if (!student) {
    throw new Error("Student not found")
  }

  if (!course) {
    throw new Error("Course not found")
  }

  const newRegistration = {
    id: (global.__inMemoryDB.course_registrations?.length || 0) + 1,
    student_id: registrationData.student_id,
    student_name: student.name,
    student_email: student.email,
    course_id: registrationData.course_id,
    course_code: course.course_code,
    course_title: course.course_title,
    credits: course.credits,
    semester: registrationData.semester,
    session: registrationData.session,
    status: "Approved",
    registration_date: new Date().toISOString(),
    notes: registrationData.notes || null,
    approved_by: registrationData.student_id, // Auto-approve by student
    approved_at: new Date().toISOString()
  }

  if (!global.__inMemoryDB.course_registrations) {
    global.__inMemoryDB.course_registrations = []
  }
  global.__inMemoryDB.course_registrations.push(newRegistration)
  await saveDatabaseToFile()
  
  return newRegistration
}

export async function getCourseRegistrations(studentId?: number, department?: string) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()
  let registrations = global.__inMemoryDB.course_registrations || []

  if (studentId) {
    registrations = registrations.filter((r: any) => r.student_id === studentId)
  }

  if (department) {
    // Filter by department - this would need to be implemented based on your data structure
    // For now, return all registrations
  }

  // Ensure credits are properly populated from courses
  const courses = global.__inMemoryDB.courses || []
  const enrichedRegistrations = registrations.map((registration: any) => {
    const course = courses.find((c: any) => c.id === registration.course_id)
    return {
      ...registration,
      credits: course ? course.credits : registration.credits || 0
    }
  })

  return enrichedRegistrations
}

export async function updateCourseRegistration(registrationId: number, updateData: {
  status?: "Pending" | "Approved" | "Rejected" | "Dropped"
  approved_by?: number | null
  approved_at?: string | null
  notes?: string | null
}) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const registrationIndex = global.__inMemoryDB.course_registrations.findIndex((r: any) => r.id === registrationId)
  if (registrationIndex === -1) {
    throw new Error("Course registration not found")
  }

  global.__inMemoryDB.course_registrations[registrationIndex] = {
    ...global.__inMemoryDB.course_registrations[registrationIndex],
    ...updateData,
    updated_at: new Date().toISOString(),
  }

  await saveDatabaseToFile()
  return global.__inMemoryDB.course_registrations[registrationIndex]
}

export async function deleteCourseRegistration(registrationId: number) {
  if (!isServer) {
    throw new Error("Database operations can only be performed on the server")
  }

  ensureDatabaseInitialized()

  const registrationIndex = global.__inMemoryDB.course_registrations.findIndex((r: any) => r.id === registrationId)
  if (registrationIndex === -1) {
    throw new Error("Course registration not found")
  }

  const deletedRegistration = global.__inMemoryDB.course_registrations.splice(registrationIndex, 1)[0]
  await saveDatabaseToFile()
  
  return deletedRegistration
} 