"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, MapPin, Users, Search, Ticket, CheckCircle } from "lucide-react"
import { format, isAfter, isWithinInterval } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function UserEventBrowser() {
  const { events, bookings, createBooking } = useCalendarContext()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState<string>("")
  const [dateTo, setDateTo] = useState<string>("")
  const [detailsEventId, setDetailsEventId] = useState<string | null>(null)
  const [bookingLoadingId, setBookingLoadingId] = useState<string | null>(null)
  const { toast } = useToast()

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

      const matchesDate = (() => {
        if (!dateFrom && !dateTo) return true
        const start = new Date(event.startTime)
        const from = dateFrom ? new Date(dateFrom) : undefined
        const to = dateTo ? new Date(dateTo) : undefined
        if (from && to) return isWithinInterval(start, { start: from, end: to })
        if (from) return start >= from
        if (to) return start <= to
        return true
      })()

      return matchesSearch && matchesCategory && matchesDate
    })
  }, [availableEvents, searchTerm, categoryFilter, dateFrom, dateTo])

  const isEventBooked = (eventId: string) => userBookings.some((booking) => booking.eventId === eventId)
  const getEventBookingCount = (eventId: string) => bookings.filter((booking) => booking.eventId === eventId).length

  const handleBookEvent = async (eventId: string) => {
    if (!user || isEventBooked(eventId)) return
    try {
      setBookingLoadingId(eventId)
      // Optimistic UX: show toast immediately, backend will update context and admin notifications
      const t = toast({ title: "Booking...", description: "Reserving your spot." })
      await createBooking(eventId)
      t.update({ title: "Booked", description: "Your booking is confirmed.", open: true })
    } catch (e) {
      console.error("Booking failed", e)
      toast({ title: "Booking failed", description: "Please try again.", variant: "destructive" as any })
    }
    setBookingLoadingId(null)
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

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-40"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-40"
          placeholder="To"
        />
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
              <Card key={event.id} className="hover:shadow-md transition-shadow" onClick={() => setDetailsEventId(event.id)}>
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
                        disabled={bookingLoadingId === event.id}
                      >
                        <Ticket className="w-4 h-4" />
                        {bookingLoadingId === event.id ? "Booking..." : "Book Event"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={!!detailsEventId} onOpenChange={(open) => !open && setDetailsEventId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {(() => {
            const ev = filteredEvents.find(e => e.id === detailsEventId)
            if (!ev) return null
            return (
              <div className="space-y-2">
                <div className="text-lg font-semibold">{ev.title}</div>
                {ev.description && <div className="text-sm text-muted-foreground">{ev.description}</div>}
                <div className="text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(ev.startTime), "MMM dd, yyyy")} • {format(new Date(ev.startTime), "h:mm a")} - {format(new Date(ev.endTime), "h:mm a")}
                </div>
                {ev.location && (
                  <div className="text-sm flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> {ev.location}
                  </div>
                )}
                <div className="text-sm">
                  <Users className="inline w-4 h-4 mr-1" />
                  {getEventBookingCount(ev.id)}{ev.capacity ? ` / ${ev.capacity}` : ""} attending
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
