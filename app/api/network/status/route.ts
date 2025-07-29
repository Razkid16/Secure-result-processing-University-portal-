import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const clientIP = request.ip || 
                    request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'Unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown'

    // Get current timestamp
    const timestamp = new Date().toISOString()

    // Get additional network information
    const networkInfo = {
      ip_address: clientIP,
      user_agent: userAgent,
      timestamp: timestamp,
      connection_type: 'Unknown', // Would need client-side detection
      browser: getBrowserInfo(userAgent),
      os: getOSInfo(userAgent),
      is_mobile: isMobile(userAgent),
      is_tablet: isTablet(userAgent),
      is_desktop: isDesktop(userAgent)
    }

    return NextResponse.json({
      success: true,
      data: networkInfo
    })
  } catch (error) {
    console.error('Network status API error:', error)
    return NextResponse.json({ 
      error: "Failed to get network information" 
    }, { status: 500 })
  }
}

function getBrowserInfo(userAgent: string): string {
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  if (userAgent.includes('Opera')) return 'Opera'
  return 'Unknown'
}

function getOSInfo(userAgent: string): string {
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS')) return 'iOS'
  return 'Unknown'
}

function isMobile(userAgent: string): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

function isTablet(userAgent: string): boolean {
  return /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)
}

function isDesktop(userAgent: string): boolean {
  return !isMobile(userAgent) && !isTablet(userAgent)
}
