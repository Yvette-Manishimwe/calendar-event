"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { useCalendarContext } from "./calendar-provider"
import { CalendarGridSkeleton } from "./loading-states"

const MonthView = dynamic(() => import("./views/month-view").then((m) => m.MonthView), {
  loading: () => <CalendarGridSkeleton />,
  ssr: false,
})

const WeekView = dynamic(() => import("./views/week-view").then((m) => m.WeekView), {
  loading: () => <CalendarGridSkeleton />,
  ssr: false,
})

const DayView = dynamic(() => import("./views/day-view").then((m) => m.DayView), {
  loading: () => <CalendarGridSkeleton />,
  ssr: false,
})

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
