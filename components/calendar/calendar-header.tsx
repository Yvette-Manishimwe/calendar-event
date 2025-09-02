"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, Users, Settings } from "lucide-react"
import { useCalendarContext } from "./calendar-provider"
import { EventBookingDialog } from "./event-booking-dialog"
import { AdminBookingsDialog } from "./admin-bookings-dialog"
import { useAuth } from "@/hooks/use-auth"
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from "date-fns"

export function CalendarHeader() {
  const { view, setView } = useCalendarContext()
  const { user } = useAuth()
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showBookingsDialog, setShowBookingsDialog] = useState(false)

  const navigateDate = (direction: "prev" | "next") => {
    const { type, currentDate } = view
    let newDate: Date

    if (direction === "prev") {
      newDate =
        type === "month"
          ? subMonths(currentDate, 1)
          : type === "week"
            ? subWeeks(currentDate, 1)
            : subDays(currentDate, 1)
    } else {
      newDate =
        type === "month"
          ? addMonths(currentDate, 1)
          : type === "week"
            ? addWeeks(currentDate, 1)
            : addDays(currentDate, 1)
    }

    setView({ ...view, currentDate: newDate })
  }

  const getDateTitle = () => {
    const { type, currentDate } = view

    if (type === "month") {
      return format(currentDate, "MMMM yyyy")
    } else if (type === "week") {
      return format(currentDate, "MMM dd, yyyy")
    } else {
      return format(currentDate, "EEEE, MMM dd, yyyy")
    }
  }

  return (
    <>
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate("prev")} className="h-8 w-8 p-0">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate("next")} className="h-8 w-8 p-0">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <h1 className="text-xl font-semibold text-foreground">{getDateTitle()}</h1>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ ...view, currentDate: new Date() })}
              className="text-sm"
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {(["month", "week", "day"] as const).map((viewType) => (
              <Button
                key={viewType}
                variant={view.type === viewType ? "default" : "ghost"}
                size="sm"
                onClick={() => setView({ ...view, type: viewType })}
                className="h-8 px-3 text-sm capitalize"
              >
                {viewType}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {user?.role === "admin" && (
              <>
                <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setShowBookingsDialog(true)}>
                  <Users className="h-4 w-4" />
                  View Bookings
                </Button>
                <Button className="gap-2" onClick={() => setShowBookingDialog(true)}>
                  <Plus className="h-4 w-4" />
                  Create Event
                </Button>
              </>
            )}

            {user?.role === "user" && (
              <Button
                variant="outline"
                className="gap-2 bg-transparent"
                onClick={() => setView({ ...view, showUserDashboard: true })}
              >
                <Settings className="h-4 w-4" />
                My Bookings
              </Button>
            )}
          </div>
        </div>
      </header>

      {user?.role === "admin" && (
        <EventBookingDialog
          open={showBookingDialog}
          onOpenChange={setShowBookingDialog}
          preselectedDate={view.currentDate}
        />
      )}

      {user?.role === "admin" && <AdminBookingsDialog open={showBookingsDialog} onOpenChange={setShowBookingsDialog} />}
    </>
  )
}
