"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { Search, Users, Calendar, MapPin, Clock, Mail } from "lucide-react"
import { format, isValid } from "date-fns"

interface AdminBookingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminBookingsDialog({ open, onOpenChange }: AdminBookingsDialogProps) {
  const { events: rawEvents, bookings: rawBookings } = useCalendarContext()
  const { users } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

  // Normalize events & bookings to ensure Date objects
  const events = useMemo(() => {
    return rawEvents.map((event) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      bookings: rawBookings
        .filter((b) => b.eventId === event.id)
        .map((b) => ({ ...b, bookedAt: new Date(b.bookedAt) })),
      bookedUsers: rawBookings
        .filter((b) => b.eventId === event.id)
        .map((b) => users.find((u) => u.id === b.userId))
        .filter(Boolean),
    }))
  }, [rawEvents, rawBookings, users])

  const filteredEvents = useMemo(() => {
    return events.filter(
      (event) =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
        event.bookedUsers.some(
          (user) =>
            user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user?.email.toLowerCase().includes(searchTerm.toLowerCase()),
        ),
    )
  }, [events, searchTerm])

  const totalBookings = rawBookings.length
  const totalRevenue = rawBookings.reduce((sum, booking) => {
    const event = rawEvents.find((e) => e.id === booking.eventId)
    return sum + (event?.price || 0)
  }, 0)

  // Safe formatting helper
  const safeFormat = (date: Date | string, fmt: string) => {
    const d = date instanceof Date ? date : new Date(date)
    return isValid(d) ? format(d, fmt) : "Invalid Date"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Event Bookings Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="events">Events & Bookings</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{events.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalBookings}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue}</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {rawBookings.slice(0, 5).map((booking) => {
                    const event = rawEvents.find((e) => e.id === booking.eventId)
                    const user = users.find((u) => u.id === booking.userId)
                    return (
                      <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-sm text-muted-foreground">{event?.title}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">${event?.price || 0}</p>
                          <p className="text-xs text-muted-foreground">
                            {safeFormat(booking.bookedAt, "MMM dd, HH:mm")}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events & Bookings */}
          <TabsContent value="events" className="space-y-4 overflow-auto">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events, locations, or attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {event.title}
                          <Badge variant={event.availableSpots > 0 ? "default" : "destructive"}>
                            {event.bookings.length}/{event.capacity}
                          </Badge>
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {safeFormat(event.startTime, "MMM dd, yyyy HH:mm")}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${event.price}</p>
                        <p className="text-sm text-muted-foreground">
                          Revenue: ${event.bookings.length * event.price}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  {event.bookedUsers.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Attendees ({event.bookedUsers.length})</h4>
                        <div className="grid gap-2">
                          {event.bookedUsers.map((user) => (
                            <div key={user?.id} className="flex items-center justify-between p-2 bg-muted rounded">
                              <div>
                                <p className="font-medium text-sm">{user?.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Mail className="w-3 h-3" />
                                  {user?.email}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {safeFormat(
                                  event.bookings.find((b) => b.userId === user?.id)?.bookedAt ?? "",
                                  "MMM dd",
                                )}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Users */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {users
                    .filter((user) => user.role === "user")
                    .map((user) => {
                      const userBookings = rawBookings.filter((b) => b.userId === user.id)
                      const totalSpent = userBookings.reduce((sum, booking) => {
                        const event = rawEvents.find((e) => e.id === booking.eventId)
                        return sum + (event?.price || 0)
                      }, 0)

                      return (
                        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{userBookings.length} bookings</p>
                            <p className="text-sm text-muted-foreground">Total: ${totalSpent}</p>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
