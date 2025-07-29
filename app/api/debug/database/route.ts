import { NextResponse } from "next/server"
import { debugDatabaseState, forceSaveDatabase, ensureDatabaseInitialized, clearAllResultsExceptOne } from "@/lib/database"

export async function GET() {
  try {
    // Debug database state
    debugDatabaseState()
    
    // Force save database
    const saveResult = forceSaveDatabase()
    
    return NextResponse.json({
      success: true,
      message: "Database debug completed",
      saveResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database debug error:", error)
    return NextResponse.json(
      { error: "Failed to debug database" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'clear_results') {
      // Clear all results except one
      const clearResult = clearAllResultsExceptOne()
      
      return NextResponse.json({
        success: true,
        message: "Cleared all academic results except one",
        clearResult,
        timestamp: new Date().toISOString()
      })
    } else {
      // Default: Force save database
      const saveResult = forceSaveDatabase()
      
      return NextResponse.json({
        success: true,
        message: "Database force saved",
        saveResult,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    console.error("Database operation error:", error)
    return NextResponse.json(
      { error: "Failed to perform database operation" },
      { status: 500 }
    )
  }
} 