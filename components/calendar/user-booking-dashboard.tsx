"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCalendarContext } from "./calendar-provider"
import type { Event, Booking } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"
import { Calendar as CalendarIcon, Clock, MapPin, Users, Search, Bell, CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import { format, isAfter, isBefore } from "date-fns"
import { EVENT_CATEGORY_COLORS } from "@/lib/types"
// mini calendar removed for now to keep types simple
import { Calendar as MiniCalendar } from "@/components/ui/calendar"

export function UserBookingDashboard() {
  const { events, bookings, cancelBooking, filters, setFilters, refresh } = useCalendarContext()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")

  // Bookings: endpoint `/bookings/me` is already scoped to current user
  const userBookings = useMemo(() => {
    if (!user) return []
    return bookings
  }, [bookings, user])

  // Attach event info to bookings, skip those without event
  const bookedEvents = useMemo<((Booking & { event: Event })[])>(() => {
    return userBookings
      .map((booking) => {
        const inlineEvent = (booking as any).event as (Event | undefined)
        const eventFromInline = inlineEvent
          ? ({
              ...inlineEvent,
              startTime: new Date((inlineEvent as any).startTime),
              endTime: new Date((inlineEvent as any).endTime),
              createdAt: new Date((inlineEvent as any).createdAt || Date.now()),
              updatedAt: new Date((inlineEvent as any).updatedAt || Date.now()),
            } as Event)
          : undefined
        const event = eventFromInline || events.find((e) => e.id === booking.eventId)
        return event ? ({ ...(booking as Booking), event } as Booking & { event: Event }) : null
      })
      .filter((x): x is Booking & { event: Event } => Boolean(x))
  }, [userBookings, events])

  // Upcoming & past bookings
  const upcomingBookings = bookedEvents.filter(
    (item) => item.event && isAfter(new Date(item.event.startTime), new Date())
  )
  const pastBookings = bookedEvents.filter(
    (item) => item.event && isBefore(new Date(item.event.endTime), new Date())
  )

  // Apply search filter
  let filteredUpcoming = upcomingBookings.filter(
    (item) =>
      item.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  let filteredPast = pastBookings.filter(
    (item) =>
      item.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Optional: filter by selected day range if provided
  if (filters.from) {
    filteredUpcoming = filteredUpcoming.filter((b) => new Date(b.event.startTime) >= filters.from!)
    filteredPast = filteredPast.filter((b) => new Date(b.event.endTime) >= filters.from!)
  }
  if (filters.to) {
    filteredUpcoming = filteredUpcoming.filter((b) => new Date(b.event.startTime) <= filters.to!)
    filteredPast = filteredPast.filter((b) => new Date(b.event.endTime) <= filters.to!)
  }

  // Sorting
  const sortFn = (a: Booking & { event: Event }, b: Booking & { event: Event }) => {
    if (sortBy === "title") return a.event.title.localeCompare(b.event.title)
    return new Date(a.event.startTime).getTime() - new Date(b.event.startTime).getTime()
  }
  filteredUpcoming = [...filteredUpcoming].sort(sortFn)
  filteredPast = [...filteredPast].sort(sortFn)

  const handleCancelBooking = (bookingId: string) => {
    cancelBooking(bookingId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Bookings</h1>
          <p className="text-muted-foreground">Manage your event bookings and view your schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <CalendarIcon className="w-3 h-3" />
            {upcomingBookings.length} Upcoming
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            {pastBookings.length} Attended
          </Badge>
        </div>
      </div>

      {/* Search + Sort + Mini Calendar */}
      <div className="relative grid gap-3 md:grid-cols-3">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search your bookings..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 md:col-span-1"
        />

        <div className="flex items-center gap-2 md:justify-end">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setSortBy(sortBy === "date" ? "title" : "date")}>
            <ArrowUpDown className="w-4 h-4" />
            Sort by {sortBy === "date" ? "Title" : "Date"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refresh()}>Refresh</Button>
        </div>

        <div className="md:col-span-1">
          <MiniCalendar
            mode="range"
            selected={{ from: filters.from, to: filters.to } as any}
            onSelect={(range: any) => {
              setFilters({ from: range?.from, to: range?.to })
            }}
            numberOfMonths={1}
            showOutsideDays
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Bell className="w-4 h-4" />
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <CheckCircle className="w-4 h-4" />
            Past Events ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming Bookings */}
        <TabsContent value="upcoming" className="space-y-4">
          {filteredUpcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                <p className="text-muted-foreground text-center">
                  Browse the calendar to discover and book exciting events!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredUpcoming.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(new Date(item.event.startTime), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(item.event.startTime), "h:mm a")}
                          </span>
                          {item.event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.event.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="secondary"
                        className="capitalize"
                        style={{ backgroundColor: EVENT_CATEGORY_COLORS[item.event.category as keyof typeof EVENT_CATEGORY_COLORS] }}
                      >
                        {item.event.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Booked on {format(new Date(item.bookedAt), "MMM dd, yyyy")}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Cancel Booking
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Past Bookings */}
        <TabsContent value="past" className="space-y-4">
          {filteredPast.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No past events</h3>
                <p className="text-muted-foreground text-center">
                  Your attended events will appear here after they're completed.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPast.map((item) => (
                <Card key={item.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(new Date(item.event.startTime), "MMM dd, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {format(new Date(item.event.startTime), "h:mm a")}
                          </span>
                          {item.event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.event.location}
                            </span>
                          )}
                        </CardDescription>
                      </div>
                      <Badge
                        variant="outline"
                        className="capitalize"
                        style={{ borderColor: EVENT_CATEGORY_COLORS[item.event.category as keyof typeof EVENT_CATEGORY_COLORS] }}
                      >
                        {item.event.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>Attended</span>
                      </div>
                      <Badge variant="secondary" className="text-green-700 bg-green-50">
                        Completed
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
