"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// Default credentials
const DEFAULT_USER = {
  // Use process.env to read the variables
  userId: process.env.NEXT_PUBLIC_ADMIN_USER_ID || "admin", // Fallback provided just in case
  password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "admin123",
  name: process.env.NEXT_PUBLIC_ADMIN_NAME || "Administrator",
}

interface AuthContextType {
  isAuthenticated: boolean
  user: { name: string } | null
  login: (userId: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const session = sessionStorage.getItem("ems_auth")
    if (session) {
      const parsed = JSON.parse(session)
      setIsAuthenticated(true)
      setUser({ name: parsed.name })
    }
    setIsLoading(false)
  }, [])

  const login = (userId: string, password: string): boolean => {
    if (userId === DEFAULT_USER.userId && password === DEFAULT_USER.password) {
      setIsAuthenticated(true)
      setUser({ name: DEFAULT_USER.name })
      sessionStorage.setItem("ems_auth", JSON.stringify({ name: DEFAULT_USER.name }))
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    setUser(null)
    sessionStorage.removeItem("ems_auth")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
