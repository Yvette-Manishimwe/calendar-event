"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { Event, EventCategory, CalendarView, Booking } from "@/lib/types"
import {
  loadEventsFromStorage,
  saveEventsToStorage,
  loadCategoriesFromStorage,
  saveCategoriesStorage,
  loadBookingsFromStorage,
  saveBookingsToStorage,
} from "@/lib/event-store"
import { EventsApi, BookingsApi } from "@/lib/api"

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  // Categories removed - using enum instead
  const [bookings, setBookings] = useState<Booking[]>([])
  const [view, setView] = useState<CalendarView>({ type: "month", currentDate: new Date() })
  const [isLoading, setIsLoading] = useState(true)

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load from backend
        const [backendEvents, backendBookings] = await Promise.all([
          EventsApi.list(),
          BookingsApi.listMine().catch(() => []), // fallback to empty array if not authenticated
        ])

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
        setBookings(backendBookings)
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
  }, [])

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
      try {
        const booking = await BookingsApi.create({ eventId })
        setBookings((prev) => [...prev, booking])
        return booking
      } catch (error) {
        console.error("Failed to create booking:", error)
        throw error
      }
    },
    []
  )

  const cancelBooking = useCallback(
    async (bookingId: string) => {
      try {
        await BookingsApi.cancel(bookingId)
        setBookings((prev) => prev.filter(b => b.id !== bookingId))
      } catch (error) {
        console.error("Failed to cancel booking:", error)
        throw error
      }
    },
    []
  )

  return {
    events,
    bookings,
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
