import type { Event, Booking } from "./types"

// Sample categories removed - using enum instead

// Sample events for demonstration
export const sampleEvents: Event[] = [
  {
    id: "1",
    title: "Team Standup",
    description: "Daily team sync meeting",
    startTime: new Date(2025, 8, 15, 9, 0), // Updated to September 2025 to be future events
    endTime: new Date(2025, 8, 15, 9, 30),
    category: "MEETING" as any,
    location: "Conference Room A",
    capacity: 10, // Added capacity for booking functionality
    createdBy: "admin", // Added creator tracking
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    title: "Client Presentation",
    description: "Q4 results presentation",
    startTime: new Date(2025, 8, 16, 14, 0), // Updated to September 2025
    endTime: new Date(2025, 8, 16, 15, 30),
    category: "WORK" as any,
    location: "Main Conference Room",
    capacity: 25, // Added capacity
    createdBy: "admin", // Added creator tracking
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    title: "Lunch with Sarah",
    description: "Catch up over lunch",
    startTime: new Date(2025, 8, 17, 12, 0), // Updated to September 2025
    endTime: new Date(2025, 8, 17, 13, 0),
    category: "PERSONAL" as any,
    location: "Downtown Cafe",
    capacity: 4, // Added capacity
    createdBy: "admin", // Added creator tracking
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    title: "Tech Workshop",
    description: "Learn about new technologies and frameworks",
    startTime: new Date(2025, 8, 20, 10, 0), // Added new sample event
    endTime: new Date(2025, 8, 20, 12, 0),
    category: "WORK" as any,
    location: "Tech Hub",
    capacity: 15,
    createdBy: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Local storage utilities
export const STORAGE_KEYS = {
  EVENTS: "calendar-events",
  BOOKINGS: "calendar-bookings",
} as const

export function loadEventsFromStorage(): Event[] {
  if (typeof window === "undefined") return sampleEvents

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.EVENTS)
    if (!stored) return sampleEvents

    const parsed = JSON.parse(stored)
    return parsed.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: new Date(event.endTime),
      createdAt: new Date(event.createdAt),
      updatedAt: new Date(event.updatedAt),
    }))
  } catch {
    return sampleEvents
  }
}

export function saveEventsToStorage(events: Event[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events))
  } catch (error) {
    console.error("Failed to save events to storage:", error)
  }
}

// Categories functions removed - using enum instead

export function loadBookingsFromStorage(): Booking[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.BOOKINGS)
    if (!stored) return []

    const parsed = JSON.parse(stored)
    return parsed.map((booking: any) => ({
      ...booking,
      bookedAt: new Date(booking.bookedAt),
    }))
  } catch {
    return []
  }
}

export function saveBookingsToStorage(bookings: Booking[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings))
  } catch (error) {
    console.error("Failed to save bookings to storage:", error)
  }
}
