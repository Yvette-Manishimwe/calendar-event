"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { CalendarIcon, Clock, MapPin, Tag } from "lucide-react"
import { format, parse, isValid } from "date-fns"
import { type Event, type BookingFormData, EventCategory, EVENT_CATEGORY_COLORS, EVENT_CATEGORY_LABELS } from "@/lib/types"
import { useCalendarContext } from "./calendar-provider"
import { useAuth } from "@/hooks/use-auth"

interface EventBookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingEvent?: Event | null
  preselectedDate?: Date
}

export function EventBookingDialog({ open, onOpenChange, editingEvent, preselectedDate }: EventBookingDialogProps) {
  const { addEvent, updateEvent, categories } = useCalendarContext()
  const { currentUser } = useAuth()

  const [formData, setFormData] = useState<BookingFormData>(() => {
    if (editingEvent) {
      return {
        title: editingEvent.title,
        description: editingEvent.description || "",
        startTime: format(editingEvent.startTime, "HH:mm"),
        endTime: format(editingEvent.endTime, "HH:mm"),
        date: format(editingEvent.startTime, "yyyy-MM-dd"),
        category: editingEvent.category,
        location: editingEvent.location || "",
        isAllDay: editingEvent.isAllDay || false,
      }
    }

    const defaultDate = preselectedDate || new Date()
    return {
      title: "",
      description: "",
      startTime: "09:00",
      endTime: "10:00",
      date: format(defaultDate, "yyyy-MM-dd"),
      category: categories[0] || EventCategory.OTHER,
      location: "",
      isAllDay: false,
    }
  })

  const [errors, setErrors] = useState<Partial<BookingFormData>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<BookingFormData> = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    if (!formData.date) {
      newErrors.date = "Date is required"
    }

    if (!formData.isAllDay) {
      if (!formData.startTime) {
        newErrors.startTime = "Start time is required"
      }
      if (!formData.endTime) {
        newErrors.endTime = "End time is required"
      }

      if (formData.startTime && formData.endTime) {
        const startTime = parse(formData.startTime, "HH:mm", new Date())
        const endTime = parse(formData.endTime, "HH:mm", new Date())

        if (isValid(startTime) && isValid(endTime) && endTime <= startTime) {
          newErrors.endTime = "End time must be after start time"
        }
      }
    }

    if (!formData.category) {
      newErrors.category = "Category is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const selectedDate = new Date(formData.date)
      const category = formData.category as EventCategory



      let startTime: Date
      let endTime: Date

      if (formData.isAllDay) {
        startTime = new Date(selectedDate.setHours(0, 0, 0, 0))
        endTime = new Date(selectedDate.setHours(23, 59, 59, 999))
      } else {
        const [startHour, startMinute] = formData.startTime.split(":").map(Number)
        const [endHour, endMinute] = formData.endTime.split(":").map(Number)

        startTime = new Date(selectedDate.setHours(startHour, startMinute, 0, 0))
        endTime = new Date(selectedDate.setHours(endHour, endMinute, 0, 0))
      }

      const eventData: Omit<Event, "id" | "createdAt" | "updatedAt"> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        startTime,
        endTime,
        category,
        location: formData.location.trim() || undefined,
        isAllDay: formData.isAllDay,
        color: EVENT_CATEGORY_COLORS[formData.category as EventCategory],// optional
        isPublic: true, // or from a form field
        requiresApproval: false, // or from a form field
        capacity: undefined, // optional
        createdBy: currentUser?.id || "", // you must provide the User entity who creates the event
        bookings: [], // empty array by default
        
      };
      

      if (editingEvent) {
        updateEvent(editingEvent.id, eventData)
      } else {
        addEvent(eventData)
      }

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        startTime: "09:00",
        endTime: "10:00",
        date: format(new Date(), "yyyy-MM-dd"),
        category: categories[0] || EventCategory.OTHER, // use the enum value directly
        location: "",
        isAllDay: false,
      })
      
      setErrors({})
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to save event:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormData = (field: keyof BookingFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            {editingEvent ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            {editingEvent ? "Update your event details below." : "Fill in the details to create a new event."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              placeholder="Enter event title..."
              value={formData.title}
              onChange={(e) => updateFormData("title", e.target.value)}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add event description..."
              value={formData.description}
              onChange={(e) => updateFormData("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => updateFormData("date", e.target.value)}
              className={errors.date ? "border-destructive" : ""}
            />
            {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="all-day"
              checked={formData.isAllDay}
              onCheckedChange={(checked) => updateFormData("isAllDay", checked)}
            />
            <Label htmlFor="all-day">All day event</Label>
          </div>

          {/* Time Fields */}
          {!formData.isAllDay && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Start Time *
                </Label>
                <Input
                  id="start-time"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => updateFormData("startTime", e.target.value)}
                  className={errors.startTime ? "border-destructive" : ""}
                />
                {errors.startTime && <p className="text-sm text-destructive">{errors.startTime}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="end-time" className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  End Time *
                </Label>
                <Input
                  id="end-time"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => updateFormData("endTime", e.target.value)}
                  className={errors.endTime ? "border-destructive" : ""}
                />
                {errors.endTime && <p className="text-sm text-destructive">{errors.endTime}</p>}
              </div>
            </div>
          )}

          {/* Category */}
          <div className="space-y-2">
  <Label htmlFor="category" className="flex items-center gap-1">
    <Tag className="w-4 h-4" />
    Category *
  </Label>
  <Select value={formData.category} onValueChange={(value) => updateFormData("category", value as EventCategory)}>
    <SelectTrigger className={errors.category ? "border-destructive" : ""}>
      <SelectValue placeholder="Select a category" />
    </SelectTrigger>
    <SelectContent>
      {Object.values(EventCategory).map((cat) => (
        <SelectItem key={cat} value={cat}>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: EVENT_CATEGORY_COLORS[cat] }} />
            {EVENT_CATEGORY_LABELS[cat]}
          </div>
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
  {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
</div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              id="location"
              placeholder="Add location..."
              value={formData.location}
              onChange={(e) => updateFormData("location", e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
