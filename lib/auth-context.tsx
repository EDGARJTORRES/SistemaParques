"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { logSystemAction } from "@/lib/logging"

interface User {
  id: number
  email: string
  nombre: string
  rol: string
  avatar?: string
  totpActivo?: boolean
}

interface AuthContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)

        setUser({
          id: Number(parsedUser.id),
          email: parsedUser.email || "",
          nombre: parsedUser.nombre || "",
          rol: parsedUser.rol || "",
          avatar: parsedUser.avatar || undefined,
          totpActivo: parsedUser.totpActivo ?? false,
        })
      } catch (error) {
        console.error("Error al parsear usuario guardado:", error)
        sessionStorage.removeItem("user")
      }
    }

    setLoading(false)
  }, [])

  const logout = () => {
    // Log logout action before clearing user data
    if (user) {
      logSystemAction('SISTEMA_LOGOUT', [user.nombre, user.id])
    }
    
    sessionStorage.removeItem("user")
    localStorage.removeItem("token")
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }

  return context
}
