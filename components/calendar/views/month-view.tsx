"use client"

import { useCalendarContext } from "../calendar-provider"
import { DraggableEventCard } from "../draggable-event-card"
import { DropZone } from "../drop-zone"
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
} from "date-fns"
import type { Event } from "@/lib/types"

export function MonthView() {
  const { view, getEventsForDate, moveEvent } = useCalendarContext()
  const { currentDate } = view

  // Get all days to display in the month grid (including prev/next month days)
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const handleEventDrop = (droppedEvent: Event, targetDate: Date) => {
  const originalStart = new Date(droppedEvent.startTime)
  const originalEnd = new Date(droppedEvent.endTime)

  const duration = originalEnd.getTime() - originalStart.getTime()

  // Keep the same time but change the date
  const newStartTime = setHours(setMinutes(targetDate, originalStart.getMinutes()), originalStart.getHours())
  const newEndTime = new Date(newStartTime.getTime() + duration)

  moveEvent(droppedEvent.id, newStartTime, newEndTime)
}


  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 border-b border-border">
        {weekdays.map((day) => (
          <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground bg-muted/50">
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayEvents = getEventsForDate(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isDayToday = isToday(day)

          return (
            <DropZone
              key={day.toISOString()}
              onDrop={handleEventDrop}
              targetDate={day}
              className={`
                border-r border-b border-border p-2 min-h-[120px] overflow-hidden relative
                ${!isCurrentMonth ? "bg-muted/20 text-muted-foreground" : "bg-background"}
                hover:bg-muted/30 transition-colors
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`
                    text-sm font-medium
                    ${
                      isDayToday
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center"
                        : ""
                    }
                  `}
                >
                  {format(day, "d")}
                </span>
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <DraggableEventCard key={event.id} event={event} variant="compact" />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground px-2 py-1">+{dayEvents.length - 3} more</div>
                )}
              </div>
            </DropZone>
          )
        })}
      </div>
    </div>
  )
}
