"use client"

import type React from "react"

import { memo } from "react"
import { format } from "date-fns"
import type { Event } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Clock, MapPin, GripVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface OptimizedEventCardProps {
  event: Event
  variant?: "compact" | "timeline" | "detailed"
  onEdit?: (event: Event) => void
  onDelete?: (eventId: string) => void
  onDragStart?: (event: Event) => void
  onDragEnd?: (event: Event) => void
}

export const OptimizedEventCard = memo<OptimizedEventCardProps>(
  ({ event, variant = "compact", onEdit, onDelete, onDragStart, onDragEnd }) => {
    const { title, startTime, endTime, location, category } = event

    const handleDragStart = (e: React.DragEvent) => {
      e.dataTransfer.setData("application/json", JSON.stringify(event))
      e.dataTransfer.effectAllowed = "move"
      onDragStart?.(event)
    }

    const handleDragEnd = (e: React.DragEvent) => {
      onDragEnd?.(event)
    }

    const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation()
      onEdit?.(event)
    }

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete?.(event.id)
    }

    const EventActions = () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="sr-only">Event actions</span>
            <div className="w-1 h-1 bg-current rounded-full" />
            <div className="w-1 h-1 bg-current rounded-full" />
            <div className="w-1 h-1 bg-current rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )

    if (variant === "compact") {
      return (
        <div
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`
            ${category.color} text-white text-xs p-1 rounded truncate
            hover:shadow-md transition-all cursor-move group
          `}
        >
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{title}</div>
              <div className="opacity-90">{format(startTime, "h:mm a")}</div>
            </div>
            <EventActions />
          </div>
        </div>
      )
    }

    if (variant === "timeline") {
      return (
        <Card
          draggable
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className="p-2 hover:shadow-md transition-all cursor-move group"
        >
          <div className="flex items-start gap-2">
            <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity mt-0.5" />
            <div className="flex-1">
              <div className={`w-2 h-2 rounded-full ${category.color} mb-1`} />
              <div className="text-xs font-medium truncate">{title}</div>
              <div className="text-xs text-muted-foreground">{format(startTime, "h:mm a")}</div>
            </div>
            <EventActions />
          </div>
        </Card>
      )
    }

    // Detailed variant
    return (
      <Card
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="p-3 hover:shadow-md transition-all cursor-move group"
      >
        <div className="flex items-start gap-3">
          <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity mt-1" />
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
          <EventActions />
        </div>
      </Card>
    )
  },
)

OptimizedEventCard.displayName = "OptimizedEventCard"
