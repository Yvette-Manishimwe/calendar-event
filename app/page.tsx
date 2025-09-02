"use client"

import { CalendarProvider } from "@/components/calendar/calendar-provider"
import { CalendarLayout } from "@/components/calendar/calendar-layout"
import { AuthProvider } from "@/components/auth/auth-provider"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"

function AuthenticatedLayout() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push("/login") // redirect to login if not authenticated
    }
  }, [user])

  if (!user) return null // don't render until we know auth status

  return (
    <CalendarProvider>
      <CalendarLayout />
    </CalendarProvider>
  )
}

export default function HomePage() {
  return (
    <AuthProvider>
      <AuthenticatedLayout />
    </AuthProvider>
  )
}
