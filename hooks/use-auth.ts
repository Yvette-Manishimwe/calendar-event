"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "@/lib/types"
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  loadUsersFromStorage,
  saveUsersToStorage,
} from "@/lib/auth-store"

export function useAuth() {
  const [currentUser, setCurrentUserState] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true) // new loading state

  // Load users and current user once
  useEffect(() => {
    const user = getCurrentUser()
    setCurrentUserState(user)

    const storedUsers = loadUsersFromStorage()
    setUsers(storedUsers)

    setLoading(false) // done loading
  }, [])

  // Save users when they change
  useEffect(() => {
    if (users.length > 0) saveUsersToStorage(users)
  }, [users])

  const login = useCallback((user: User) => {
    setCurrentUser(user)
    setCurrentUserState(user)
  }, [])

  const logout = useCallback(() => {
    clearCurrentUser()
    setCurrentUserState(null)
  }, [])

  const switchUser = useCallback(
    (userId: string) => {
      const user = users.find((u) => u.id === userId)
      if (user) login(user)
    },
    [users, login],
  )

  const isAdmin = currentUser?.role === "admin"
  const isUser = currentUser?.role === "user"
  const isAuthenticated = !!currentUser

  return {
    currentUser,
    user: currentUser,
    users,
    isAdmin,
    isUser,
    isAuthenticated,
    login,
    logout,
    switchUser,
    loading, // return loading state
  }
}
