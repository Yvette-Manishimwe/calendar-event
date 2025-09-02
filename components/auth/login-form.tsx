"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

// demo accounts with createdAt as Date
const DEMO_ACCOUNTS = {
  admin: {
    email: "admin@eventcal.com",
    password: "admin123",
    userData: {
      id: "admin-1",
      name: "Sarah Admin",
      email: "admin@eventcal.com",
      role: "admin" as const,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=admin",
      createdAt: new Date(),
    },
  },
  user: {
    email: "user@eventcal.com",
    password: "user123",
    userData: {
      id: "user-1",
      name: "John User",
      email: "user@eventcal.com",
      role: "user" as const,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=user",
      createdAt: new Date(),
    },
  },
}

export function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const adminAccount = DEMO_ACCOUNTS.admin
    const userAccount = DEMO_ACCOUNTS.user

    if (email === adminAccount.email && password === adminAccount.password) {
      router.push("/admin-portal")
    } else if (email === userAccount.email && password === userAccount.password) {
      router.push("/user-portal")
    } else {
      setError("Invalid email or password. Please use the demo credentials provided below.")
    }

    setIsLoading(false)
  }

  const quickLogin = (accountType: "admin" | "user") => {
    const account = DEMO_ACCOUNTS[accountType]
    setEmail(account.email)
    setPassword(account.password)
    setIsLoading(true)

    setTimeout(() => {
      login(account.userData)
      setIsLoading(false)
    }, 200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-pink-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-pink-600 bg-clip-text text-transparent">
            Event Calendar Platform
          </CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Quick Login Buttons */}
          <div className="grid gap-3 mt-4">
            {["admin", "user"].map((type) => (
              <Button
                key={type}
                onClick={() => quickLogin(type as "admin" | "user")}
                disabled={isLoading}
                className="w-full"
              >
                Quick Login as {type}
              </Button>
            ))}
          </div>

          {/* Create Account Link */}
          <div className="text-center text-sm text-muted-foreground mt-4">
            Don't have an account?{" "}
            <Button
              variant="link"
              size="sm"
              onClick={() => router.push("/register")}
              className="p-0 text-blue-600 hover:underline"
            >
              Create Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
