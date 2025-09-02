"use client"

import { useState, useEffect } from "react"
import { Bell, X, Calendar, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"
import { format } from "date-fns"

interface UserNotification {
  id: string
  type: "event_rescheduled" | "event_full" | "event_cancelled"
  title: string
  message: string
  eventId: string
  timestamp: string
  read: boolean
}

export function UserNotifications() {
  const { events, bookings } = useCalendarContext()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<UserNotification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!user || user.role !== "user") return

    const userBookings = bookings.filter((booking) => booking.userId === user.id)
    const bookedEventIds = userBookings.map((booking) => booking.eventId)

    // Simulate real-time notifications for demo
    const checkForUpdates = () => {
      const newNotifications: UserNotification[] = []

      bookedEventIds.forEach((eventId) => {
        const event = events.find((e) => e.id === eventId)
        if (!event) return

        const eventBookings = bookings.filter((b) => b.eventId === eventId)
        const isEventFull = event.capacity && eventBookings.length >= event.capacity

        if (isEventFull) {
          newNotifications.push({
            id: `full-${eventId}-${Date.now()}`,
            type: "event_full",
            title: "Event is Now Full",
            message: `"${event.title}" has reached maximum capacity. Your booking is confirmed.`,
            eventId,
            timestamp: new Date().toISOString(),
            read: false,
          })
        }
      })

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev].slice(0, 10))
      }
    }

    const interval = setInterval(checkForUpdates, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [events, bookings, user])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
  }

  if (user?.role !== "user") return null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-transparent">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                No notifications yet
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border last:border-b-0 ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {notification.type === "event_full" && <Users className="w-4 h-4 text-orange-500" />}
                          {notification.type === "event_rescheduled" && <Calendar className="w-4 h-4 text-blue-500" />}
                          <p className="text-sm font-medium truncate">{notification.title}</p>
                          {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.timestamp), "MMM dd, h:mm a")}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeNotification(notification.id)}
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
                        className="text-xs mt-2 h-6"
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
      </PopoverContent>
    </Popover>
  )
}
