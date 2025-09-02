"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Calendar, Clock, BarChart3 } from "lucide-react"
import { useCalendarContext } from "./calendar-provider"
import { UserDashboard } from "./user-dashboard"
import { EventListSkeleton } from "./loading-states"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { format } from "date-fns"

export function EventSidebar() {
  const { events, categories, isLoading } = useCalendarContext()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 300)

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
        event.description?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || event.category.id === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [events, debouncedSearchQuery, selectedCategory])

  const upcomingEvents = useMemo(() => {
    return filteredEvents
      .filter((event) => event.startTime >= new Date())
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, 10)
  }, [filteredEvents])

  return (
    <div className="w-80 border-r border-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold text-sidebar-foreground mb-3">Event Calendar</h2>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              Events
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-3 mt-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-1"
                >
                  <div className={`w-2 h-2 rounded-full ${category.color}`} />
                  {category.name}
                </Button>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="mt-3">
            <div className="text-center text-sm text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Dashboard view</p>
              <p className="text-xs">Switch to main view for full dashboard</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="events" className="h-full">
          <TabsContent value="events" className="p-4 h-full">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium text-sidebar-foreground">Upcoming Events</h3>
              <Badge variant="secondary" className="ml-auto">
                {upcomingEvents.length}
              </Badge>
            </div>

            {isLoading ? (
              <EventListSkeleton count={5} />
            ) : (
              <div className="space-y-3">
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                ) : (
                  upcomingEvents.map((event) => (
                    <Card key={event.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className={`w-3 h-3 rounded-full ${event.category.color} mt-1 flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{event.title}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {format(event.startTime, "MMM d, h:mm a")}
                          </div>
                          {event.location && (
                            <div className="text-xs text-muted-foreground mt-1 truncate">📍 {event.location}</div>
                          )}
                          <Badge variant="outline" className="mt-2 text-xs">
                            {event.category.name}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="dashboard" className="p-4 h-full">
            <UserDashboard />
          </TabsContent>
        </Tabs>
      </div>

      <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/10">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-lg font-semibold text-sidebar-foreground">{events.length}</div>
            <div className="text-xs text-muted-foreground">Total Events</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-sidebar-foreground">{upcomingEvents.length}</div>
            <div className="text-xs text-muted-foreground">Upcoming</div>
          </div>
        </div>
      </div>
    </div>
  )
}
