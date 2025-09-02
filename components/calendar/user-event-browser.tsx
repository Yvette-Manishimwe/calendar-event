"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, MapPin, Users, Search, Ticket, CheckCircle } from "lucide-react"
import { format, isAfter } from "date-fns"

export function UserEventBrowser() {
  const { events, bookings, bookEvent } = useCalendarContext()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const userBookings = useMemo(() => {
    if (!user) return []
    return bookings.filter((booking) => booking.userId === user.id)
  }, [bookings, user])

  const availableEvents = useMemo(() => {
    return events.filter((event) => isAfter(new Date(event.startTime), new Date()))
  }, [events])

  // Extract unique categories as objects
  const categories = useMemo(() => {
    const unique: Record<string, typeof events[0]["category"]> = {}
    events.forEach((event) => {
      if (event.category?.id) unique[event.category.id] = event.category
    })
    return Object.values(unique)
  }, [events])

  const filteredEvents = useMemo(() => {
    return availableEvents.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || (event.category && event.category.id === categoryFilter)

      return matchesSearch && matchesCategory
    })
  }, [availableEvents, searchTerm, categoryFilter])

  const isEventBooked = (eventId: string) => userBookings.some((booking) => booking.eventId === eventId)
  const getEventBookingCount = (eventId: string) => bookings.filter((booking) => booking.eventId === eventId).length

  const handleBookEvent = (eventId: string) => {
    if (!user || isEventBooked(eventId)) return

    bookEvent({
      id: `booking-${Date.now()}`,
      eventId,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      bookedAt: new Date().toISOString(),
      status: "confirmed",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Browse Events</h1>
          <p className="text-muted-foreground">Discover and book exciting events</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Calendar className="w-3 h-3" />
          {filteredEvents.length} Available Events
        </Badge>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground text-center">Try adjusting your search or filter criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEvents.map((event) => {
            const isBooked = isEventBooked(event.id)
            const bookingCount = getEventBookingCount(event.id)
            const isFull = event.capacity && bookingCount >= event.capacity

            return (
              <Card key={event.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                      {event.description && (
                        <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                      )}
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.startTime), "MMM dd, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {format(new Date(event.startTime), "h:mm a")} -{" "}
                          {format(new Date(event.endTime), "h:mm a")}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        )}
                      </CardDescription>
                    </div>

                    {event.category && (
                      <Badge
                        variant="secondary"
                        className="capitalize"
                        style={{ backgroundColor: event.category.color }}
                      >
                        {event.category.name}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {bookingCount}
                        {event.capacity ? ` / ${event.capacity}` : ""} attendees
                      </span>
                      {isFull && (
                        <Badge variant="destructive" className="text-xs">
                          Full
                        </Badge>
                      )}
                    </div>

                    {isBooked ? (
                      <Button disabled className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Booked
                      </Button>
                    ) : isFull ? (
                      <Button disabled variant="outline">
                        Event Full
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleBookEvent(event.id)}
                        className="gap-2 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800"
                      >
                        <Ticket className="w-4 h-4" />
                        Book Event
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
