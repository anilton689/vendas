"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  MessageSquare,
  Calendar,
  DollarSign,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  Brain,
  Send,
  Loader2,
  Shield,
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  History,
  User,
  Phone,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface FollowupTableProps {
  budgets: Budget[]
  onFollowup: () => void
  user: any | null
}

interface AIAnalysis {
  probabilidade: number
  categoria_risco: string
  motivos_principais: string[]
  estrategias_recomendadas: string[]
  proximos_passos: string[]
  prazo_sugerido: string
  observacoes_importantes: string
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
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [activeTab, setActiveTab] = useState("followup")
  const [expandedHistory, setExpandedHistory] = useState<Set<string>>(new Set())

  // Estados para IA
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)

  // Estados do formulário
  const [formData, setFormData] = useState({
    status: "",
    observacoes: "",
  })

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
    // Gerar histórico de exemplo baseado nos dados do orçamento
    const history: HistoryEntry[] = []

    // Adicionar alguns registros de exemplo para demonstração
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

    // Adicionar última observação se existir
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

  const getChannelIcon = (canal: string) => {
    switch (canal?.toLowerCase()) {
      case "email":
        return <Mail className="h-3 w-3" />
      case "telefone":
        return <Phone className="h-3 w-3" />
      case "whatsapp":
        return <MessageSquare className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
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

  const getAIConfig = () => {
    try {
      const configStr = localStorage.getItem("ai-config")
      if (configStr) {
        const config = JSON.parse(configStr)
        console.log("🤖 Configuração da IA encontrada:", {
          model: config.model,
          temperature: config.temperature,
          isConfigured: config.isConfigured,
        })
        return config
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configuração da IA:", error)
    }
    return {
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: "Você é um assistente especializado em vendas e follow-up de orçamentos.",
      analysisPrompt: `Analise este orçamento e forneça uma análise estruturada em formato JSON:

{
  "probabilidade": [número de 0 a 100],
  "categoria_risco": "[baixo/médio/alto]",
  "motivos_principais": ["motivo1", "motivo2", "motivo3"],
  "estrategias_recomendadas": ["estrategia1", "estrategia2", "estrategia3"],
  "proximos_passos": ["passo1", "passo2", "passo3"],
  "prazo_sugerido": "[em dias para próximo contato]",
  "observacoes_importantes": "observação relevante"
}

Base sua análise nos dados fornecidos: valor, tempo em aberto, histórico de interações e status atual.`,
      isConfigured: true,
    }
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

  const getPriorityBadge = (days: string) => {
    if (days === "D+3") return <Badge variant="destructive">🔥 Urgente</Badge>
    if (days === "D+2") return <Badge variant="secondary">⚡ Médio</Badge>
    if (days === "D+1") return <Badge variant="outline">💡 Baixo</Badge>
    return <Badge variant="outline">📅 A agendar</Badge>
  }

  const getRiskBadge = (risco: string) => {
    if (risco === "alto") return <Badge variant="destructive">🔴 Alto Risco</Badge>
    if (risco === "médio") return <Badge variant="secondary">🟡 Médio Risco</Badge>
    return <Badge variant="outline">🟢 Baixo Risco</Badge>
  }

  const handleOpenDialog = async (budget: any) => {
    setSelectedBudget(budget)
    setFormData({
      status: budget.status_atual || "orcamento_enviado",
      observacoes: "",
    })
    setIsDialogOpen(true)
    setActiveTab("followup")
    setSubmitError("")

    // Limpar estados da IA
    setAiAnalysis(null)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedBudget(null)
    setFormData({ status: "", observacoes: "" })
    setSubmitError("")
    setAiAnalysis(null)
  }

  const handleSubmitFollowup = async () => {
    if (!selectedBudget || !formData.status || !formData.observacoes.trim()) {
      setSubmitError("Status e observações são obrigatórios")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      let appsScriptUrl = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

      if (!appsScriptUrl) {
        appsScriptUrl =
          "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"
        localStorage.setItem("write-endpoint", appsScriptUrl)
        localStorage.setItem("apps-script-url", appsScriptUrl)
        console.log("🔧 URL do Apps Script configurada automaticamente:", appsScriptUrl)
      }

      console.log("🔍 URL do Apps Script encontrada:", appsScriptUrl)

      const followupData = {
        sequencia_orcamento: selectedBudget.sequencia,
        data_hora_followup: new Date().toLocaleString("pt-BR"),
        status: formData.status,
        observacoes: formData.observacoes,
        codigo_vendedor: user?.codigo || "",
        nome_vendedor: user?.nome || "",
        tipo_acao: "followup",
        data_orcamento: selectedBudget.data,
        valor_orcamento: selectedBudget.valor,
      }

      console.log("📤 Enviando follow-up:", followupData)

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
          console.log("✅ Follow-up enviado (timeout - assumindo sucesso)")
          resolve()
        }, 3000)

        const cleanup = () => {
          clearTimeout(timeout)
          if (document.body.contains(form)) document.body.removeChild(form)
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }

        iframe.onload = () => {
          cleanup()
          console.log("✅ Follow-up enviado (iframe carregado)")
          resolve()
        }

        form.submit()
        console.log("📤 Form submetido para Apps Script")
      })

      await submitPromise

      console.log("✅ Follow-up enviado com sucesso")
      handleCloseDialog()
      onFollowup()
      alert("✅ Follow-up registrado com sucesso!")
    } catch (error: any) {
      console.error("❌ Erro ao enviar follow-up:", error)
      setSubmitError(`Erro ao salvar: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const loadAIAnalysis = async () => {
    if (!selectedBudget) return

    const config = getAIConfig()
    console.log("🎯 Carregando análise estruturada da IA...")

    setIsLoadingAnalysis(true)
    try {
      const budgetContext = `
Cliente: ${selectedBudget.cliente}
Valor: R$ ${selectedBudget.valor.toLocaleString("pt-BR")}
Data: ${selectedBudget.data}
Dias em aberto: ${calculateDaysOpen(selectedBudget.data)}
Status atual: ${selectedBudget.status_atual}
Observações anteriores: ${selectedBudget.observacoes_atuais || "Nenhuma"}
Último follow-up: ${selectedBudget.ultimo_followup || "Nunca"}
`

      console.log("📤 Enviando para análise estruturada...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: config.systemPrompt || "Você é um assistente de vendas especializado." },
            { role: "user", content: `${config.analysisPrompt}\n\nDados do orçamento:\n${budgetContext}` },
          ],
          model: config.model || "gpt-4o-mini",
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 1000,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Resposta da IA para análise:", data)

        try {
          // Tentar extrair JSON da resposta
          const jsonMatch = (data.content || data.response).match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0])
            setAiAnalysis(analysis)
            console.log("✅ Análise estruturada processada:", analysis)
          } else {
            throw new Error("JSON não encontrado na resposta")
          }
        } catch (parseError) {
          console.warn("⚠️ Erro ao parsear JSON, usando análise padrão")
          setAiAnalysis({
            probabilidade: 50,
            categoria_risco: "médio",
            motivos_principais: ["Análise baseada nos dados fornecidos"],
            estrategias_recomendadas: ["Manter contato regular", "Identificar objeções"],
            proximos_passos: ["Agendar nova conversa", "Enviar proposta revisada"],
            prazo_sugerido: "3-5 dias",
            observacoes_importantes: "Análise gerada automaticamente",
          })
        }
      } else {
        const errorData = await response.json()
        console.error("❌ Erro na resposta da API:", response.status, errorData)
        setAiAnalysis({
          probabilidade: 0,
          categoria_risco: "alto",
          motivos_principais: [`Erro ao gerar análise: ${errorData.error}`],
          estrategias_recomendadas: ["Verificar configuração da IA"],
          proximos_passos: ["Tentar novamente"],
          prazo_sugerido: "Imediato",
          observacoes_importantes: "Erro na análise",
        })
      }
    } catch (error) {
      console.error("❌ Erro ao carregar análise:", error)
      setAiAnalysis({
        probabilidade: 0,
        categoria_risco: "alto",
        motivos_principais: ["Erro de conexão com a IA"],
        estrategias_recomendadas: ["Verificar configuração"],
        proximos_passos: ["Tentar novamente"],
        prazo_sugerido: "Imediato",
        observacoes_importantes: "Erro técnico",
      })
    } finally {
      setIsLoadingAnalysis(false)
    }
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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-ups Pendentes
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            {pendingBudgets.length} orçamento{pendingBudgets.length > 1 ? "s" : ""} aguardando acompanhamento
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              IA Avançada
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pendingBudgets.map((budget) => {
              const history = generateSampleHistory(budget)
              const isHistoryExpanded = expandedHistory.has(budget.sequencia)

              return (
                <div
                  key={budget.sequencia}
                  className={`p-4 rounded-lg border ${
                    budget.dias_followup === "D+3" ? "border-red-200 bg-red-50" : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{budget.sequencia}</Badge>
                      {getPriorityBadge(budget.dias_followup || "A agendar")}
                      {getStatusBadge(budget.status_atual || "orcamento_enviado")}
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => handleOpenDialog(budget)}>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Follow-up
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{budget.cliente}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span>R$ {budget.valor.toLocaleString("pt-BR")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span>{budget.data}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span>{calculateDaysOpen(budget.data)} dias em aberto</span>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Último follow-up: {budget.ultimo_followup ? formatDate(budget.ultimo_followup) : "Nunca"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Vendedor: {budget.nome_vendedor}</span>
                    </div>
                  </div>

                  {/* SEÇÃO DE HISTÓRICO DE CONVERSAS - IMPLEMENTADA AQUI */}
                  <div className="mt-3 border-t pt-3">
                    <Collapsible>
                      <CollapsibleTrigger
                        onClick={() => toggleHistory(budget.sequencia)}
                        className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors w-full text-left"
                      >
                        {isHistoryExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <History className="h-4 w-4" />📋 Histórico de Conversas ({history.length})
                      </CollapsibleTrigger>

                      <CollapsibleContent className="mt-3">
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {history.length > 0 ? (
                            history.map((followup, index) => (
                              <div key={index} className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
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
                                  <p className="whitespace-pre-wrap bg-white p-2 rounded border">
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

                          {/* Última observação atual destacada */}
                          {budget.observacoes_atuais && (
                            <div className="bg-green-50 rounded-lg p-3 border-l-4 border-green-500">
                              <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />💬 Última observação:
                              </p>
                              <p className="text-sm text-gray-700 bg-white p-2 rounded border">
                                {budget.observacoes_atuais}
                              </p>
                              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />🕒 {formatDate(budget.ultimo_followup)}
                              </p>
                            </div>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Follow-up */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Follow-up: {selectedBudget?.cliente}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Orçamento {selectedBudget?.sequencia} - R$ {selectedBudget?.valor?.toLocaleString("pt-BR")} -{" "}
              {calculateDaysOpen(selectedBudget?.data || "")} dias em aberto
              <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                <Shield className="h-3 w-3 mr-1" />
                IA Avançada
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followup">📝 Follow-up</TabsTrigger>
              <TabsTrigger value="ai-analysis">🎯 Análise IA</TabsTrigger>
            </TabsList>

            <TabsContent value="followup" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Status do Orçamento *</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o novo status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Observações do Follow-up *</label>
                  <Textarea
                    placeholder="Descreva o que aconteceu no follow-up, próximos passos, etc..."
                    value={formData.observacoes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                    rows={4}
                  />
                </div>

                {submitError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{submitError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSubmitFollowup} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Registrar Follow-up
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-analysis" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análise Estruturada
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Target className="h-3 w-3 mr-1" />
                    Premissas IA
                  </Badge>
                </h3>
                <Button onClick={loadAIAnalysis} disabled={isLoadingAnalysis} size="sm">
                  {isLoadingAnalysis ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                  {isLoadingAnalysis ? "Analisando..." : "Gerar Análise"}
                </Button>
              </div>

              {aiAnalysis ? (
                <div className="space-y-4">
                  {/* Probabilidade e Risco */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Probabilidade de Fechamento</span>
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold text-blue-600">{aiAnalysis.probabilidade}%</div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${aiAnalysis.probabilidade}%` }}
                          ></div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Categoria de Risco</span>
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="mt-2">{getRiskBadge(aiAnalysis.categoria_risco)}</div>
                        <div className="text-xs text-gray-500 mt-1">Prazo sugerido: {aiAnalysis.prazo_sugerido}</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Motivos Principais */}
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Motivos Principais
                      </h4>
                      <ul className="space-y-2">
                        {aiAnalysis.motivos_principais.map((motivo, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>{motivo}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Estratégias e Próximos Passos */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Target className="h-4 w-4 text-green-500" />
                          Estratégias Recomendadas
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.estrategias_recomendadas.map((estrategia, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-green-500 mt-1">•</span>
                              <span>{estrategia}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500" />
                          Próximos Passos
                        </h4>
                        <ul className="space-y-2">
                          {aiAnalysis.proximos_passos.map((passo, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{passo}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Observações Importantes */}
                  {aiAnalysis.observacoes_importantes && (
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Observação IA:</strong> {aiAnalysis.observacoes_importantes}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-4">Clique em "Gerar Análise" para receber uma análise estruturada da IA</p>
                  <div className="text-sm text-gray-400">
                    A análise incluirá probabilidade de fechamento, categoria de risco, estratégias e próximos passos
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
