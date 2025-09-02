import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/components/auth/auth-provider"
import { CalendarProvider } from "@/components/calendar/calendar-provider"
import { Suspense } from "react"
import "./globals.css"

export const metadata: Metadata = {
  title: "Event Calendar Platform",
  description: "Advanced event booking and calendar management system",
  generator: "v0.app",
}

const geistSans = GeistSans.variable
const geistMono = GeistMono.variable

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${geistSans} ${geistMono} antialiased`}>
      <body>
        <Suspense>
          <AuthProvider>
            <CalendarProvider>{children}</CalendarProvider>
          </AuthProvider>
        </Suspense>
      </body>
    </html>
  )
}
