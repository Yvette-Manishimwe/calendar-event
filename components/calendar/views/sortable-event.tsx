"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { EventCard } from "../event-card"
import type { Event } from "@/lib/types"

interface SortableEventProps {
  event: Event
}

export function SortableEvent({ event }: SortableEventProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: event.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <EventCard event={event} />
    </div>
  )
}
