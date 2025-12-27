"use client"

import { useState, useEffect, useCallback } from "react"
import type { User } from "@/lib/types"
import {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  loadUsersFromStorage,
  saveUsersToStorage,
  setAccessToken,
  clearAccessToken,
} from "@/lib/auth-store"
import { AuthApi } from "@/lib/api"

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

  const loginWithCredentials = useCallback(async (email: string, password: string) => {
    const resp = await AuthApi.login({ email, password })
    const token = resp?.access_token || resp?.accessToken || resp?.token
    const payloadUser = resp?.user || resp?.data || resp
    if (token) setAccessToken(token)

    // Derive role from JWT if available
    let derivedRole: "admin" | "user" = "user"
    try {
      if (token) {
        const payloadBase64 = token.split(".")[1]
        const payloadJson = typeof window !== "undefined" ? atob(payloadBase64) : Buffer.from(payloadBase64, "base64").toString("utf-8")
        const payload = JSON.parse(payloadJson)
        const roles = payload?.roles as Array<{ role_name?: string }> | undefined
        if (Array.isArray(roles) && roles.some(r => (r.role_name || "").toUpperCase() === "ADMIN")) {
          derivedRole = "admin"
        }
      }
    } catch {
      // ignore decode errors
    }

    // Normalize user object
    const normalizedUser: User = {
      id: payloadUser?.id || payloadUser?.userId || "",
      name: payloadUser?.name || payloadUser?.full_name || payloadUser?.fullName || "",
      email: payloadUser?.email || "",
      role: ((payloadUser?.role === "admin") || (payloadUser?.role === "ADMIN") || derivedRole === "admin" ? "admin" : "user") as "admin" | "user",
      avatar: payloadUser?.avatar,
      createdAt: payloadUser?.createdAt ? new Date(payloadUser.createdAt) : new Date(),
    }

    setCurrentUser(normalizedUser)
    setCurrentUserState(normalizedUser)
    return normalizedUser
  }, [])

  const logout = useCallback(() => {
    clearCurrentUser()
    clearAccessToken()
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
    loginWithCredentials,
    logout,
    switchUser,
    loading, // return loading state
  }
}
