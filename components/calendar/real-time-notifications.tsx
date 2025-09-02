"use client"

import { useState, useEffect } from "react"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Bell, X, Users, Calendar } from "lucide-react"
import { format } from "date-fns"

interface Notification {
  id: string
  type: "booking" | "cancellation" | "event_update"
  message: string
  eventId: string
  userId: string
  timestamp: Date
  read: boolean
}

export function RealTimeNotifications() {
  const { bookings, events } = useCalendarContext()
  const { user, users } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  useEffect(() => {
    if (user?.role !== "admin") return

    const lastBookingCount = localStorage.getItem("lastBookingCount")
    const currentBookingCount = bookings.length

    if (lastBookingCount && Number.parseInt(lastBookingCount) < currentBookingCount) {
      // New booking detected
      const latestBooking = bookings[bookings.length - 1]
      const event = events.find((e) => e.id === latestBooking.eventId)
      const bookedUser = users.find((u) => u.id === latestBooking.userId)

      if (event && bookedUser) {
        const notification: Notification = {
          id: crypto.randomUUID(),
          type: "booking",
          message: `${bookedUser.name} booked "${event.title}"`,
          eventId: event.id,
          userId: bookedUser.id,
          timestamp: new Date(),
          read: false,
        }

        setNotifications((prev) => [notification, ...prev])
        setShowNotifications(true)
      }
    }

    localStorage.setItem("lastBookingCount", currentBookingCount.toString())
  }, [bookings, events, users, user])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  if (user?.role !== "admin") return null

  return (
    <div className="fixed top-4 right-4 z-50">
      <Button variant="outline" size="sm" onClick={() => setShowNotifications(!showNotifications)} className="relative">
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs px-1 min-w-5 h-5">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <Card className="absolute top-12 right-0 w-80 max-h-96 overflow-auto">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNotifications(false)} className="h-6 w-6 p-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded border ${
                      notification.read ? "bg-muted/50" : "bg-primary/5 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.type === "booking" && <Users className="w-3 h-3 text-primary" />}
                        {notification.type === "event_update" && <Calendar className="w-3 h-3 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(notification.timestamp, "MMM dd, HH:mm")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissNotification(notification.id)}
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs mt-1 h-6"
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
