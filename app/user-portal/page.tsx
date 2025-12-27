"use client"

import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { CalendarProvider } from "@/components/calendar/calendar-provider"
import { CalendarLayout } from "@/components/calendar/calendar-layout"

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
        {/* Main calendar layout handles its own internal views */}
        <div className="flex-1">
          <CalendarLayout />
        </div>
      </div>
 
    </CalendarProvider>
  )
}
