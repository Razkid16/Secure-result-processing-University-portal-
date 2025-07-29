import { useEffect, useRef } from 'react'

export function useHeartbeat() {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Send heartbeat every 30 seconds
    const sendHeartbeat = async () => {
      try {
        await fetch('/api/auth/heartbeat', {
          method: 'POST',
          credentials: 'include',
        })
      } catch (error) {
        console.error('Heartbeat failed:', error)
      }
    }

    // Send initial heartbeat
    sendHeartbeat()

    // Set up interval for regular heartbeats
    intervalRef.current = setInterval(sendHeartbeat, 30000)

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Send heartbeat on user activity
  const sendActivityHeartbeat = async () => {
    try {
      await fetch('/api/auth/heartbeat', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Activity heartbeat failed:', error)
    }
  }

  return { sendActivityHeartbeat }
} 