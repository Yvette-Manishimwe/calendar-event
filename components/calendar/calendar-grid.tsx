"use client"

import { Suspense } from "react"
import { useCalendarContext } from "./calendar-provider"
import { MonthView } from "./views/month-view"
import { WeekView } from "./views/week-view"
import { DayView } from "./views/day-view"
import { CalendarGridSkeleton } from "./loading-states"

export function CalendarGrid() {
  const { view, isLoading } = useCalendarContext()

  if (isLoading) {
    return <CalendarGridSkeleton />
  }

  return (
    <div className="h-full">
      <Suspense fallback={<CalendarGridSkeleton />}>
        {view.type === "month" && <MonthView />}
        {view.type === "week" && <WeekView />}
        {view.type === "day" && <DayView />}
      </Suspense>
    </div>
  )
}
