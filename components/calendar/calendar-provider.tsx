"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useCalendar } from "@/hooks/use-calendar"

type CalendarContextType = ReturnType<typeof useCalendar> & {
  updateEventDate: (updatedEvents: any[]) => void
}

const CalendarContext = createContext<CalendarContextType | null>(null)

export function CalendarProvider({ children }: { children: ReactNode }) {
  const calendar = useCalendar()

  // Add updateEventDate method
  const updateEventDate = (updatedEvents: typeof calendar.events) => {
    calendar.setEvents(updatedEvents)
    // TODO: Call backend API to persist event changes
    // fetch('/api/events', { method: 'PUT', body: JSON.stringify(updatedEvents) })
  }

  return (
    <CalendarContext.Provider value={{ ...calendar, updateEventDate }}>
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendarContext() {
  const context = useContext(CalendarContext)
  if (!context) {
    throw new Error("useCalendarContext must be used within CalendarProvider")
  }
  return context
}
