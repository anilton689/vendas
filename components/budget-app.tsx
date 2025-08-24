"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  DollarSign,
  AlertCircle,
  LogOut,
  RefreshCw,
  AlertTriangle,
  MessageSquare,
  CheckCircle,
  Search,
  Filter,
  Brain,
  Settings,
  BarChart3,
  FileText,
  Clock,
} from "lucide-react"
import { FollowupTable } from "@/components/followup-table"
import { Dashboard } from "@/components/dashboard"
import { AIConfig } from "@/components/ai-config"
import { AdminSystemConfig } from "@/components/admin-system-config"
import { ReportsDashboard } from "@/components/reports-dashboard"
import { AIChat } from "@/components/ai-chat"
import type { Budget } from "@/types/budget"

interface User {
  codigo: string
  nome: string
  tipo: "admin" | "vendedor"
  loginEm: string
}

interface BudgetAppProps {
  user: User
  onLogout: () => void
}

// Função melhorada para converter datas
function convertExcelDate(dateValue: any, context = "Unknown"): string {
  console.log(`📅 [${context}] Convertendo data:`, dateValue, typeof dateValue)

  if (!dateValue) {
    console.log(`📅 [${context}] Data vazia, usando hoje`)
    return new Date().toISOString().split("T")[0]
  }

  // Se já é uma string no formato YYYY-MM-DD
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    console.log(`📅 [${context}] Data já no formato ISO:`, dateValue)
    return dateValue
  }

  // Se é um número (data serial do Excel)
  if (typeof dateValue === "number") {
    console.log(`📅 [${context}] Convertendo número serial:`, dateValue)
    const excelEpoch = new Date(1900, 0, 1)
    const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000)
    const result = date.toISOString().split("T")[0]
    console.log(`📅 [${context}] Serial ${dateValue} -> ${result}`)
    return result
  }

  // Se é string, tentar vários formatos
  if (typeof dateValue === "string") {
    const cleanDate = dateValue.trim()
    console.log(`📅 [${context}] Processando string:`, cleanDate)

    // Formato brasileiro: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
    const brFormats = [/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/]
    for (const format of brFormats) {
      const match = cleanDate.match(format)
      if (match) {
        const [, day, month, year] = match
        const dayNum = Number.parseInt(day)
        const monthNum = Number.parseInt(month)

        // Se dia > 12, definitivamente é formato brasileiro
        if (dayNum > 12 || (dayNum <= 12 && monthNum <= 12)) {
          const result = `${year}-${monthNum.toString().padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`
          console.log(`📅 [${context}] Formato BR ${cleanDate} -> ${result}`)
          return result
        }
      }
    }

    // Formato ISO com hora: YYYY-MM-DDTHH:mm:ss
    if (cleanDate.includes("T")) {
      const result = cleanDate.split("T")[0]
      console.log(`📅 [${context}] ISO com hora ${cleanDate} -> ${result}`)
      return result
    }

    // Tentar parse direto
    try {
      const parsed = new Date(cleanDate)
      if (!isNaN(parsed.getTime())) {
        const result = parsed.toISOString().split("T")[0]
        console.log(`📅 [${context}] Parse direto ${cleanDate} -> ${result}`)
        return result
      }
    } catch (error) {
      console.log(`📅 [${context}] Erro no parse direto:`, error)
    }
  }

  // Fallback: usar data atual
  const fallback = new Date().toISOString().split("T")[0]
  console.log(`📅 [${context}] Usando fallback:`, fallback)
  return fallback
}

export function BudgetApp({ user, onLogout }: BudgetAppProps) {
  console.log("🛍️ BudgetApp carregado para vendedor:", user)

  const [budgets, setBudgets] = useState<Budget[]>([])
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "error" | "checking">("checking")
  const [error, setError] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("dashboard")

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (!user) return

    // Aplicar filtros
    let filtered = budgets

    // Se não é admin, filtrar apenas orçamentos do vendedor
    if (user.tipo !== "admin") {
      filtered = filtered.filter((budget) => budget.codigo_vendedor === user.codigo)
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (budget) =>
          budget.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.sequencia.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (budget) => budget.status_atual !== "pedido_fechado" && budget.status_atual !== "orcamento_perdido",
        )
      } else if (statusFilter === "urgent") {
        filtered = filtered.filter(
          (budget) =>
            budget.dias_followup === "D+3" &&
            budget.status_atual !== "pedido_fechado" &&
            budget.status_atual !== "orcamento_perdido",
        )
      } else {
        filtered = filtered.filter((budget) => budget.status_atual === statusFilter)
      }
    }

    setFilteredBudgets(filtered)
  }, [budgets, user, searchTerm, statusFilter])

  const loadData = async () => {
    const config = JSON.parse(localStorage.getItem("sheets-config") || "{}")
    if (!config.apiKey || !config.spreadsheetId) {
      setConnectionStatus("error")
      setError("Configuração não encontrada. Entre em contato com o administrador.")
      return
    }

    setIsLoading(true)
    setConnectionStatus("checking")
    setError("")

    try {
      console.log("🔄 Carregando dados...")

      // Buscar orçamentos
      const orcamentosUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Orçamentos!A:H?key=${config.apiKey}`
      console.log("📊 Buscando orçamentos:", orcamentosUrl)

      const orcamentosResponse = await fetch(orcamentosUrl)

      if (!orcamentosResponse.ok) {
        const errorText = await orcamentosResponse.text()
        console.error("❌ Erro na resposta dos orçamentos:", orcamentosResponse.status, errorText)
        throw new Error(`Erro ao buscar orçamentos: ${orcamentosResponse.status} - ${errorText}`)
      }

      const orcamentosData = await orcamentosResponse.json()
      console.log("✅ Orçamentos recebidos:", orcamentosData.values?.length || 0, "linhas")
      console.log("📋 Dados brutos dos orçamentos:", orcamentosData.values?.slice(0, 3))

      // Buscar histórico
      const historicoUrl = `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}/values/Historico!A:J?key=${config.apiKey}`
      console.log("📈 Buscando histórico:", historicoUrl)

      const historicoResponse = await fetch(historicoUrl)
      let historicoData = { values: [] }

      if (historicoResponse.ok) {
        historicoData = await historicoResponse.json()
        console.log("✅ Histórico recebido:", historicoData.values?.length || 0, "linhas")
      } else {
        console.warn("⚠️ Erro ao buscar histórico, continuando sem histórico:", historicoResponse.status)
      }

      // Processar orçamentos
      const orcamentos = (orcamentosData.values?.slice(1) || [])
        .map((row: string[], index: number) => {
          try {
            const dataOriginal = row[0]
            const dataConvertida = convertExcelDate(dataOriginal, `Linha ${index + 2}`)

            console.log(`📅 Linha ${index + 2}: Data original="${dataOriginal}" -> Convertida="${dataConvertida}"`)

            return {
              data: dataConvertida,
              sequencia: row[1] || "",
              cliente: row[2] || "",
              valor: convertValue(row[3]),
              codigo_vendedor: row[4] || "",
              nome_vendedor: row[5] || "",
              email_cliente: row[6] || "",
              telefone_cliente: row[7] || "",
            }
          } catch (error) {
            console.error(`Erro ao processar orçamento linha ${index + 2}:`, error, row)
            return null
          }
        })
        .filter(Boolean)

      console.log("📋 Orçamentos processados:", orcamentos.length)

      // Processar histórico
      const historico = (historicoData.values?.slice(1) || [])
        .map((row: string[], index: number) => {
          try {
            return {
              sequencia_orcamento: row[0] || "",
              data_hora_followup: row[1] || "",
              status: row[2] || "orcamento_enviado",
              observacoes: row[3] || "",
              codigo_vendedor: row[4] || "",
              nome_vendedor: row[5] || "",
            }
          } catch (error) {
            console.error(`Erro ao processar histórico linha ${index + 2}:`, error, row)
            return null
          }
        })
        .filter(Boolean)

      console.log("📊 Histórico processado:", historico.length)

      // Combinar dados
      const budgetsWithHistory = orcamentos.map((orcamento: Budget) => {
        const historicoOrcamento = historico.filter((h: any) => h.sequencia_orcamento === orcamento.sequencia)
        const ultimoHistorico = historicoOrcamento[historicoOrcamento.length - 1]

        return {
          ...orcamento,
          status_atual: ultimoHistorico?.status || "orcamento_enviado",
          observacoes_atuais: ultimoHistorico?.observacoes || "",
          ultimo_followup: ultimoHistorico?.data_hora_followup || "",
          dias_followup: calculateFollowUpDay(orcamento.data),
          historico: historicoOrcamento,
        }
      })

      console.log("🔗 Dados combinados:", budgetsWithHistory.length)

      setBudgets(budgetsWithHistory)
      setLastUpdate(new Date().toLocaleString("pt-BR"))
      setConnectionStatus("connected")
      setError("")
    } catch (error: any) {
      console.error("❌ Erro ao carregar dados:", error)
      setConnectionStatus("error")
      setError(`Erro ao conectar: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const convertValue = (value: any): number => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const cleanValue = value
        .replace(/[R$\s]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
      const numValue = Number.parseFloat(cleanValue)
      return isNaN(numValue) ? 0 : numValue
    }
    return 0
  }

  const calculateFollowUpDay = (budgetDate: string): string => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [year, month, day] = budgetDate.split("-").map(Number)
    const budgetDateObj = new Date(year, month - 1, day)
    budgetDateObj.setHours(0, 0, 0, 0)

    const diffTime = today.getTime() - budgetDateObj.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    console.log(
      `📅 Calculando follow-up: Orçamento=${budgetDate}, Hoje=${today.toISOString().split("T")[0]}, Diferença=${diffDays} dias`,
    )

    if (diffDays === 1) return "D+1"
    if (diffDays === 2) return "D+2"
    if (diffDays >= 3) return "D+3"
    return "A agendar"
  }

  // Estatísticas do usuário
  const userBudgets = user?.tipo === "admin" ? budgets : budgets.filter((b) => b.codigo_vendedor === user?.codigo)
  const pendingBudgets = userBudgets.filter(
    (b) => b.status_atual !== "pedido_fechado" && b.status_atual !== "orcamento_perdido",
  )
  const closedBudgets = userBudgets.filter((b) => b.status_atual === "pedido_fechado")
  const lostBudgets = userBudgets.filter((b) => b.status_atual === "orcamento_perdido")
  const urgentBudgets = userBudgets.filter(
    (b) => b.dias_followup === "D+3" && b.status_atual !== "pedido_fechado" && b.status_atual !== "orcamento_perdido",
  )

  const totalValue = userBudgets.reduce((sum, b) => sum + b.valor, 0)
  const closedValue = closedBudgets.reduce((sum, b) => sum + b.valor, 0)
  const totalFinalized = closedBudgets.length + lostBudgets.length
  const closureRate = totalFinalized > 0 ? (closedBudgets.length / totalFinalized) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">💎 Crystal Follow-up</h1>
              {urgentBudgets.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {urgentBudgets.length} Urgente{urgentBudgets.length > 1 ? "s" : ""}
                </Badge>
              )}
              {lastUpdate && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {lastUpdate}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{user?.nome}</span>
                <Badge variant={user?.tipo === "admin" ? "default" : "secondary"} className="ml-2">
                  {user?.tipo === "admin" ? "👑 Admin" : "👤 Vendedor"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    connectionStatus === "connected"
                      ? "bg-green-500"
                      : connectionStatus === "error"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                />
                <span className="text-xs text-gray-500">
                  {connectionStatus === "connected"
                    ? "Conectado"
                    : connectionStatus === "error"
                      ? "Erro"
                      : "Verificando"}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={loadData} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${user?.tipo === "admin" ? "grid-cols-6" : "grid-cols-3"}`}>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="ai-chat" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Chat IA
            </TabsTrigger>
            {user?.tipo === "admin" && (
              <>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Relatórios
                </TabsTrigger>
                <TabsTrigger value="ai-config" className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Config IA
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Sistema
                </TabsTrigger>
              </>
            )}
          </TabsList>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6 mt-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{userBudgets.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingBudgets.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Fechados</p>
                    <p className="text-2xl font-bold text-green-600">{closedBudgets.length}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Urgentes</p>
                    <p className="text-2xl font-bold text-red-600">{urgentBudgets.length}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pipeline</p>
                    <p className="text-lg font-bold text-blue-600">R$ {(totalValue / 1000).toFixed(0)}k</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="dashboard">
            <Dashboard budgets={userBudgets} user={user} onLogout={onLogout} />
          </TabsContent>

          <TabsContent value="followup">
            <div className="space-y-6">
              {/* Filtros */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    Filtros e Busca
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 block mb-2">
                        Buscar por cliente ou número
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Digite o nome do cliente ou número do orçamento..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 block mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="urgent">Urgentes (D+3)</option>
                        <option value="orcamento_enviado">Orçamento Enviado</option>
                        <option value="aguardando_analise">Aguardando Análise</option>
                        <option value="em_negociacao">Em Negociação</option>
                        <option value="aguardando_aprovacao">Aguardando Aprovação</option>
                        <option value="pedido_fechado">Fechado</option>
                        <option value="orcamento_perdido">Perdido</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <FollowupTable budgets={filteredBudgets} onFollowup={() => loadData()} user={user} />
            </div>
          </TabsContent>

          <TabsContent value="ai-chat">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Chat com IA de Vendas
                  </CardTitle>
                  <CardDescription>
                    Converse com a IA sobre estratégias de vendas, análise de orçamentos e follow-ups
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AIChat />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {user?.tipo === "admin" && (
            <>
              <TabsContent value="reports">
                <ReportsDashboard budgets={budgets} />
              </TabsContent>

              <TabsContent value="ai-config">
                <AIConfig />
              </TabsContent>

              <TabsContent value="settings">
                <AdminSystemConfig />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  )
}
