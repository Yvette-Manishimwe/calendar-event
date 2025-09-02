"use client"

import type React from "react"

import { useState } from "react"
import type { Event } from "@/lib/types"
import { useAuth } from "@/hooks/use-auth"

interface DropZoneProps {
  onDrop: (event: Event, targetDate: Date, targetTime?: string) => void
  targetDate: Date
  targetTime?: string
  children: React.ReactNode
  className?: string
}

export function DropZone({ onDrop, targetDate, targetTime, children, className = "" }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false)
  const { user } = useAuth() // access current user
  const isAdmin = user?.role === "admin"

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDragEnter = (e: React.DragEvent) => {
    if (!isAdmin) return
    e.preventDefault()
    setIsOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!isAdmin) return
    e.preventDefault()
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!isAdmin) return
    e.preventDefault()
    setIsOver(false)

    try {
      const eventData = JSON.parse(e.dataTransfer.getData("application/json")) as Event
      onDrop(eventData, targetDate, targetTime)
    } catch (error) {
      console.error("Failed to parse dropped event data:", error)
    }
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`${className} ${isOver ? "bg-primary/10 border-primary/30 border-2 border-dashed" : ""} transition-all duration-200`}
    >
      {children}
      {isOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-md pointer-events-none">
          <div className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Drop here</div>
        </div>
      )}
    </div>
  )
}

