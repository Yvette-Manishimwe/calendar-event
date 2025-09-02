"use client"

import { Event } from "@/lib/types"

export function SortableEventCard({ event }: { event: Event }) {
  return (
    <div className="bg-white p-2 rounded shadow border">
      <h3 className="font-semibold">{event.title}</h3>
      <p className="text-sm text-gray-600">{event.location}</p>
      {/* Format dates as string */}
      <p className="text-xs text-gray-500">
        {new Date(event.startTime).toLocaleString()} - {new Date(event.endTime).toLocaleString()}
      </p>
    </div>
  )
}
