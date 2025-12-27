"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCalendar } from "@/hooks/use-calendar"
import type { EventCategory } from "@/lib/types" // adjust the import if needed

type CalendarContextType = ReturnType<typeof useCalendar> & {
  updateEventDate: (updatedEvents: any[]) => void
  categories: EventCategory[] // ensure categories exists
}

const CalendarContext = createContext<CalendarContextType | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const calendar = useCalendar()

  // Ensure categories exist even if useCalendar doesn't return them
  const categories = (calendar as any).categories || []

  const updateEventDate = (updatedEvents: typeof calendar.events) => {
    console.warn("updateEventDate is deprecated, use individual event operations")
  }

  return (
    <CalendarContext.Provider value={{ ...calendar, updateEventDate, categories }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (!context) throw new Error("useCalendarContext must be used within CalendarProvider")
  return context
}
