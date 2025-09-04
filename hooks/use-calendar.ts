"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Event, EventCategory, CalendarView, Booking } from "@/lib/types"
import { loadEventsFromStorage, saveEventsToStorage, loadBookingsFromStorage, saveBookingsToStorage } from "@/lib/event-store"
import { EventsApi, BookingsApi, createEventStream } from "@/lib/api"
import { useAuth } from "@/hooks/use-auth"

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  // Categories removed - using enum instead
  const [bookings, setBookings] = useState<Booking[]>([])
  const [view, setView] = useState<CalendarView>({ type: "month", currentDate: new Date() })
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState<{ from?: Date; to?: Date }>({})
  const [reloadKey, setReloadKey] = useState(0)
  const { user } = useAuth()

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load from backend
        const backendEvents = await EventsApi.list({
          from: filters.from ? filters.from.toISOString() : undefined,
          to: filters.to ? filters.to.toISOString() : undefined,
        })

        // Transform backend data to frontend format
        const transformedEvents = backendEvents.map((e: any) => ({
          id: e.id,
          title: e.title,
          description: e.description,
          startTime: new Date(e.startTime),
          endTime: new Date(e.endTime),
          category: e.category,
          location: e.location,
          isAllDay: e.isAllDay,
          color: e.color,
          isPublic: e.isPublic,
          requiresApproval: e.requiresApproval,
          capacity: e.capacity,
          createdBy: e.createdBy?.id || e.createdBy,
          createdAt: new Date(e.createdAt),
          updatedAt: new Date(e.updatedAt),
          bookings: e.bookings || [],
        }))

        setEvents(transformedEvents)

        // Load bookings: if admin, fetch per-event to get all; else fetch mine
        try {
          if (user?.role === "admin") {
            const allBookingsArrays = await Promise.all(
              transformedEvents.map((e) => BookingsApi.listByEvent(e.id).catch(() => []))
            )
            const flat = allBookingsArrays.flat()
            const normalized: Booking[] = flat.map((b: any) => ({
              id: b.id,
              eventId: b.eventId,
              userId: b.userId,
              userName: b.userName || b.user?.full_name || b.user?.name,
              userEmail: b.userEmail || b.user?.email,
              bookedAt: new Date(b.bookedAt || b.createdAt || Date.now()),
              status: (b.status || "confirmed") as Booking["status"],
            }))
            setBookings(normalized)
          } else {
            const mine = await BookingsApi.listMine().catch(() => [])
            const normalized: Booking[] = mine.map((b: any) => {
              const inlineEvent = b.event
                ? {
                    ...b.event,
                    startTime: new Date(b.event.startTime),
                    endTime: new Date(b.event.endTime),
                    createdAt: new Date(b.event.createdAt || Date.now()),
                    updatedAt: new Date(b.event.updatedAt || Date.now()),
                  }
                : undefined
              return {
                id: b.id,
                eventId: b.eventId || b.event?.id,
                userId: b.userId || b.user?.id,
                userName: b.userName || b.user?.full_name || b.user?.name,
                userEmail: b.userEmail || b.user?.email,
                bookedAt: new Date(b.bookedAt || b.createdAt || Date.now()),
                status: (b.status || "confirmed") as Booking["status"],
                ...(inlineEvent ? { event: inlineEvent } : {}),
              } as any
            })
            setBookings(normalized)
          }
        } catch {
          setBookings(loadBookingsFromStorage())
        }
      } catch (error) {
        console.error("Failed to load data from backend, falling back to local storage:", error)
        // Fallback to local storage
        const loadedEvents = loadEventsFromStorage().map((e) => {
          const start = new Date(e.startTime)
          const end = new Date(e.endTime)
          return {
            ...e,
            startTime: isNaN(start.getTime()) ? new Date() : start,
            endTime: isNaN(end.getTime()) ? new Date() : end,
            createdAt: new Date(e.createdAt),
            updatedAt: new Date(e.updatedAt),
          }
        })
        setEvents(loadedEvents)
        setBookings(loadBookingsFromStorage())
      }
      setIsLoading(false)
    }

    loadData()
    const id = setInterval(loadData, 10000)
    return () => clearInterval(id)
  }, [user, filters, reloadKey])

  // Save events safely
  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => {
        const storableEvents = events
          .map((e) => {
            if (!(e.startTime instanceof Date) || isNaN(e.startTime.getTime())) return null
            if (!(e.endTime instanceof Date) || isNaN(e.endTime.getTime())) return null
            return { ...e, startTime: e.startTime.toISOString(), endTime: e.endTime.toISOString() }
          })
          .filter(Boolean)
        saveEventsToStorage(storableEvents as any)
      }, 500)
      return () => clearTimeout(timeoutId)
    }
  }, [events, isLoading])

  // Categories effect removed - using enum instead

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => saveBookingsToStorage(bookings), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [bookings, isLoading])

  const addEvent = useCallback(
    async (newEvent: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
      try {
        const createdEvent = await EventsApi.create({
          title: newEvent.title,
          description: newEvent.description,
          startTime: newEvent.startTime.toISOString(),
          endTime: newEvent.endTime.toISOString(),
          category: newEvent.category,
          location: newEvent.location,
          isAllDay: newEvent.isAllDay,
          color: newEvent.color,
          isPublic: newEvent.isPublic,
          requiresApproval: newEvent.requiresApproval,
          capacity: newEvent.capacity,
        })
        
        const event: Event = {
          ...newEvent,
          id: createdEvent.id,
          createdAt: new Date(createdEvent.createdAt),
          updatedAt: new Date(createdEvent.updatedAt),
        }
        setEvents((prev) => [...prev, event])
        return event
      } catch (error) {
        console.error("Failed to create event:", error)
        // Fallback to local creation
        const event: Event = { ...newEvent, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() }
        setEvents((prev) => [...prev, event])
        return event
      }
    },
    []
  )

  const updateEvent = useCallback(
    async (id: string, updates: Partial<Event>) => {
      try {
        await EventsApi.update(id, {
          ...updates,
          startTime: updates.startTime?.toISOString(),
          endTime: updates.endTime?.toISOString(),
          category: updates.category,
        })
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)))
      } catch (error) {
        console.error("Failed to update event:", error)
        // Fallback to local update
        setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)))
      }
    },
    []
  )

  const deleteEvent = useCallback(
    async (id: string) => {
      try {
        await EventsApi.delete(id)
        setEvents((prev) => prev.filter((e) => e.id !== id))
      } catch (error) {
        console.error("Failed to delete event:", error)
        // Fallback to local deletion
        setEvents((prev) => prev.filter((e) => e.id !== id))
      }
    },
    []
  )

  const moveEvent = useCallback(
    async (eventId: string, newStartTime: Date, newEndTime: Date) => {
      if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) return
      try {
        await EventsApi.move(eventId, {
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        })
        updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime })
      } catch (error) {
        console.error("Failed to move event:", error)
        // Fallback to local move
        updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime })
      }
    },
    [updateEvent]
  )

  const getEventsForDate = useCallback(
    (date: Date) => events.filter((e) => e.startTime.toDateString() === date.toDateString()),
    [events]
  )

  const getEventBookings = (eventId: string) => {
    return bookings.filter(b => b.eventId === eventId)
  }

  const createBooking = useCallback(
    async (eventId: string) => {
      // Prevent double booking on frontend
      if (user && bookings.some((b) => b.eventId === eventId && b.userId === user.id && b.status !== "cancelled")) {
        throw new Error("You have already booked this event.")
      }

      // Capacity guard (best-effort, backend remains source of truth)
      const targetEvent = events.find((e) => e.id === eventId)
      if (
        targetEvent?.capacity &&
        targetEvent.capacity <= bookings.filter((b) => b.eventId === eventId && b.status === "confirmed").length
      ) {
        throw new Error("Event capacity reached")
      }

      // Optimistic insert
      const tempId = `temp-${crypto.randomUUID()}`
      const optimistic: Booking = {
        id: tempId,
        eventId,
        userId: (user?.id as string) || "",
        bookedAt: new Date(),
        status: "confirmed",
      }
      setBookings((prev) => [...prev, optimistic])

      try {
        const apiResp: any = await BookingsApi.create({ eventId })
        const normalized: Booking = {
          id: apiResp.id,
          eventId: apiResp.eventId || apiResp.event?.id || eventId,
          userId: apiResp.userId || apiResp.user?.id || (user?.id as string),
          bookedAt: new Date(apiResp.bookedAt || apiResp.createdAt || Date.now()),
          status: (apiResp.status || "confirmed") as Booking["status"],
        }
        // Replace temp with server record
        setBookings((prev) => prev.map((b) => (b.id === tempId ? normalized : b)))
        return normalized
      } catch (error) {
        // Rollback
        setBookings((prev) => prev.filter((b) => b.id !== tempId))
        console.error("Failed to create booking:", error)
        throw error
      }
    },
    [user, bookings, events]
  )

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      // Optimistic remove
      const prev = bookings
      setBookings((p) => p.filter((b) => b.id !== bookingId))
      try {
        await BookingsApi.cancel(bookingId)
      } catch (error) {
        // Rollback
        setBookings(prev)
        console.error("Failed to cancel booking:", error)
        throw error
      }
    },
    [bookings]
  )

  // Lightweight SSE hookup (no-op if backend doesn't support /realtime)
  useEffect(() => {
    const es = createEventStream("/realtime")
    if (!es) return
    const onMessage = (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data)
        if (
          payload?.type === "event.updated" ||
          payload?.type === "event.created" ||
          payload?.type === "event.deleted" ||
          payload?.type === "booking.created" ||
          payload?.type === "booking.cancelled"
        ) {
          setReloadKey((k) => k + 1)
        }
      } catch {}
    }
    es.addEventListener("message", onMessage)
    return () => {
      try {
        es.removeEventListener("message", onMessage)
        es.close()
      } catch {}
    }
  }, [])

  return {
    events,
    bookings,
    filters,
    setFilters,
    refresh: () => setReloadKey((k) => k + 1),
    view,
    setView,
    isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    moveEvent,
    getEventsForDate,
    isEventBookedByUser: (eventId: string, userId: string) =>
      bookings.some(b => b.eventId === eventId && b.userId === userId),
    getEventBookings,
    createBooking,
    cancelBooking,
  }
}
