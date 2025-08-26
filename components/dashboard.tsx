"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Eye,
  XCircle,
  Filter,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface User {
  codigo: string
  nome: string
  tipo: "admin" | "vendedor"
}

interface DashboardProps {
  budgets: Budget[]
  user: User | null
  onLogout: () => void
}

export function Dashboard({ budgets, user, onLogout }: DashboardProps) {
  const [selectedVendedor, setSelectedVendedor] = useState<string>("todos")
  const [showClosedModal, setShowClosedModal] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([])

  // Lista de vendedores únicos
  const vendedores = Array.from(new Set(budgets.map((b) => b.codigo_vendedor).filter(Boolean))).map((codigo) => {
    const budget = budgets.find((b) => b.codigo_vendedor === codigo)
    return {
      codigo,
      nome: budget?.nome_vendedor || `Vendedor ${codigo}`,
    }
  })

  useEffect(() => {
    let filtered = budgets

    // ADMIN vê todos por padrão, mas pode filtrar por vendedor específico
    if (user?.tipo === "admin") {
      if (selectedVendedor !== "todos") {
        filtered = filtered.filter((budget) => budget.codigo_vendedor === selectedVendedor)
      }
      // Se selectedVendedor === "todos", mostra todos os orçamentos (não filtra)
    } else {
      // VENDEDOR vê apenas seus próprios orçamentos
      filtered = filtered.filter((budget) => budget.codigo_vendedor === user?.codigo)
    }

    setFilteredBudgets(filtered)
  }, [budgets, user, selectedVendedor])

  const calculateDaysOpen = (budgetDate: string): number => {
    const today = new Date()
    const [year, month, day] = budgetDate.split("-").map(Number)
    const budgetDateObj = new Date(year, month - 1, day)
    const diffTime = today.getTime() - budgetDateObj.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "undefined" || dateString === "null") return "Nunca"
    try {
      // Tenta diferentes formatos de data
      let date: Date

      // Se já é uma data ISO
      if (dateString.includes("T") || dateString.includes("-")) {
        date = new Date(dateString)
      } else {
        // Se é um formato brasileiro dd/mm/yyyy
        const parts = dateString.split("/")
        if (parts.length === 3) {
          date = new Date(Number.parseInt(parts[2]), Number.parseInt(parts[1]) - 1, Number.parseInt(parts[0]))
        } else {
          date = new Date(dateString)
        }
      }

      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return "Nunca"
      }

      return date.toLocaleDateString("pt-BR")
    } catch {
      return "Nunca"
    }
  }

  const formatDateTime = (dateTimeString: string) => {
    if (
      !dateTimeString ||
      dateTimeString === "undefined" ||
      dateTimeString === "null" ||
      dateTimeString === "" ||
      dateTimeString === "Invalid Date"
    ) {
      return "Nunca"
    }

    try {
      let date: Date

      // Se já é uma data ISO com horário
      if (dateTimeString.includes("T")) {
        date = new Date(dateTimeString)
      }
      // Se é formato brasileiro com horário dd/mm/yyyy hh:mm:ss
      else if (dateTimeString.includes("/") && dateTimeString.includes(":")) {
        const [datePart, timePart] = dateTimeString.split(" ")
        const [day, month, year] = datePart.split("/")
        const [hour, minute, second] = timePart.split(":")
        date = new Date(
          Number.parseInt(year),
          Number.parseInt(month) - 1,
          Number.parseInt(day),
          Number.parseInt(hour),
          Number.parseInt(minute),
          Number.parseInt(second || "0"),
        )
      }
      // Se é formato brasileiro apenas data dd/mm/yyyy
      else if (dateTimeString.includes("/")) {
        const [day, month, year] = dateTimeString.split("/")
        date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
      }
      // Se é formato ISO apenas data yyyy-mm-dd
      else if (dateTimeString.includes("-")) {
        date = new Date(dateTimeString)
      }
      // Outros formatos
      else {
        date = new Date(dateTimeString)
      }

      // Verifica se a data é válida
      if (isNaN(date.getTime())) {
        return "Nunca"
      }

      return date.toLocaleString("pt-BR")
    } catch (error) {
      console.log("Erro ao formatar data:", dateTimeString, error)
      return "Nunca"
    }
  }

  // Estatísticas dos orçamentos filtrados
  const stats = {
    total: filteredBudgets.length,
    pendentes: filteredBudgets.filter((b) => !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""))
      .length,
    fechados: filteredBudgets.filter((b) => b.status_atual === "pedido_fechado").length,
    perdidos: filteredBudgets.filter((b) => b.status_atual === "orcamento_perdido").length,
    urgentes: filteredBudgets.filter((b) => {
      const days = calculateDaysOpen(b.data)
      return days >= 3 && !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || "")
    }).length,
    valorTotal: filteredBudgets.reduce((sum, b) => sum + b.valor, 0),
    valorFechado: filteredBudgets
      .filter((b) => b.status_atual === "pedido_fechado")
      .reduce((sum, b) => sum + b.valor, 0),
    valorPendente: filteredBudgets
      .filter((b) => !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""))
      .reduce((sum, b) => sum + b.valor, 0),
    valorPerdido: filteredBudgets
      .filter((b) => b.status_atual === "orcamento_perdido")
      .reduce((sum, b) => sum + b.valor, 0),
  }

  const taxaFechamento = stats.total > 0 ? (stats.fechados / stats.total) * 100 : 0

  // Orçamentos por dia de follow-up
  const followupDays = {
    "D+1": filteredBudgets.filter(
      (b) => calculateDaysOpen(b.data) === 1 && !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""),
    ),
    "D+2": filteredBudgets.filter(
      (b) => calculateDaysOpen(b.data) === 2 && !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""),
    ),
    "D+3": filteredBudgets.filter(
      (b) => calculateDaysOpen(b.data) >= 3 && !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""),
    ),
  }

  // Top 5 orçamentos por valor (pendentes)
  const topBudgets = filteredBudgets
    .filter((b) => !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5)

  // Orçamentos urgentes
  const urgentBudgets = filteredBudgets
    .filter((b) => {
      const days = calculateDaysOpen(b.data)
      return days >= 3 && !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || "")
    })
    .slice(0, 6)

  // Orçamentos fechados e perdidos para os modais
  const closedBudgets = filteredBudgets.filter((b) => b.status_atual === "pedido_fechado")
  const lostBudgets = filteredBudgets.filter((b) => b.status_atual === "orcamento_perdido")

  // Performance por vendedor (apenas para admin)
  const vendedorPerformance =
    user?.tipo === "admin"
      ? vendedores
          .map((vendedor) => {
            const vendedorBudgets = budgets.filter((b) => b.codigo_vendedor === vendedor.codigo)
            const vendedorFechados = vendedorBudgets.filter((b) => b.status_atual === "pedido_fechado")
            const vendedorPerdidos = vendedorBudgets.filter((b) => b.status_atual === "orcamento_perdido")
            const vendedorPendentes = vendedorBudgets.filter(
              (b) => !["pedido_fechado", "orcamento_perdido"].includes(b.status_atual || ""),
            )
            const vendedorTaxa =
              vendedorBudgets.length > 0 ? (vendedorFechados.length / vendedorBudgets.length) * 100 : 0
            const valorTotal = vendedorBudgets.reduce((sum, b) => sum + b.valor, 0)
            const valorFechado = vendedorFechados.reduce((sum, b) => sum + b.valor, 0)

            // Último follow-up do vendedor
            const ultimosFollowups = vendedorBudgets
              .filter((b) => b.ultimo_followup && b.ultimo_followup !== "undefined" && b.ultimo_followup !== "null")
              .sort((a, b) => new Date(b.ultimo_followup || "").getTime() - new Date(a.ultimo_followup || "").getTime())
            const ultimoFollowup = ultimosFollowups[0]?.ultimo_followup

            return {
              ...vendedor,
              total: vendedorBudgets.length,
              fechados: vendedorFechados.length,
              perdidos: vendedorPerdidos.length,
              pendentes: vendedorPendentes.length,
              taxa: vendedorTaxa,
              valorTotal,
              valorFechado,
              ultimoFollowup,
            }
          })
          .sort((a, b) => b.valorFechado - a.valorFechado)
      : []

  return (
    <div className="space-y-6">
      {/* Header com filtros (apenas para admin) */}
      {user?.tipo === "admin" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros do Dashboard - Administrador
            </CardTitle>
            <CardDescription>Visualize dados de todos os vendedores ou filtre por vendedor específico</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-2">Vendedor</label>
                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione um vendedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">📊 Todos os Vendedores</SelectItem>
                    {vendedores.map((vendedor) => (
                      <SelectItem key={vendedor.codigo} value={vendedor.codigo}>
                        👤 {vendedor.nome} ({vendedor.codigo})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-600 mt-6">
                {selectedVendedor === "todos"
                  ? `Exibindo dados de ${vendedores.length} vendedores`
                  : `Exibindo dados do vendedor ${vendedores.find((v) => v.codigo === selectedVendedor)?.nome || selectedVendedor}`}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta de urgentes */}
      {stats.urgentes > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ Atenção: {stats.urgentes} orçamento{stats.urgentes > 1 ? "s" : ""} urgente
              {stats.urgentes > 1 ? "s" : ""}
            </CardTitle>
            <CardDescription className="text-red-700">
              Orçamentos com 3 ou mais dias em aberto precisam de follow-up imediato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {urgentBudgets.map((budget) => (
                <div key={budget.sequencia} className="bg-white p-3 rounded-lg border border-red-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{budget.cliente}</p>
                      <p className="text-xs text-gray-600">R$ {budget.valor.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-red-600 font-medium">
                        {calculateDaysOpen(budget.data)} dias em aberto
                      </p>
                      <p className="text-xs text-blue-600">{budget.nome_vendedor}</p>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">📅 Criado: {formatDate(budget.data)}</p>
                        <p className="text-xs text-orange-600">
                          🕒 Último follow-up: {formatDateTime(budget.ultimo_followup)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {budget.sequencia}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orçamentos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.pendentes} pendentes</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pipeline Total</p>
                <p className="text-2xl font-bold">R$ {(stats.valorTotal / 1000).toFixed(0)}k</p>
                <p className="text-xs text-gray-500 mt-1">R$ {(stats.valorPendente / 1000).toFixed(0)}k pendente</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa Fechamento</p>
                <p className="text-2xl font-bold text-purple-600">{taxaFechamento.toFixed(1)}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.fechados} de {stats.total}
                </p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgentes}</p>
                <p className="text-xs text-gray-500 mt-1">D+3 ou mais</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards de performance - CLICÁVEIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="bg-green-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowClosedModal(true)}
        >
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.fechados}</div>
            <div className="text-sm text-gray-600 mb-2">Orçamentos Fechados</div>
            <div className="text-lg font-semibold text-green-700">R$ {stats.valorFechado.toLocaleString("pt-BR")}</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-green-600">
              <Eye className="h-3 w-3" />
              Clique para ver detalhes
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-red-50 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowLostModal(true)}
        >
          <CardContent className="p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-red-600 mb-1">{stats.perdidos}</div>
            <div className="text-sm text-gray-600 mb-2">Orçamentos Perdidos</div>
            <div className="text-lg font-semibold text-red-700">R$ {stats.valorPerdido.toLocaleString("pt-BR")}</div>
            <div className="flex items-center justify-center gap-1 mt-2 text-xs text-red-600">
              <Eye className="h-3 w-3" />
              Clique para ver detalhes
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardContent className="p-6 text-center">
            <Clock className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.pendentes}</div>
            <div className="text-sm text-gray-600 mb-2">Aguardando Follow-up</div>
            <div className="text-lg font-semibold text-blue-700">R$ {stats.valorPendente.toLocaleString("pt-BR")}</div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-ups por dia */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(followupDays).map(([day, budgetsList]) => (
          <Card key={day} className={day === "D+3" ? "border-red-200 bg-red-50" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Follow-up {day}
                {day === "D+3" && budgetsList.length > 0 && (
                  <Badge variant="destructive" className="animate-pulse">
                    Urgente!
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{budgetsList.length} orçamentos para acompanhar</CardDescription>
            </CardHeader>
            <CardContent>
              {budgetsList.length > 0 ? (
                <div className="space-y-2">
                  {budgetsList.slice(0, 3).map((b) => (
                    <div
                      key={b.sequencia}
                      className={`p-2 rounded ${day === "D+3" ? "bg-red-100 border border-red-200" : "bg-gray-50"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {b.sequencia}
                        </Badge>
                        <Badge variant={day === "D+3" ? "destructive" : "secondary"} className="text-xs">
                          {day}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{b.cliente}</p>
                      <p className="text-xs text-gray-600">R$ {b.valor.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-blue-600">{b.nome_vendedor}</p>
                      <div className="mt-1 space-y-1">
                        <p className="text-xs text-gray-500">📅 {formatDate(b.data)}</p>
                        <p className="text-xs text-orange-600">🕒 Último: {formatDateTime(b.ultimo_followup)}</p>
                      </div>
                    </div>
                  ))}
                  {budgetsList.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">E mais {budgetsList.length - 3} orçamentos...</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum orçamento para follow-up</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance por vendedor ou resultados pessoais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Maiores Orçamentos Pendentes
            </CardTitle>
            <CardDescription>
              Top 5 por valor{selectedVendedor !== "todos" ? " - Vendedor selecionado" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topBudgets.length > 0 ? (
              <div className="space-y-3">
                {topBudgets.map((budget, index) => (
                  <div key={budget.sequencia} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{budget.cliente}</p>
                        <p className="text-xs text-gray-600">
                          {budget.sequencia} - {budget.nome_vendedor}
                        </p>
                        <div className="mt-1">
                          <p className="text-xs text-gray-500">📅 {formatDate(budget.data)}</p>
                          <p className="text-xs text-orange-600">🕒 {formatDateTime(budget.ultimo_followup)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">R$ {budget.valor.toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-gray-500">{calculateDaysOpen(budget.data)} dias</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum orçamento pendente</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {user?.tipo === "admin" ? "Performance dos Vendedores" : "Meus Resultados"}
            </CardTitle>
            <CardDescription>
              {user?.tipo === "admin"
                ? `Ranking de ${selectedVendedor === "todos" ? "todos os vendedores" : "vendedor selecionado"}`
                : "Resumo da sua performance"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user?.tipo === "admin" ? (
              <ScrollArea className="h-80">
                <div className="space-y-3">
                  {(selectedVendedor === "todos"
                    ? vendedorPerformance
                    : vendedorPerformance.filter((v) => v.codigo === selectedVendedor)
                  ).map((vendedor, index) => (
                    <div key={vendedor.codigo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-sm font-bold text-purple-600">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{vendedor.nome}</p>
                          <p className="text-xs text-gray-600">Código: {vendedor.codigo}</p>
                          <div className="mt-1">
                            <p className="text-xs text-green-600">{vendedor.taxa.toFixed(1)}% fechamento</p>
                            <p className="text-xs text-orange-600">
                              🕒 Último: {formatDateTime(vendedor.ultimoFollowup)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{vendedor.total} orçamentos</p>
                        <p className="text-xs text-green-600">
                          R$ {(vendedor.valorFechado / 1000).toFixed(0)}k fechado
                        </p>
                        <p className="text-xs text-gray-500">
                          ✅ {vendedor.fechados} | ❌ {vendedor.perdidos} | ⏳ {vendedor.pendentes}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    <p className="text-sm text-gray-600">Meus Orçamentos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{taxaFechamento.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Taxa Fechamento</p>
                  </div>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="text-center">
                    <p className="text-lg font-semibold">R$ {stats.valorFechado.toLocaleString("pt-BR")}</p>
                    <p className="text-sm text-gray-600">Valor Total Fechado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-orange-600">
                      🕒 Último follow-up:{" "}
                      {formatDateTime(
                        filteredBudgets
                          .filter(
                            (b) =>
                              b.ultimo_followup && b.ultimo_followup !== "undefined" && b.ultimo_followup !== "null",
                          )
                          .sort(
                            (a, b) =>
                              new Date(b.ultimo_followup || "").getTime() - new Date(a.ultimo_followup || "").getTime(),
                          )[0]?.ultimo_followup,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Orçamentos Fechados */}
      <Dialog open={showClosedModal} onOpenChange={setShowClosedModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Orçamentos Fechados ({closedBudgets.length})
            </DialogTitle>
            <DialogDescription>Relatório detalhado dos orçamentos fechados com sucesso</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {closedBudgets.map((budget) => (
                <div key={budget.sequencia} className="border rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{budget.cliente}</h3>
                      <p className="text-sm text-gray-600">
                        #{budget.sequencia} - {formatDate(budget.data)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-lg">R$ {budget.valor.toLocaleString("pt-BR")}</p>
                      <Badge className="bg-green-100 text-green-800">Fechado</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Vendedor:</strong> {budget.nome_vendedor}
                      </p>
                      <p>
                        <strong>Código:</strong> {budget.codigo_vendedor}
                      </p>
                      <p>
                        <strong>Dias para fechar:</strong> {calculateDaysOpen(budget.data)} dias
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Email:</strong> {budget.email_cliente || "Não informado"}
                      </p>
                      <p>
                        <strong>Telefone:</strong> {budget.telefone_cliente || "Não informado"}
                      </p>
                      <p>
                        <strong>Data do fechamento:</strong> {formatDateTime(budget.ultimo_followup)}
                      </p>
                    </div>
                  </div>
                  {budget.observacoes_atuais && (
                    <div className="mt-3 p-3 bg-white rounded border-l-4 border-green-500">
                      <p className="text-sm">
                        <strong>Observações do fechamento:</strong>
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{budget.observacoes_atuais}</p>
                    </div>
                  )}
                </div>
              ))}
              {closedBudgets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum orçamento fechado encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal de Orçamentos Perdidos */}
      <Dialog open={showLostModal} onOpenChange={setShowLostModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Orçamentos Perdidos ({lostBudgets.length})
            </DialogTitle>
            <DialogDescription>Relatório detalhado dos orçamentos perdidos com motivos</DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96">
            <div className="space-y-3">
              {lostBudgets.map((budget) => (
                <div key={budget.sequencia} className="border rounded-lg p-4 bg-red-50">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{budget.cliente}</h3>
                      <p className="text-sm text-gray-600">
                        #{budget.sequencia} - {formatDate(budget.data)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600 text-lg">R$ {budget.valor.toLocaleString("pt-BR")}</p>
                      <Badge className="bg-red-100 text-red-800">Perdido</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p>
                        <strong>Vendedor:</strong> {budget.nome_vendedor}
                      </p>
                      <p>
                        <strong>Código:</strong> {budget.codigo_vendedor}
                      </p>
                      <p>
                        <strong>Dias até perder:</strong> {calculateDaysOpen(budget.data)} dias
                      </p>
                    </div>
                    <div>
                      <p>
                        <strong>Email:</strong> {budget.email_cliente || "Não informado"}
                      </p>
                      <p>
                        <strong>Telefone:</strong> {budget.telefone_cliente || "Não informado"}
                      </p>
                      <p>
                        <strong>Data da perda:</strong> {formatDateTime(budget.ultimo_followup)}
                      </p>
                    </div>
                  </div>
                  {budget.observacoes_atuais && (
                    <div className="mt-3 p-3 bg-white rounded border-l-4 border-red-500">
                      <p className="text-sm">
                        <strong>Motivo da perda:</strong>
                      </p>
                      <p className="text-sm text-gray-700 mt-1">{budget.observacoes_atuais}</p>
                    </div>
                  )}
                </div>
              ))}
              {lostBudgets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Nenhum orçamento perdido encontrado</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Mensagem se não há dados */}
      {filteredBudgets.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-600 mb-4">
              {user?.tipo === "admin"
                ? selectedVendedor === "todos"
                  ? "Não há orçamentos cadastrados no sistema."
                  : `Não foram encontrados orçamentos para o vendedor selecionado.`
                : `Não foram encontrados orçamentos para o vendedor ${user?.codigo}.`}
            </p>
            <p className="text-sm text-gray-500">
              Verifique se a planilha está configurada corretamente e contém dados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
