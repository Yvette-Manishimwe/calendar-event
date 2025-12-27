"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { Calendar, Clock, MapPin, Users, Search, Bell, CheckCircle, XCircle } from "lucide-react"
import { format, isAfter, isBefore } from "date-fns"

export function UserBookingDashboard() {
  const { events, bookings, cancelBooking } = useCalendarContext()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortKey, setSortKey] = useState<"date" | "title">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc")

  // Filter bookings for current user
  const userBookings = useMemo(() => {
    if (!user) return []
    return bookings.filter((booking) => booking.userId === user.id)
  }, [bookings, user])

  // Attach event info to bookings
  const bookedEvents = useMemo(() => {
    return userBookings
      .map((booking) => {
        const event = events.find((e) => e.id === booking.eventId)
        return event ? { ...booking, event } : null
      })
      .filter(Boolean) as typeof userBookings & { event: typeof events[0] }[]
  }, [userBookings, events])

  // Upcoming & past bookings
  const upcomingBookings = bookedEvents.filter(
    (item) => isAfter(new Date(item.event.startTime), new Date())
  )
  const pastBookings = bookedEvents.filter(
    (item) => isBefore(new Date(item.event.endTime), new Date())
  )

  // Apply search filter
  const filteredUpcoming = upcomingBookings.filter(
    (item) =>
      item.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredPast = pastBookings.filter(
    (item) =>
      item.event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.event.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const sortFn = (a: any, b: any) => {
    if (sortKey === "date") {
      const av = new Date(a.event.startTime).getTime()
      const bv = new Date(b.event.startTime).getTime()
      return sortDir === "asc" ? av - bv : bv - av
    }
    const av = a.event.title.localeCompare(b.event.title)
    return sortDir === "asc" ? av : -av
  }

  const sortedUpcoming = [...filteredUpcoming].sort(sortFn)
  const sortedPast = [...filteredPast].sort(sortFn)

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
            <Calendar className="w-3 h-3" />
            {upcomingBookings.length} Upcoming
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="w-3 h-3" />
            {pastBookings.length} Attended
          </Badge>
        </div>
      </div>

      {/* Search + Sort */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search your bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setSortKey(sortKey === "date" ? "title" : "date")}>{sortKey === "date" ? "Sort: Date" : "Sort: Title"}</Button>
          <Button variant="outline" size="sm" onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}>{sortDir === "asc" ? "Asc" : "Desc"}</Button>
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
          {sortedUpcoming.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No upcoming bookings</h3>
                <p className="text-muted-foreground text-center">
                  Browse the calendar to discover and book exciting events!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sortedUpcoming.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
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
                      {item.event.category && (
                        <Badge
                          variant="secondary"
                          style={{ backgroundColor: item.event.category.color }}
                        >
                          {item.event.category.name}
                        </Badge>
                      )}
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
          {sortedPast.length === 0 ? (
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
              {sortedPast.map((item) => (
                <Card key={item.id} className="opacity-75">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{item.event.title}</CardTitle>
                        <CardDescription className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
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
                      {item.event.category && (
                        <Badge
                          variant="outline"
                          style={{ borderColor: item.event.category.color }}
                        >
                          {item.event.category.name}
                        </Badge>
                      )}
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
