"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart3,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Search,
  FileSpreadsheet,
} from "lucide-react"

import type { Budget } from "@/types/budget"

interface ReportsDashboardProps {
  budgets: Budget[]
}

export function ReportsDashboard({ budgets }: ReportsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [periodFilter, setPeriodFilter] = useState("all")

  // Filtros
  const filteredBudgets = useMemo(() => {
    let filtered = [...budgets]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(
        (budget) =>
          budget.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.nome_vendedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
          budget.sequencia.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por status
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        filtered = filtered.filter(
          (budget) => budget.status_atual !== "pedido_fechado" && budget.status_atual !== "orcamento_perdido",
        )
      } else if (statusFilter === "finalized") {
        filtered = filtered.filter(
          (budget) => budget.status_atual === "pedido_fechado" || budget.status_atual === "orcamento_perdido",
        )
      } else {
        filtered = filtered.filter((budget) => budget.status_atual === statusFilter)
      }
    }

    // Filtro por período
    if (periodFilter !== "all") {
      const today = new Date()
      const days = periodFilter === "30" ? 30 : periodFilter === "90" ? 90 : 365
      const cutoffDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)

      filtered = filtered.filter((budget) => {
        const budgetDate = new Date(budget.data)
        return budgetDate >= cutoffDate
      })
    }

    return filtered
  }, [budgets, searchTerm, statusFilter, periodFilter])

  // Métricas calculadas
  const metrics = useMemo(() => {
    const total = filteredBudgets.length
    const totalValue = filteredBudgets.reduce((sum, b) => sum + b.valor, 0)

    const closed = filteredBudgets.filter((b) => b.status_atual === "pedido_fechado")
    const lost = filteredBudgets.filter((b) => b.status_atual === "orcamento_perdido")
    const pending = filteredBudgets.filter(
      (b) => b.status_atual !== "pedido_fechado" && b.status_atual !== "orcamento_perdido",
    )

    const closedValue = closed.reduce((sum, b) => sum + b.valor, 0)
    const lostValue = lost.reduce((sum, b) => sum + b.valor, 0)
    const pendingValue = pending.reduce((sum, b) => sum + b.valor, 0)

    const finalized = closed.length + lost.length
    const closureRate = finalized > 0 ? (closed.length / finalized) * 100 : 0

    // Análise por vendedor
    const salespeople = [...new Set(filteredBudgets.map((b) => b.nome_vendedor))]
    const salesStats = salespeople
      .map((name) => {
        const vendorBudgets = filteredBudgets.filter((b) => b.nome_vendedor === name)
        const vendorClosed = vendorBudgets.filter((b) => b.status_atual === "pedido_fechado")
        const vendorTotal = vendorBudgets.reduce((sum, b) => sum + b.valor, 0)
        const vendorClosedValue = vendorClosed.reduce((sum, b) => sum + b.valor, 0)
        const vendorFinalized = vendorBudgets.filter(
          (b) => b.status_atual === "pedido_fechado" || b.status_atual === "orcamento_perdido",
        ).length

        return {
          nome: name,
          total: vendorBudgets.length,
          totalValue: vendorTotal,
          closed: vendorClosed.length,
          closedValue: vendorClosedValue,
          closureRate: vendorFinalized > 0 ? (vendorClosed.length / vendorFinalized) * 100 : 0,
        }
      })
      .sort((a, b) => b.closedValue - a.closedValue)

    return {
      total,
      totalValue,
      closed: closed.length,
      closedValue,
      lost: lost.length,
      lostValue,
      pending: pending.length,
      pendingValue,
      closureRate,
      salesStats,
    }
  }, [filteredBudgets])

  const exportToCSV = () => {
    const headers = [
      "Data",
      "Sequência",
      "Cliente",
      "Valor",
      "Vendedor",
      "Status",
      "Email",
      "Telefone",
      "Dias Follow-up",
      "Último Follow-up",
      "Observações",
    ]

    const csvContent = [
      headers.join(","),
      ...filteredBudgets.map((budget) =>
        [
          budget.data,
          budget.sequencia,
          `"${budget.cliente}"`,
          budget.valor,
          `"${budget.nome_vendedor}"`,
          budget.status_atual || "",
          budget.email_cliente,
          budget.telefone_cliente,
          budget.dias_followup || "",
          budget.ultimo_followup || "",
          `"${(budget.observacoes_atuais || "").replace(/"/g, '""')}"`,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `relatorio-orcamentos-${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pedido_fechado":
        return "bg-green-100 text-green-800"
      case "orcamento_perdido":
        return "bg-red-100 text-red-800"
      case "em_negociacao":
        return "bg-purple-100 text-purple-800"
      case "aguardando_aprovacao":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-blue-100 text-blue-800"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pedido_fechado":
        return "✅ Fechado"
      case "orcamento_perdido":
        return "❌ Perdido"
      case "em_negociacao":
        return "💬 Negociação"
      case "aguardando_aprovacao":
        return "⏳ Aprovação"
      case "aguardando_analise":
        return "🔍 Análise"
      default:
        return "📤 Enviado"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios Avançados
          </CardTitle>
          <CardDescription>Análise completa de performance e resultados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente, vendedor..."
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="finalized">Finalizados</option>
                <option value="pedido_fechado">Fechados</option>
                <option value="orcamento_perdido">Perdidos</option>
                <option value="em_negociacao">Em Negociação</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Período</label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="365">Último ano</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="w-full bg-transparent">
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="salespeople">👥 Por Vendedor</TabsTrigger>
          <TabsTrigger value="details">📋 Detalhado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Cards de métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orçamentos</p>
                    <p className="text-2xl font-bold">{metrics.total}</p>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold">R$ {(metrics.totalValue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-gray-500">R$ {metrics.totalValue.toLocaleString("pt-BR")}</p>
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
                    <p className="text-2xl font-bold text-purple-600">{metrics.closureRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">
                      {metrics.closed} de {metrics.closed + metrics.lost}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Faturamento</p>
                    <p className="text-2xl font-bold text-green-600">R$ {(metrics.closedValue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-gray-500">{metrics.closed} orçamentos fechados</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Breakdown detalhado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-green-50">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-green-600 mb-1">{metrics.closed}</div>
                <div className="text-sm text-gray-600 mb-2">Orçamentos Fechados</div>
                <div className="text-lg font-semibold text-green-700">
                  R$ {metrics.closedValue.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {((metrics.closed / metrics.total) * 100).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>

            <Card className="bg-red-50">
              <CardContent className="p-6 text-center">
                <TrendingDown className="h-12 w-12 text-red-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-red-600 mb-1">{metrics.lost}</div>
                <div className="text-sm text-gray-600 mb-2">Orçamentos Perdidos</div>
                <div className="text-lg font-semibold text-red-700">R$ {metrics.lostValue.toLocaleString("pt-BR")}</div>
                <div className="text-xs text-gray-600 mt-2">
                  {((metrics.lost / metrics.total) * 100).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50">
              <CardContent className="p-6 text-center">
                <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                <div className="text-3xl font-bold text-blue-600 mb-1">{metrics.pending}</div>
                <div className="text-sm text-gray-600 mb-2">Pendentes</div>
                <div className="text-lg font-semibold text-blue-700">
                  R$ {metrics.pendingValue.toLocaleString("pt-BR")}
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  {((metrics.pending / metrics.total) * 100).toFixed(1)}% do total
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="salespeople" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Ranking de Vendedores
              </CardTitle>
              <CardDescription>Performance individual por faturamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.salesStats.map((salesperson, index) => (
                  <div key={salesperson.nome} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-800">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">{salesperson.nome}</h3>
                        <p className="text-sm text-gray-600">
                          {salesperson.total} orçamentos • {salesperson.closed} fechados
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">R$ {salesperson.closedValue.toLocaleString("pt-BR")}</p>
                      <p className="text-sm text-gray-600">{salesperson.closureRate.toFixed(1)}% taxa fechamento</p>
                    </div>
                  </div>
                ))}
                {metrics.salesStats.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum vendedor encontrado nos filtros selecionados</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Lista Detalhada ({filteredBudgets.length})
              </CardTitle>
              <CardDescription>Todos os orçamentos com informações completas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium">Cliente</th>
                      <th className="text-left p-2 font-medium">Valor</th>
                      <th className="text-left p-2 font-medium">Vendedor</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Data</th>
                      <th className="text-left p-2 font-medium">Follow-up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.slice(0, 50).map((budget) => (
                      <tr key={budget.sequencia} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{budget.cliente}</p>
                            <p className="text-xs text-gray-500">#{budget.sequencia}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <p className="font-semibold">R$ {budget.valor.toLocaleString("pt-BR")}</p>
                        </td>
                        <td className="p-2">
                          <p>{budget.nome_vendedor}</p>
                          <p className="text-xs text-gray-500">{budget.codigo_vendedor}</p>
                        </td>
                        <td className="p-2">
                          <Badge className={getStatusColor(budget.status_atual || "")}>
                            {getStatusLabel(budget.status_atual || "")}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <p>{budget.data}</p>
                        </td>
                        <td className="p-2">
                          <Badge variant={budget.dias_followup === "D+3" ? "destructive" : "secondary"}>
                            {budget.dias_followup}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredBudgets.length > 50 && (
                  <div className="text-center py-4 text-gray-500">
                    Mostrando 50 de {filteredBudgets.length} orçamentos. Use o filtro para refinar.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
