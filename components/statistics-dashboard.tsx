import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { TrendingUp, TrendingDown, Target, Calendar, DollarSign, Users, CheckCircle, XCircle, Clock, Phone } from 'lucide-react'

interface Budget {
  id: string
  data: string
  sequencia: string
  cliente: string
  valor: number
  status: "aguardando" | "fechado" | "perdido" | "negociando" | "nao_atendeu"
  observacoes: string
  followUpDay: number
  lastFollowUp?: string
  createdAt?: string
  updatedAt?: string
}

interface StatisticsDashboardProps {
  budgets: Budget[]
  historicalData: Budget[]
}

export function StatisticsDashboard({ budgets, historicalData }: StatisticsDashboardProps) {
  // Estatísticas gerais
  const totalBudgets = historicalData.length
  const totalValue = historicalData.reduce((sum, budget) => sum + budget.valor, 0)
  
  // Estatísticas por status
  const closedBudgets = historicalData.filter(b => b.status === "fechado")
  const lostBudgets = historicalData.filter(b => b.status === "perdido")
  const negotiatingBudgets = historicalData.filter(b => b.status === "negociando")
  const waitingBudgets = historicalData.filter(b => b.status === "aguardando")
  const noAnswerBudgets = historicalData.filter(b => b.status === "nao_atendeu")

  // Valores por status
  const closedValue = closedBudgets.reduce((sum, budget) => sum + budget.valor, 0)
  const lostValue = lostBudgets.reduce((sum, budget) => sum + budget.valor, 0)
  const negotiatingValue = negotiatingBudgets.reduce((sum, budget) => sum + budget.valor, 0)
  const waitingValue = waitingBudgets.reduce((sum, budget) => sum + budget.valor, 0)

  // Taxa de conversão
  const conversionRate = totalBudgets > 0 ? (closedBudgets.length / totalBudgets) * 100 : 0
  const lossRate = totalBudgets > 0 ? (lostBudgets.length / totalBudgets) * 100 : 0

  // Ticket médio
  const averageTicket = closedBudgets.length > 0 ? closedValue / closedBudgets.length : 0

  // Estatísticas mensais (últimos 30 dias)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const recentBudgets = historicalData.filter(budget => 
    new Date(budget.data) >= thirtyDaysAgo
  )
  const recentClosed = recentBudgets.filter(b => b.status === "fechado")
  const monthlyValue = recentClosed.reduce((sum, budget) => sum + budget.valor, 0)

  // Top clientes
  const clientStats = historicalData.reduce((acc, budget) => {
    if (!acc[budget.cliente]) {
      acc[budget.cliente] = { count: 0, value: 0, closed: 0 }
    }
    acc[budget.cliente].count++
    acc[budget.cliente].value += budget.valor
    if (budget.status === "fechado") {
      acc[budget.cliente].closed++
    }
    return acc
  }, {} as Record<string, { count: number, value: number, closed: number }>)

  const topClients = Object.entries(clientStats)
    .sort(([,a], [,b]) => b.value - a.value)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conversão</p>
                <p className="text-2xl font-bold text-green-600">{conversionRate.toFixed(1)}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={conversionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {averageTicket.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Faturamento (30d)</p>
                <p className="text-2xl font-bold text-green-600">R$ {monthlyValue.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Perda</p>
                <p className="text-2xl font-bold text-red-600">{lossRate.toFixed(1)}%</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <Progress value={lossRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Quantidade e valor dos orçamentos por status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Fechados</p>
                  <p className="text-sm text-gray-600">{closedBudgets.length} orçamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">R$ {closedValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((closedBudgets.length / totalBudgets) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium">Perdidos</p>
                  <p className="text-sm text-gray-600">{lostBudgets.length} orçamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-red-600">R$ {lostValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((lostBudgets.length / totalBudgets) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Negociando</p>
                  <p className="text-sm text-gray-600">{negotiatingBudgets.length} orçamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600">R$ {negotiatingValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((negotiatingBudgets.length / totalBudgets) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Aguardando</p>
                  <p className="text-sm text-gray-600">{waitingBudgets.length} orçamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-yellow-600">R$ {waitingValue.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((waitingBudgets.length / totalBudgets) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium">Não Atendeu</p>
                  <p className="text-sm text-gray-600">{noAnswerBudgets.length} orçamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-600">R$ {(noAnswerBudgets.reduce((sum, b) => sum + b.valor, 0)).toLocaleString()}</p>
                <p className="text-sm text-gray-600">{((noAnswerBudgets.length / totalBudgets) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Clientes</CardTitle>
            <CardDescription>Clientes com maior valor em orçamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topClients.map(([cliente, stats], index) => (
              <div key={cliente} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium truncate max-w-[200px]">{cliente}</p>
                    <p className="text-sm text-gray-600">{stats.count} orçamentos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">R$ {stats.value.toLocaleString()}</p>
                  <Badge variant={stats.closed > 0 ? "default" : "secondary"}>
                    {stats.closed} fechados
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Resumo Temporal */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Últimos 30 Dias</CardTitle>
          <CardDescription>Performance recente do pipeline de vendas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{recentBudgets.length}</p>
              <p className="text-sm text-gray-600">Orçamentos Criados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{recentClosed.length}</p>
              <p className="text-sm text-gray-600">Orçamentos Fechados</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">R$ {monthlyValue.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Faturamento</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {recentBudgets.length > 0 ? ((recentClosed.length / recentBudgets.length) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
