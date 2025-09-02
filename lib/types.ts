export interface Event {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  category: EventCategory
  attendees?: string[]
  location?: string
  isAllDay?: boolean
  color?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string // User ID who created the event
  capacity?: number // Maximum number of bookings allowed
  bookings: EventBooking[] // List of bookings for this event
  isPublic: boolean // Whether event is visible to all users
  requiresApproval: boolean // Whether bookings need admin approval
}

export interface EventCategory {
  id: string
  name: string
  color: string
}

export interface CalendarView {
  type: "month" | "week" | "day"
  currentDate: Date
}

export interface DragState {
  isDragging: boolean
  draggedEvent: Event | null
  dragOffset: { x: number; y: number }
  targetDate?: Date
  targetTime?: string
}

export interface BookingFormData {
  title: string
  description: string
  startTime: string
  endTime: string
  date: string
  category: string
  location: string
  isAllDay: boolean
}

export interface User {
  id: string
  name: string
  email: string
  role: "admin" | "user"
  avatar?: string
  createdAt: Date
}

export interface EventBooking {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  bookedAt: Date
  status: "confirmed" | "cancelled"
}
