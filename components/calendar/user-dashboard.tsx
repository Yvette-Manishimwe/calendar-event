"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Calendar,
  Clock,
  TrendingUp,
  MapPin,
  Filter,
  SortAsc,
  BarChart3,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import { useCalendarContext } from "./calendar-provider"
import { DashboardSkeleton } from "./loading-states"
import { useVirtualScroll } from "@/hooks/use-virtual-scroll"
import { format, isThisWeek, isThisMonth, isPast, isFuture, startOfWeek, endOfWeek } from "date-fns"

export function UserDashboard() {
  const { events, categories, isLoading } = useCalendarContext()
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date")
  const [filterBy, setFilterBy] = useState<"all" | "upcoming" | "past" | "this-week">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")

  const stats = useMemo(() => {
    const now = new Date()
    const thisWeekStart = startOfWeek(now)
    const thisWeekEnd = endOfWeek(now)

    const totalEvents = events.length
    const upcomingEvents = events.filter((event) => isFuture(event.startTime)).length
    const pastEvents = events.filter((event) => isPast(event.endTime)).length
    const thisWeekEvents = events.filter(
      (event) => event.startTime >= thisWeekStart && event.startTime <= thisWeekEnd,
    ).length
    const thisMonthEvents = events.filter((event) => isThisMonth(event.startTime)).length

    // Category distribution
    const categoryStats = categories.map((category) => ({
      ...category,
      count: events.filter((event) => event.category.id === category.id).length,
      percentage:
        totalEvents > 0 ? (events.filter((event) => event.category.id === category.id).length / totalEvents) * 100 : 0,
    }))

    // Recent activity (last 7 days)
    const recentActivity = events
      .filter((event) => {
        const daysDiff = Math.floor((now.getTime() - event.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        return daysDiff <= 7
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 5)

    return {
      totalEvents,
      upcomingEvents,
      pastEvents,
      thisWeekEvents,
      thisMonthEvents,
      categoryStats,
      recentActivity,
    }
  }, [events, categories])

  const filteredAndSortedEvents = useMemo(() => {
    let filtered = events

    // Apply filters
    switch (filterBy) {
      case "upcoming":
        filtered = filtered.filter((event) => isFuture(event.startTime))
        break
      case "past":
        filtered = filtered.filter((event) => isPast(event.endTime))
        break
      case "this-week":
        filtered = filtered.filter((event) => isThisWeek(event.startTime))
        break
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((event) => event.category.id === selectedCategory)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return a.startTime.getTime() - b.startTime.getTime()
        case "title":
          return a.title.localeCompare(b.title)
        case "category":
          return a.category.name.localeCompare(b.category.name)
        default:
          return 0
      }
    })

    return filtered
  }, [events, filterBy, selectedCategory, sortBy])

  const { visibleItems, totalHeight, handleScroll, offsetY } = useVirtualScroll(filteredAndSortedEvents, {
    itemHeight: 80,
    containerHeight: 400,
    overscan: 3,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
          <p className="text-muted-foreground">Overview of your calendar and events</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {stats.totalEvents} Total Events
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Week</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.thisWeekEvents}</div>
                <p className="text-xs text-muted-foreground">events scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">future events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-3">{stats.thisMonthEvents}</div>
                <p className="text-xs text-muted-foreground">monthly events</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-chart-4">{stats.pastEvents}</div>
                <p className="text-xs text-muted-foreground">past events</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Events created in the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentActivity.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.recentActivity.map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-3 h-3 rounded-full ${event.category.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Created {format(event.createdAt, "MMM d, h:mm a")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.category.name}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Category Distribution
              </CardTitle>
              <CardDescription>Breakdown of events by category</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.categoryStats.map((category) => (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      <span className="text-sm font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{category.count} events</span>
                      <span className="text-sm font-medium">{category.percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                  <Progress value={category.percentage} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Monthly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Event Trends</CardTitle>
              <CardDescription>Your calendar activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Trend analysis coming soon</p>
                <p className="text-sm">Track your scheduling patterns and productivity</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          {/* Filters and Sorting */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                  <SelectItem value="this-week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <SortAsc className="h-4 w-4 text-muted-foreground" />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="category">Category</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${category.color}`} />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events List with Virtual Scrolling */}
          <Card>
            <CardHeader>
              <CardTitle>Events ({filteredAndSortedEvents.length})</CardTitle>
              <CardDescription>Manage and view your events</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredAndSortedEvents.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No events found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="relative" style={{ height: 400 }}>
                  <div
                    className="overflow-auto h-full"
                    onScroll={handleScroll}
                    style={{ height: totalHeight > 400 ? 400 : totalHeight }}
                  >
                    <div style={{ height: totalHeight, position: "relative" }}>
                      <div style={{ transform: `translateY(${offsetY}px)` }}>
                        {visibleItems.map(({ item: event, index }) => (
                          <div
                            key={event.id}
                            className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors mb-2"
                            style={{ height: 80 }}
                          >
                            <div className={`w-4 h-4 rounded-full ${event.category.color} flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium truncate">{event.title}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {event.category.name}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {format(event.startTime, "MMM d, h:mm a")}
                                </div>
                                {event.location && (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isPast(event.endTime) && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                              {isFuture(event.startTime) && <Clock className="h-4 w-4 text-blue-500" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
