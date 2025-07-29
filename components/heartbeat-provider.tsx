"use client"

import { useHeartbeat } from "@/hooks/use-heartbeat"
import { useEffect } from "react"

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { sendActivityHeartbeat } = useHeartbeat()

  useEffect(() => {
    // Send heartbeat on user activity
    const handleUserActivity = () => {
      sendActivityHeartbeat()
    }

    // Listen for user activity events
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [sendActivityHeartbeat])

  return <>{children}</>
} 