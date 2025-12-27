import { API_BASE_URL, AUTH_STORAGE } from "@/lib/config"

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
	const token = typeof window !== "undefined" ? localStorage.getItem(AUTH_STORAGE.ACCESS_TOKEN) : null;
	const headers = new Headers(options.headers || {});
  
	// Set Content-Type if body exists
	if (!headers.has("Content-Type") && options.body) {
	  headers.set("Content-Type", "application/json");
	}
  
	// Attach Authorization header if token exists
	if (token) {
	  headers.set("Authorization", `Bearer ${token}`);
	}
  
	const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  
	// Handle errors
	if (!res.ok) {
	  const message = await safeErrorMessage(res);
	  throw new Error(message);
	}
  
	const data = (await res.json()) as any;
  
	// Automatically store access_token if present in response
	if (data?.access_token) {
	  localStorage.setItem(AUTH_STORAGE.ACCESS_TOKEN, data.access_token);
	}
  
	return data as T;
  }
  

  

async function safeErrorMessage(res: Response): Promise<string> {
	try {
		const data = await res.json()
		return data?.message || data?.error || `Request failed with status ${res.status}`
	} catch {
		return `Request failed with status ${res.status}`
	}
}

export const AuthApi = {
	login: (payload: { email: string; password: string }) =>
		apiFetch<{ access_token?: string; token?: string; accessToken?: string; user?: any; data?: any }>("/auth/login", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	me: () => apiFetch<any>("/auth/me", { method: "GET" }),
	registerUser: (payload: {
		full_name: string
		phone_number: string
		email: string
		gender: string
		password: string
	}) =>
		apiFetch<{ id: string }>("/users", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
}

// CategoriesApi removed - using enum instead

export const EventsApi = {
	list: (params?: { from?: string; to?: string; category?: string; q?: string }) => {
		const search = new URLSearchParams()
		if (params?.from) search.set("from", params.from)
		if (params?.to) search.set("to", params.to)
		if (params?.category) search.set("category", params.category)
		if (params?.q) search.set("q", params.q)
		return apiFetch<any[]>(`/events?${search.toString()}`)
	},
	get: (id: string) => apiFetch<any>(`/events/${id}`),
	create: (payload: {
		title: string
		description?: string
		startTime: string
		endTime: string
		category: string
		location?: string
		isAllDay?: boolean
		color?: string
		isPublic: boolean
		requiresApproval: boolean
		capacity?: number
	}) => apiFetch<any>("/events", { method: "POST", body: JSON.stringify(payload) }),
	update: (id: string, payload: any) =>
		apiFetch<any>(`/events/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
	move: (id: string, payload: { startTime: string; endTime: string }) =>
		apiFetch<any>(`/events/${id}/move`, { method: "PATCH", body: JSON.stringify(payload) }),
	delete: (id: string) => apiFetch<{ success: boolean }>(`/events/${id}`, { method: "DELETE" }),
	getBookings: (id: string) => apiFetch<any[]>(`/events/${id}/bookings`),
}

export const BookingsApi = {
	create: (payload: { eventId: string }) =>
		apiFetch<any>("/bookings", { method: "POST", body: JSON.stringify(payload) }),
	listMine: () => apiFetch<any[]>("/bookings/me"),
	listByEvent: (eventId: string) => apiFetch<any[]>(`/bookings?eventId=${eventId}`),
	cancel: (id: string) => apiFetch<any>(`/bookings/${id}/cancel`, { method: "PATCH" }),
	approve: (id: string) => apiFetch<any>(`/bookings/${id}/approve`, { method: "PATCH" }),
}


