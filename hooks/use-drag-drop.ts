"use client"

import { useState, useCallback } from "react"
import type { Event, DragState } from "@/lib/types"

export function useDragDrop() {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedEvent: null,
    dragOffset: { x: 0, y: 0 },
  })

  const startDrag = useCallback((event: Event, clientX: number, clientY: number) => {
    setDragState({
      isDragging: true,
      draggedEvent: event,
      dragOffset: { x: clientX, y: clientY },
    })
  }, [])

  const updateDrag = useCallback((clientX: number, clientY: number, targetDate?: Date, targetTime?: string) => {
    setDragState((prev) => ({
      ...prev,
      dragOffset: { x: clientX, y: clientY },
      targetDate,
      targetTime,
    }))
  }, [])

  const endDrag = useCallback(() => {
    const result = {
      draggedEvent: dragState.draggedEvent,
      targetDate: dragState.targetDate,
      targetTime: dragState.targetTime,
    }

    setDragState({
      isDragging: false,
      draggedEvent: null,
      dragOffset: { x: 0, y: 0 },
    })

    return result
  }, [dragState])

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedEvent: null,
      dragOffset: { x: 0, y: 0 },
    })
  }, [])

  return {
    dragState,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
  }
}
