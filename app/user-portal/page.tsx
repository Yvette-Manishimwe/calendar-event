"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { CalendarProvider } from "@/components/calendar/calendar-provider"
import { CalendarLayout } from "@/components/calendar/calendar-layout"
import { UserDashboard } from "@/components/calendar/user-dashboard"
import { UserEventBrowser } from "@/components/calendar/user-event-browser"
import { UserNotifications } from "@/components/calendar/user-notifications"

export default function UserPortal() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading])

  if (loading || !user) return null

  return (
    <CalendarProvider>
      <div className="flex flex-col space-y-4 p-4">
        {/* Notifications at top */}
        <UserNotifications />


          {/* Center: actual calendar */}
          <div className="flex-1">
            <CalendarLayout />
          </div>

          {/* Right sidebar: event browser */}
          <div className="w-1/4">
            <UserEventBrowser />
          </div>
        </div>
 
    </CalendarProvider>
  )
}
