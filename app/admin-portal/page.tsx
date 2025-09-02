"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { CalendarProvider } from "@/components/calendar/calendar-provider"
import { CalendarLayout } from "@/components/calendar/calendar-layout"
import { UserNotifications } from "@/components/calendar/user-notifications" // optional


export default function AdminPortal() {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) router.push("/login")
  }, [user, loading, isAdmin])

  if (loading || !user || !isAdmin) return null

  return (

      <div className="flex flex-col space-y-4 p-4">
        {/* Optional: admin notifications */}
        <UserNotifications />

          {/* Center: actual calendar */}
          <div className="flex-1">
            <CalendarLayout />
          </div>

          {/* Right sidebar: event management or stats */}
          <div className="w-1/4">
            {/* Placeholder: you can add admin event management here */}
            <div className="p-4 border rounded bg-white shadow-sm">
              <h3 className="font-bold mb-2">Manage Events</h3>
              <p className="text-sm text-muted-foreground">Create, edit, or cancel events here</p>
            </div>
          </div>
        </div>
  
  )
}
