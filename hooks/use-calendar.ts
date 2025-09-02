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

export function useCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<EventCategory[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [view, setView] = useState<CalendarView>({ type: "month", currentDate: new Date() })
  const [isLoading, setIsLoading] = useState(true)

  // Load data
  useEffect(() => {
    setIsLoading(true)
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

    setCategories(loadCategoriesFromStorage())
    setBookings(loadBookingsFromStorage())
    setIsLoading(false)
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

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => saveCategoriesStorage(categories), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [categories, isLoading])

  useEffect(() => {
    if (!isLoading) {
      const timeoutId = setTimeout(() => saveBookingsToStorage(bookings), 500)
      return () => clearTimeout(timeoutId)
    }
  }, [bookings, isLoading])

  const addEvent = useCallback(
    (newEvent: Omit<Event, "id" | "createdAt" | "updatedAt">) => {
      const event: Event = { ...newEvent, id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date() }
      setEvents((prev) => [...prev, event])
      return event
    },
    []
  )

  const updateEvent = useCallback(
    (id: string, updates: Partial<Event>) => {
      setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date() } : e)))
    },
    []
  )

  const deleteEvent = useCallback((id: string) => setEvents((prev) => prev.filter((e) => e.id !== id)), [])

  const moveEvent = useCallback(
    (eventId: string, newStartTime: Date, newEndTime: Date) => {
      if (isNaN(newStartTime.getTime()) || isNaN(newEndTime.getTime())) return
      updateEvent(eventId, { startTime: newStartTime, endTime: newEndTime })
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


  return {
    events,
    categories,
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
    getEventBookings
  }
}
