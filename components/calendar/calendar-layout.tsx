"use client"

import { useState } from "react"
import { CalendarHeader } from "./calendar-header"
import { CalendarGrid } from "./calendar-grid"
import { EventSidebar } from "./event-sidebar"
import { UserDashboard } from "./user-dashboard"
import { UserBookingDashboard } from "./user-booking-dashboard"
import { UserEventBrowser } from "./user-event-browser"
import { useCalendarContext } from "./calendar-provider"
import { Button } from "@/components/ui/button"
import { Calendar, BarChart3, Ticket, Search } from "lucide-react"
import { useAuthContext } from "@/components/auth/auth-provider"
import { LoginForm } from "@/components/auth/login-form"
import { UserSwitcher } from "@/components/auth/user-switcher"
import { RealTimeNotifications } from "./real-time-notifications"

export function CalendarLayout() {
  const { view } = useCalendarContext()
  const [mainView, setMainView] = useState<"calendar" | "dashboard" | "browse">("calendar")
  const { user, isAuthenticated } = useAuthContext()

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="flex h-screen bg-background">
      <EventSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b border-border bg-card px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={mainView === "calendar" ? "default" : "ghost"}
                size="sm"
                onClick={() => setMainView("calendar")}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Calendar
              </Button>

              {user?.role === "admin" ? (
                <Button
                  variant={mainView === "dashboard" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setMainView("dashboard")}
                  className="gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Admin Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    variant={mainView === "browse" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMainView("browse")}
                    className="gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Browse Events
                  </Button>
                  <Button
                    variant={mainView === "dashboard" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setMainView("dashboard")}
                    className="gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    My Bookings
                  </Button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {user?.role === "admin" && <RealTimeNotifications />}
              <UserSwitcher />
            </div>
          </div>
        </div>

        {mainView === "calendar" && (
          <>
            <CalendarHeader />
            <div className="flex-1 overflow-auto">
              <CalendarGrid />
            </div>
          </>
        )}

        {mainView === "dashboard" && (
          <div className="flex-1 overflow-auto p-6">
            {user?.role === "admin" ? <UserDashboard /> : <UserBookingDashboard />}
          </div>
        )}

        {mainView === "browse" && user?.role === "user" && (
          <div className="flex-1 overflow-auto p-6">
            <UserEventBrowser />
          </div>
        )}
      </div>
    </div>
  )
}
