"use client"

import { useCalendarContext } from "../calendar-provider"
import { DraggableEventCard } from "../draggable-event-card"
import { DropZone } from "../drop-zone"
import { format, isToday, setHours, setMinutes } from "date-fns"
import type { Event } from "@/lib/types"

export function DayView() {
  const { view, getEventsForDate, moveEvent } = useCalendarContext()
  const { currentDate } = view

  const dayEvents = getEventsForDate(currentDate)
  const isDayToday = isToday(currentDate)

  // Time slots for the day view (6 AM to 10 PM)
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 6)

  const handleEventDrop = (droppedEvent: Event, targetDate: Date, targetTime?: string) => {
    const originalDuration = droppedEvent.endTime.getTime() - droppedEvent.startTime.getTime()

    let newStartTime: Date
    if (targetTime) {
      const hour = Number.parseInt(targetTime)
      newStartTime = setHours(setMinutes(targetDate, 0), hour)
    } else {
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
      <div className="border-b border-border p-4 bg-card">
        <div className="flex items-center gap-3">
          <div
            className={`
              text-3xl font-bold
              ${
                isDayToday
                  ? "bg-primary text-primary-foreground rounded-full w-12 h-12 flex items-center justify-center"
                  : ""
              }
            `}
          >
            {format(currentDate, "d")}
          </div>
          <div>
            <div className="text-lg font-semibold">{format(currentDate, "EEEE")}</div>
            <div className="text-sm text-muted-foreground">{format(currentDate, "MMMM yyyy")}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-12 gap-4 p-4">
          {/* Time column */}
          <div className="col-span-2">
            {timeSlots.map((hour) => (
              <div key={hour} className="h-16 flex items-start justify-end pr-4 text-sm text-muted-foreground">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>

          {/* Events column */}
          <div className="col-span-10">
            {timeSlots.map((hour) => {
              const hourEvents = dayEvents.filter((event) => {
                const eventHour = event.startTime.getHours()
                return eventHour === hour
              })

              return (
                <DropZone
                  key={hour}
                  onDrop={handleEventDrop}
                  targetDate={currentDate}
                  targetTime={hour.toString()}
                  className="h-16 border-b border-border/50 hover:bg-muted/20 transition-colors rounded-md p-2 relative"
                >
                  <div className="space-y-1">
                    {hourEvents.map((event) => (
                      <DraggableEventCard key={event.id} event={event} variant="detailed" />
                    ))}
                  </div>
                </DropZone>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
