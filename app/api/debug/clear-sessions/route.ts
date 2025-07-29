import { NextRequest, NextResponse } from 'next/server'
import { clearAllSessions } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    console.log('Clearing all sessions...')
    const result = await clearAllSessions()
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'All sessions cleared successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.error 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error clearing sessions:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 