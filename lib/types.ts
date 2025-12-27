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

export enum EventCategory {
  MEETING = 'MEETING',
  PERSONAL = 'PERSONAL', 
  WORK = 'WORK',
  SOCIAL = 'SOCIAL',
  EDUCATION = 'EDUCATION',
  HEALTH = 'HEALTH',
  TRAVEL = 'TRAVEL',
  OTHER = 'OTHER'
}

export const EVENT_CATEGORY_COLORS = {
  [EventCategory.MEETING]: '#3B82F6', // blue
  [EventCategory.PERSONAL]: '#10B981', // green
  [EventCategory.WORK]: '#F59E0B', // yellow
  [EventCategory.SOCIAL]: '#EF4444', // red
  [EventCategory.EDUCATION]: '#8B5CF6', // purple
  [EventCategory.HEALTH]: '#06B6D4', // cyan
  [EventCategory.TRAVEL]: '#F97316', // orange
  [EventCategory.OTHER]: '#6B7280', // gray
}

export const EVENT_CATEGORY_LABELS = {
  [EventCategory.MEETING]: 'Meeting',
  [EventCategory.PERSONAL]: 'Personal',
  [EventCategory.WORK]: 'Work',
  [EventCategory.SOCIAL]: 'Social',
  [EventCategory.EDUCATION]: 'Education',
  [EventCategory.HEALTH]: 'Health',
  [EventCategory.TRAVEL]: 'Travel',
  [EventCategory.OTHER]: 'Other',
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
  status: "confirmed" | "cancelled" | "pending"
}

export interface Booking {
  id: string
  eventId: string
  userId: string
  bookedAt: Date
  status: "confirmed" | "cancelled" | "pending"
}
