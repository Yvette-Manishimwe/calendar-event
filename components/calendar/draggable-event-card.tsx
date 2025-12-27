"use client"

import type React from "react"

import { useState } from "react"
import { format } from "date-fns"
import { EVENT_CATEGORY_COLORS, type Event } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, GripVertical, Edit, Trash2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EventBookingDialog } from "./event-booking-dialog"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { BookingsApi } from "@/lib/api"

interface DraggableEventCardProps {
  event: Event
  variant?: "compact" | "timeline" | "detailed"
  onDragStart?: (event: Event) => void
  onDragEnd?: (event: Event, targetDate?: Date, targetTime?: string) => void
}

export function DraggableEventCard({ event, variant = "compact", onDragStart, onDragEnd }: DraggableEventCardProps) {
  const { title, startTime, endTime, location, category } = event
  const { deleteEvent, getEventBookings, isEventBookedByUser, createBooking } = useCalendarContext()
 
  const [isDragging, setIsDragging] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const { user } = useAuth()   // get the current user
  const eventBookings = getEventBookings(event.id)
  const isBooked = user ? isEventBookedByUser(event.id, user.id) : false
  const availableSpots = typeof event.capacity === "number" ? Math.max(event.capacity - eventBookings.length, 0) : Infinity
  const isAdmin = user?.role === "admin"



  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin) {
      e.preventDefault()
      return
    }

    setIsDragging(true)
    e.dataTransfer.setData("application/json", JSON.stringify(event))
    e.dataTransfer.effectAllowed = "move"

    // Create a custom drag image
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement
    dragImage.style.transform = "rotate(5deg)"
    dragImage.style.opacity = "0.8"
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 0, 0)
    setTimeout(() => document.body.removeChild(dragImage), 0)

    onDragStart?.(event)
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd?.(event)
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditDialog(true)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Are you sure you want to delete this event?")) {
      deleteEvent(event.id)
    }
  }

  const handleBookEvent = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) return
  
    try {
      await createBooking(event.id)
    } catch (err) {
      console.error("Booking failed:", err)
    }
  }

  const AdminActions = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

  const UserActions = () => (
    
    <Button
      variant={isBooked ? "secondary" : "default"}
      size="sm"
      onClick={handleBookEvent}
      disabled={isBooked || availableSpots <= 0}
      className="opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {isBooked ? "Booked" : availableSpots <= 0 ? "Full" : "Book"}
    </Button>
  )

  if (variant === "compact") {
    return (
      <>
<div
  draggable={isAdmin}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
  className={`
    text-white text-xs p-1 rounded truncate
    hover:shadow-md transition-all group
    ${isAdmin ? "cursor-move" : "cursor-pointer"}
    ${isDragging ? "opacity-50 scale-95" : ""}
  `}
  style={{ backgroundColor: EVENT_CATEGORY_COLORS[category] }}
>
  


          <div className="flex items-center gap-1">
            {isAdmin && <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-70 transition-opacity" />}
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{title}</div>
              <div className="opacity-90 flex items-center gap-1">
                <span>{format(startTime, "h:mm a")}</span>
                {event.capacity && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    {eventBookings.length}/{event.capacity}
                  </Badge>
                )}
              </div>
            </div>
            {isAdmin ? <AdminActions /> : <UserActions />}
          </div>
        </div>

        {isAdmin && <EventBookingDialog open={showEditDialog} onOpenChange={setShowEditDialog} editingEvent={event} />}
      </>
    )
  }

  if (variant === "timeline") {
    return (
      <>
        <Card
          draggable={isAdmin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`
            p-2 hover:shadow-md transition-all group
            ${isAdmin ? "cursor-move" : "cursor-pointer"}
            ${isDragging ? "opacity-50 scale-95" : ""}
          `}
        >
          <div className="flex items-start gap-2">
            {isAdmin && (
              <GripVertical className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity mt-0.5" />
            )}
            <div className="flex-1">
              <div className={`w-2 h-2 rounded-full ${category.color} mb-1`} />
              <div className="text-xs font-medium truncate">{title}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span>{format(startTime, "h:mm a")}</span>
                {event.capacity && (
                  <Badge variant="outline" className="text-xs">
                    <Users className="w-2 h-2 mr-1" />
                    {eventBookings.length}/{event.capacity}
                  </Badge>
                )}
              </div>
            </div>
            {isAdmin ? <AdminActions /> : <UserActions />}
          </div>
        </Card>

        {isAdmin && <EventBookingDialog open={showEditDialog} onOpenChange={setShowEditDialog} editingEvent={event} />}
      </>
    )
  }

  // Detailed variant
  return (
    <>
      <Card
        draggable={isAdmin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className={`
          p-3 hover:shadow-md transition-all group
          ${isAdmin ? "cursor-move" : "cursor-pointer"}
          ${isDragging ? "opacity-50 scale-95" : ""}
        `}
      >
        <div className="flex items-start gap-3">
          {isAdmin && (
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-70 transition-opacity mt-1" />
          )}
          <div className={`w-3 h-3 rounded-full ${category.color} mt-1 flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium text-sm truncate">{title}</div>
              {event.capacity && (
                <Badge variant="outline" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {eventBookings.length}/{event.capacity}
                </Badge>
              )}
              {event.price && (
                <Badge variant="secondary" className="text-xs">
                  ${event.price}
                </Badge>
              )}
            </div>
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
            {availableSpots <= 0 && (
              <Badge variant="destructive" className="text-xs mt-1">
                Event Full
              </Badge>
            )}
          </div>
          {isAdmin ? <AdminActions /> : <UserActions />}
        </div>
      </Card>

      {isAdmin && <EventBookingDialog open={showEditDialog} onOpenChange={setShowEditDialog} editingEvent={event} />}
    </>
  )
}
