"use client"

import type React from "react"
// 1. Add useEffect to imports
import { useState, useEffect } from "react" 
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building2, Lock, User, AlertCircle, ArrowRight } from "lucide-react"

export default function LoginPage() {
  const [userId, setUserId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const router = useRouter()

  // 2. THE FIX: Wrap the navigation logic in useEffect
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // 3. Keep this check to prevent the Login UI from flashing before redirect happens
  if (isAuthenticated) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const success = login(userId, password)
    if (success) {
      router.push("/")
    } else {
      setError("Invalid user ID or password")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="w-full max-w-[400px] space-y-6 relative z-10">
        {/* Logo/Brand */}
        <div className="flex flex-col items-center space-y-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-foreground">EMS Financial</h1>
            <p className="text-muted-foreground text-sm">Admin Dashboard</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="border-border card-shadow">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-lg text-center">Welcome back</CardTitle>
            <CardDescription className="text-center text-sm">
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm font-medium">
                  User ID
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="userId"
                    type="text"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 gap-2" disabled={isLoading}>
                {isLoading ? (
                  "Signing in..."
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Default credentials hint */}
            {/* <div className="mt-5 p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                <span className="font-semibold text-foreground">Default credentials</span>
                <br />
                User ID: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">admin</code>
                <span className="mx-1.5">•</span>
                Password: <code className="bg-background px-1.5 py-0.5 rounded text-foreground">admin123</code>
              </p>
            </div> */}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">Secure access to financial management system</p>
      </div>
    </div>
  )
}