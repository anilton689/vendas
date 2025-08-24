"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface User {
  codigo: string
  nome: string
  tipo: "admin" | "vendedor"
}

interface AuthContextType {
  user: User | null
  login: (userData: User) => void
  logout: () => void
  isAuthenticated: boolean
  isAdmin: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Recuperar usuário do localStorage na inicialização
    const savedUser = localStorage.getItem("current-user")
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch (error) {
        console.error("Erro ao recuperar usuário:", error)
        localStorage.removeItem("current-user")
      }
    }
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem("current-user", JSON.stringify(userData))
    console.log("✅ Usuário logado:", userData)
  }

  const logout = () => {
    setUser(null)

    // Limpar todos os dados do localStorage
    localStorage.removeItem("current-user")
    localStorage.removeItem("budget-followup-data")
    localStorage.removeItem("ai-config")
    localStorage.removeItem("budgets")
    localStorage.removeItem("historical-data")

    console.log("✅ Logout realizado - dados limpos")

    // Recarregar a página para garantir estado limpo
    window.location.reload()
  }

  const isAuthenticated = !!user

  const isAdmin = () => user?.tipo === "admin"

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isAdmin }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
