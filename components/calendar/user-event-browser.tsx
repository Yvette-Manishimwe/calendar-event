"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCalendarContext } from "./calendar-provider"
import { EVENT_CATEGORY_COLORS } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, MapPin, Users, Search, Ticket, CheckCircle } from "lucide-react"
import { format, isAfter } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function UserEventBrowser() {
  const { events, bookings, createBooking, isEventBookedByUser } = useCalendarContext()
  const { user } = useAuth()
  const { toast } = useToast()
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
    return [
      { id: "MEETING", name: "Meeting" },
      { id: "PERSONAL", name: "Personal" },
      { id: "WORK", name: "Work" },
      { id: "SOCIAL", name: "Social" },
      { id: "EDUCATION", name: "Education" },
      { id: "HEALTH", name: "Health" },
      { id: "TRAVEL", name: "Travel" },
      { id: "OTHER", name: "Other" },
    ]
  }, [])

  const filteredEvents = useMemo(() => {
    return availableEvents.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        categoryFilter === "all" || (event.category && event.category === categoryFilter)

      return matchesSearch && matchesCategory
    })
  }, [availableEvents, searchTerm, categoryFilter])

  const isEventBooked = (eventId: string) => (user ? isEventBookedByUser(eventId, user.id) : false)
  const getEventBookingCount = (eventId: string) => bookings.filter((booking) => booking.eventId === eventId).length

  const handleBookEvent = async (eventId: string) => {
    if (!user || isEventBooked(eventId)) return
    try {
      await createBooking(eventId)
      toast({ title: "Booking successful", description: "Your booking has been created." })
    } catch (e) {
      // ignore UI error for now
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" })
    }
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

                    <Badge
                      variant="secondary"
                      className="capitalize"
                      style={{ backgroundColor: EVENT_CATEGORY_COLORS[event.category] }}
                    >
                      {event.category}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {bookingCount} attendees
                      </span>
                    </div>

                    {isBooked ? (
                      <Button disabled className="gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Booked
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
