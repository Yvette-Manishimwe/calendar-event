"use client"

import { format } from "date-fns"
import type { Event } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Clock, MapPin } from "lucide-react"

interface EventCardProps {
  event: Event
  variant?: "compact" | "timeline" | "detailed"
}

export function EventCard({ event, variant = "compact" }: EventCardProps) {
  const { title, startTime, endTime, location, category } = event

  if (variant === "compact") {
    return (
      <div
        className={`
          ${category.color} text-white text-xs p-1 rounded truncate
          hover:shadow-sm transition-shadow cursor-pointer
        `}
      >
        <div className="font-medium truncate">{title}</div>
        <div className="opacity-90">{format(startTime, "h:mm a")}</div>
      </div>
    )
  }

  if (variant === "timeline") {
    return (
      <Card className="p-2 hover:shadow-md transition-shadow cursor-pointer">
        <div className={`w-2 h-2 rounded-full ${category.color} mb-1`} />
        <div className="text-xs font-medium truncate">{title}</div>
        <div className="text-xs text-muted-foreground">{format(startTime, "h:mm a")}</div>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start gap-3">
        <div className={`w-3 h-3 rounded-full ${category.color} mt-1 flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">{title}</div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
          </div>
          {location && (
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
