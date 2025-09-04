import type { User } from "./types"
import { AUTH_STORAGE } from "@/lib/config"

// Sample users for demonstration
export const sampleUsers: User[] = [
  {
    id: "admin-1",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin",
    createdAt: new Date(),
  },
  {
    id: "user-1",
    name: "John Doe",
    email: "john@example.com",
    role: "user",
    createdAt: new Date(),
  },
  {
    id: "user-2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    createdAt: new Date(),
  },
]

// Local storage utilities for auth
export const AUTH_STORAGE_KEYS = {
  CURRENT_USER: "calendar-current-user",
  USERS: "calendar-users",
} as const

export function getAccessToken(): string | null {
	if (typeof window === "undefined") return null
	try {
		return localStorage.getItem(AUTH_STORAGE.ACCESS_TOKEN)
	} catch {
		return null
	}
}

export function setAccessToken(token: string): void {
	if (typeof window === "undefined") return
	try {
		localStorage.setItem(AUTH_STORAGE.ACCESS_TOKEN, token)
	} catch (error) {
		console.error("Failed to save token:", error)
	}
}

export function clearAccessToken(): void {
	if (typeof window === "undefined") return
	try {
		localStorage.removeItem(AUTH_STORAGE.ACCESS_TOKEN)
	} catch (error) {
		console.error("Failed to clear token:", error)
	}
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return sampleUsers[0] // Default to admin for demo

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER)
    if (!stored) return sampleUsers[0] // Default to admin for demo

    const parsed = JSON.parse(stored)
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
    }
  } catch {
    return sampleUsers[0]
  }
}

export function setCurrentUser(user: User): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user))
  } catch (error) {
    console.error("Failed to save current user:", error)
  }
}

export function clearCurrentUser(): void {
  if (typeof window === "undefined") return

  try {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER)
  } catch (error) {
    console.error("Failed to clear current user:", error)
  }
}

export function loadUsersFromStorage(): User[] {
  if (typeof window === "undefined") return sampleUsers

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEYS.USERS)
    if (!stored) return sampleUsers

    const parsed = JSON.parse(stored)
    return parsed.map((user: any) => ({
      ...user,
      createdAt: new Date(user.createdAt),
    }))
  } catch {
    return sampleUsers
  }
}

export function saveUsersToStorage(users: User[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(AUTH_STORAGE_KEYS.USERS, JSON.stringify(users))
  } catch (error) {
    console.error("Failed to save users to storage:", error)
  }
}
