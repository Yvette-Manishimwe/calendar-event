"use client"

import { useCalendarContext } from "../calendar-provider"
import { DraggableEventCard } from "../draggable-event-card"
import { DropZone } from "../drop-zone"
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isToday, setHours, setMinutes } from "date-fns"
import type { Event } from "@/lib/types"

export function WeekView() {
  const { view, getEventsForDate, moveEvent } = useCalendarContext()
  const { currentDate } = view

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Time slots for the week view (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6)

  const handleEventDrop = (droppedEvent: Event, targetDate: Date, targetTime?: string) => {
    const originalDuration = droppedEvent.endTime.getTime() - droppedEvent.startTime.getTime()

    let newStartTime: Date
    if (targetTime) {
      const hour = Number.parseInt(targetTime)
      newStartTime = setHours(setMinutes(targetDate, 0), hour)
    } else {
      // Keep original time if no specific time slot
      newStartTime = setHours(
        setMinutes(targetDate, droppedEvent.startTime.getMinutes()),
        droppedEvent.startTime.getHours(),
      )
    }

    const newEndTime = new Date(newStartTime.getTime() + originalDuration)
    moveEvent(droppedEvent.id, newStartTime, newEndTime)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-8 border-b border-border">
        <div className="p-3 border-r border-border"></div>
        {days.map((day) => {
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`
                p-3 text-center border-r border-border
                ${isDayToday ? "bg-primary/10" : ""}
              `}
            >
              <div className="text-sm font-medium text-muted-foreground">{format(day, "EEE")}</div>
              <div
                className={`
                  text-lg font-semibold mt-1
                  ${
                    isDayToday
                      ? "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                      : ""
                  }
                `}
              >
                {format(day, "d")}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-border">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-16 border-b border-border p-2 text-right text-sm text-muted-foreground">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => (
            <div key={day.toISOString()} className="border-r border-border">
              {timeSlots.map((hour) => {
                const dayEvents = getEventsForDate(day).filter((event) => {
                  const eventHour = event.startTime.getHours()
                  return eventHour === hour
                })

                return (
                  <DropZone
                    key={hour}
                    onDrop={handleEventDrop}
                    targetDate={day}
                    targetTime={hour.toString()}
                    className="h-16 border-b border-border p-1 hover:bg-muted/30 transition-colors relative"
                  >
                    {dayEvents.map((event) => (
                      <DraggableEventCard key={event.id} event={event} variant="timeline" />
                    ))}
                  </DropZone>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
