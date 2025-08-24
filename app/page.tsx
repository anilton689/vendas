"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { BudgetApp } from "@/components/budget-app"
import { AuthProvider } from "@/hooks/useAuth"

interface User {
  codigo: string
  nome: string
  tipo: "admin" | "vendedor"
  loginEm: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem("current-user")
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        localStorage.removeItem("current-user")
      }
    }
    setIsLoading(false)
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    localStorage.setItem("current-user", JSON.stringify(userData))
  }

  const handleLogout = () => {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthProvider>
        <LoginForm onLogin={handleLogin} />
      </AuthProvider>
    )
  }

  // Usar BudgetApp para TODOS os usuários (admin e vendedor)
  // O BudgetApp já tem lógica interna para diferenciar admin de vendedor
  return (
    <AuthProvider>
      <BudgetApp user={user} onLogout={handleLogout} />
    </AuthProvider>
  )
}
