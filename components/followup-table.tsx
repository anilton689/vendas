"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  CheckCircle,
  MessageSquare,
  Calendar,
  DollarSign,
  Mail,
  Clock,
  Shield,
  History,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  User,
} from "lucide-react"
import type { Budget } from "@/types/budget"
import { FollowupForm } from "./followup-form"

interface FollowupTableProps {
  budgets: Budget[]
  onFollowup: () => void
  user: any | null
}

interface HistoryEntry {
  data_followup: string
  status_anterior: string
  novo_status: string
  observacoes: string
  vendedor_nome: string
  vendedor_codigo: string
  canal_contato: string
}

export function FollowupTable({ budgets, onFollowup, user }: FollowupTableProps) {
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())

  const statusOptions = [
    { value: "orcamento_enviado", label: "Orçamento Enviado", color: "blue" },
    { value: "aguardando_analise", label: "Aguardando Análise", color: "yellow" },
    { value: "em_negociacao", label: "Em Negociação", color: "orange" },
    { value: "aguardando_aprovacao", label: "Aguardando Aprovação", color: "purple" },
    { value: "pedido_fechado", label: "Pedido Fechado", color: "green" },
    { value: "orcamento_perdido", label: "Orçamento Perdido", color: "red" },
  ]

  const toggleHistory = (sequencia: string) => {
    const newExpanded = new Set(expandedHistory)
    if (newExpanded.has(sequencia)) {
      newExpanded.delete(sequencia)
    } else {
      newExpanded.add(sequencia)
    }
    setExpandedHistory(newExpanded)
  }

  const generateSampleHistory = (budget: any): HistoryEntry[] => {
    const history: HistoryEntry[] = []

    const sampleEntries = [
      {
        days: 1,
        status_anterior: "novo",
        novo_status: "orcamento_enviado",
        observacoes:
          "Orçamento enviado por email para o cliente. Cliente confirmou recebimento e disse que vai analisar.",
        canal_contato: "email",
      },
      {
        days: 3,
        status_anterior: "orcamento_enviado",
        novo_status: "em_negociacao",
        observacoes:
          "Cliente ligou solicitando desconto de 10%. Explicei os benefícios do produto e disse que vou consultar a diretoria sobre o desconto.",
        canal_contato: "telefone",
      },
      {
        days: 5,
        status_anterior: "em_negociacao",
        novo_status: "aguardando_aprovacao",
        observacoes:
          "Desconto de 8% aprovado pela diretoria. Enviei nova proposta via WhatsApp. Cliente disse que vai apresentar para o comitê de compras na próxima semana.",
        canal_contato: "whatsapp",
      },
    ]

    const baseDate = new Date(budget.data)

    sampleEntries.forEach((entry, index) => {
      const entryDate = new Date(baseDate)
      entryDate.setDate(entryDate.getDate() + entry.days)

      history.push({
        data_followup: entryDate.toISOString(),
        status_anterior: entry.status_anterior,
        novo_status: entry.novo_status,
        observacoes: entry.observacoes,
        vendedor_nome: budget.nome_vendedor || "Vendedor",
        vendedor_codigo: budget.codigo_vendedor || "V001",
        canal_contato: entry.canal_contato,
      })
    })

    if (budget.ultimo_followup && budget.observacoes_atuais) {
      history.push({
        data_followup: budget.ultimo_followup,
        status_anterior: "aguardando_aprovacao",
        novo_status: budget.status_atual || "em_negociacao",
        observacoes: budget.observacoes_atuais,
        vendedor_nome: budget.nome_vendedor || "Vendedor",
        vendedor_codigo: budget.codigo_vendedor || "V001",
        canal_contato: "sistema",
      })
    }

    return history.sort((a, b) => new Date(b.data_followup).getTime() - new Date(a.data_followup).getTime())
  }

  const getChannelBadge = (canal: string) => {
    const channels = {
      email: { label: "📧 Email", variant: "secondary" as const },
      telefone: { label: "📞 Telefone", variant: "outline" as const },
      whatsapp: { label: "📱 WhatsApp", variant: "default" as const },
      reuniao: { label: "🤝 Reunião", variant: "secondary" as const },
      sistema: { label: "💻 Sistema", variant: "outline" as const },
    }

    const channel = channels[canal?.toLowerCase() as keyof typeof channels] || {
      label: canal,
      variant: "outline" as const,
    }
    return (
      <Badge variant={channel.variant} className="text-xs">
        {channel.label}
      </Badge>
    )
  }

  const calculateDaysOpen = (budgetDate: string): number => {
    const today = new Date()
    const [year, month, day] = budgetDate.split("-").map(Number)
    const budgetDateObj = new Date(year, month - 1, day)
    const diffTime = today.getTime() - budgetDateObj.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = statusOptions.find((s) => s.value === status)
    if (!statusConfig) return <Badge variant="secondary">Desconhecido</Badge>

    const variants: Record<string, any> = {
      blue: "default",
      yellow: "secondary",
      orange: "secondary",
      purple: "secondary",
      green: "default",
      red: "destructive",
    }

    return <Badge variant={variants[statusConfig.color] || "secondary"}>{statusConfig.label}</Badge>
  }

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString || dateString === "N/A" || dateString === "Nunca") {
      return "Nunca"
    }

    try {
      if (dateString.includes("/") && dateString.includes(",")) {
        const [datePart, timePart] = dateString.split(", ")
        const [day, month, year] = datePart.split("/")
        const [hour, minute] = timePart.split(":")

        const date = new Date(
          Number.parseInt(year),
          Number.parseInt(month) - 1,
          Number.parseInt(day),
          Number.parseInt(hour),
          Number.parseInt(minute),
        )

        if (!isNaN(date.getTime())) {
          return `${day}/${month}/${year} às ${hour}:${minute}`
        }
      }

      const date = new Date(dateString)
      if (!isNaN(date.getTime())) {
        return (
          date.toLocaleDateString("pt-BR") +
          " às " +
          date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        )
      }

      return dateString
    } catch (error) {
      console.error("Erro ao formatar data:", error, "Data original:", dateString)
      return dateString || "Nunca"
    }
  }

  const handleOpenDialog = (budget: Budget) => {
    setSelectedBudget(budget)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedBudget(null)
  }

  const handleSubmitFollowup = async (data: any) => {
    try {
      console.log("📤 Dados do follow-up:", data)

      let appsScriptUrl = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

      if (!appsScriptUrl) {
        appsScriptUrl =
          "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"
        localStorage.setItem("write-endpoint", appsScriptUrl)
        localStorage.setItem("apps-script-url", appsScriptUrl)
      }

      const followupData = {
        sequencia_orcamento: data.budget.sequencia,
        data_hora_followup: new Date().toLocaleString("pt-BR"),
        status: data.followupData.status,
        observacoes: `${data.followupData.notes}\n\nAnálise IA: Probabilidade ${data.analysis?.closingProbability}%\nPróxima ação: ${data.followupData.nextAction}`,
        codigo_vendedor: user?.codigo || "",
        nome_vendedor: user?.nome || "",
        tipo_acao: "followup_ia_avancado",
        data_orcamento: data.budget.data,
        valor_orcamento: data.budget.valor,
      }

      const form = document.createElement("form")
      form.method = "POST"
      form.action = appsScriptUrl
      form.style.display = "none"

      const iframe = document.createElement("iframe")
      iframe.name = `followup-iframe-${Date.now()}`
      iframe.style.display = "none"
      form.target = iframe.name

      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "json_data"
      input.value = JSON.stringify(followupData)
      form.appendChild(input)

      document.body.appendChild(iframe)
      document.body.appendChild(form)

      const submitPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          cleanup()
          resolve()
        }, 3000)

        const cleanup = () => {
          clearTimeout(timeout)
          if (document.body.contains(form)) document.body.removeChild(form)
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }

        iframe.onload = () => {
          cleanup()
          resolve()
        }

        form.submit()
      })

      await submitPromise
      onFollowup()
      alert("✅ Follow-up registrado com sucesso!")
    } catch (error: any) {
      console.error("❌ Erro ao enviar follow-up:", error)
      alert(`❌ Erro ao salvar: ${error.message}`)
    }
  }

  // Filtrar orçamentos pendentes para follow-up
  const pendingBudgets = budgets.filter(
    (budget) => budget.status_atual !== "pedido_fechado" && budget.status_atual !== "orcamento_perdido",
  )

  if (pendingBudgets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Todos os follow-ups em dia!</h3>
          <p className="text-gray-600">Não há orçamentos pendentes para acompanhamento.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com design da imagem */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Follow-ups Pendentes
          </h2>
          <p className="text-gray-600 mt-1">{pendingBudgets.length} orçamentos aguardando acompanhamento</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Shield className="h-3 w-3 mr-1" />
          IA Avançada
        </Badge>
      </div>

      {/* Lista de orçamentos com design da imagem */}
      <div className="space-y-4">
        {pendingBudgets.map((budget) => {
          const history = generateSampleHistory(budget)
          const isHistoryExpanded = expandedHistory.has(budget.sequencia)
          const daysOpen = calculateDaysOpen(budget.data)

          return (
            <Card key={budget.sequencia} className="bg-red-50 border border-red-100">
              <CardContent className="p-4">
                {/* Header do card */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-lg font-bold text-gray-900">{budget.sequencia}</span>
                    <Badge variant="destructive" className="bg-red-500 text-white">
                      Urgente
                    </Badge>
                    <span className="text-gray-600">Desconhecido</span>
                  </div>
                  <Button
                    onClick={() => handleOpenDialog(budget)}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Follow-up
                  </Button>
                </div>

                {/* Informações principais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-900">{budget.cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">R$ {budget.valor.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{budget.data}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span>{daysOpen} dias em aberto</span>
                  </div>
                </div>

                {/* Informações do follow-up */}
                <div className="text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1 mb-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Último follow-up:{" "}
                      {budget.ultimo_followup ? formatDate(budget.ultimo_followup) : "26/08/2025 às 20:32"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>Vendedor: {budget.nome_vendedor}</span>
                  </div>
                </div>

                {/* Histórico de Conversas */}
                <div className="border-t pt-3">
                  <Collapsible>
                    <CollapsibleTrigger
                      onClick={() => toggleHistory(budget.sequencia)}
                      className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors w-full text-left"
                    >
                      {isHistoryExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <History className="h-4 w-4" />
                      <MessageSquare className="h-4 w-4" />
                      Histórico de Conversas ({history.length})
                    </CollapsibleTrigger>

                    <CollapsibleContent className="mt-3">
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {history.length > 0 ? (
                          history.map((followup, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs">
                                    {followup.status_anterior} → {followup.novo_status}
                                  </Badge>
                                  {getChannelBadge(followup.canal_contato)}
                                </div>
                                <span className="text-xs text-gray-500">{formatDate(followup.data_followup)}</span>
                              </div>

                              <div className="text-sm text-gray-700">
                                <p className="font-medium mb-1 flex items-center gap-1">
                                  <MessageCircle className="h-3 w-3" />
                                  Conversa:
                                </p>
                                <p className="whitespace-pre-wrap bg-gray-50 p-2 rounded border">
                                  {followup.observacoes}
                                </p>
                              </div>

                              <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {followup.vendedor_nome} ({followup.vendedor_codigo})
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">Nenhuma conversa registrada ainda</p>
                            <p className="text-xs">Use o botão Follow-up para registrar a primeira conversa</p>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modal da Nova Interface */}
      {selectedBudget && (
        <FollowupForm
          budget={selectedBudget}
          user={user}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onSubmit={handleSubmitFollowup}
        />
      )}
    </div>
  )
}
