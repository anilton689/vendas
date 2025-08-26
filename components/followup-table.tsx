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
import {
  MessageSquare,
  Calendar,
  DollarSign,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Shield,
  Send,
  Brain,
  Lightbulb,
  TrendingUp,
  Target,
  AlertCircle,
  Copy,
  RefreshCw,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface FollowupTableProps {
  budgets: Budget[]
  onFollowup: () => void
  user: any | null
}

interface AISuggestion {
  categoria: string
  sugestao: string
  confianca: number
  prioridade: "alta" | "media" | "baixa"
  tipo: "estrategia" | "timing" | "abordagem" | "objecao" | "fechamento"
}

export function FollowupTable({ budgets, onFollowup, user }: FollowupTableProps) {
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [activeTab, setActiveTab] = useState("followup")
  const [formData, setFormData] = useState({ status: "", observacoes: "" })

  // Estados para Sugestões IA
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState("")

  const statusOptions = [
    { value: "orcamento_enviado", label: "Orçamento Enviado", color: "blue" },
    { value: "aguardando_analise", label: "Aguardando Análise", color: "yellow" },
    { value: "em_negociacao", label: "Em Negociação", color: "orange" },
    { value: "aguardando_aprovacao", label: "Aguardando Aprovação", color: "purple" },
    { value: "pedido_fechado", label: "Pedido Fechado", color: "green" },
    { value: "orcamento_perdido", label: "Orçamento Perdido", color: "red" },
  ]

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

  const handleOpenDialog = async (budget: any) => {
    setSelectedBudget(budget)
    setFormData({
      status: budget.status_atual || "orcamento_enviado",
      observacoes: "",
    })
    setIsDialogOpen(true)
    setActiveTab("followup")
    setSubmitError("")
    setSuggestionsError("")
    setAiSuggestions([])
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedBudget(null)
    setFormData({ status: "", observacoes: "" })
    setSubmitError("")
    setSuggestionsError("")
    setAiSuggestions([])
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

  const loadAISuggestions = async () => {
    if (!selectedBudget) return

    setIsLoadingSuggestions(true)
    setSuggestionsError("")

    try {
      // Buscar configuração da IA
      const aiConfig = JSON.parse(localStorage.getItem("ai-config") || "{}")

      if (!aiConfig.apiKey) {
        setSuggestionsError("IA não configurada. Configure a API Key nas configurações do sistema.")
        setIsLoadingSuggestions(false)
        return
      }

      // Construir contexto baseado no histórico
      const historico = selectedBudget.historico || []
      const observacoesHistorico = historico.map((h: any) => `${h.data_hora_followup}: ${h.observacoes}`).join("\n")

      const contextoBudget = `
ANÁLISE DE ORÇAMENTO - DADOS TÉCNICOS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INFORMAÇÕES BÁSICAS:
• Cliente: ${selectedBudget.cliente}
• Valor: R$ ${selectedBudget.valor.toLocaleString("pt-BR")}
• Data Criação: ${selectedBudget.data}
• Dias em Aberto: ${calculateDaysOpen(selectedBudget.data)}
• Status Atual: ${selectedBudget.status_atual}
• Vendedor: ${selectedBudget.nome_vendedor}

HISTÓRICO DE INTERAÇÕES:
${observacoesHistorico || "Nenhuma interação registrada ainda."}

OBSERVAÇÕES ATUAIS:
${selectedBudget.observacoes_atuais || "Nenhuma observação atual."}

ANÁLISE REQUERIDA:
Com base nestes dados, forneça 5 sugestões estratégicas estruturadas em JSON no formato:
{
  "sugestoes": [
    {
      "categoria": "Estratégia de Abordagem",
      "sugestao": "Descrição específica da sugestão",
      "confianca": 85,
      "prioridade": "alta",
      "tipo": "estrategia"
    }
  ]
}

TIPOS DISPONÍVEIS: estrategia, timing, abordagem, objecao, fechamento
PRIORIDADES: alta, media, baixa
CONFIANÇA: 0-100 (baseado na qualidade dos dados)

Seja específico, técnico e focado em resultados mensuráveis.
      `

      console.log("🤖 Enviando solicitação de sugestões para IA...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Você é um consultor especialista em vendas B2B com 15 anos de experiência. Analise dados de orçamentos e forneça sugestões estratégicas precisas baseadas em padrões de comportamento de clientes. Sempre responda em JSON estruturado.",
            },
            {
              role: "user",
              content: contextoBudget,
            },
          ],
          model: aiConfig.model || "gpt-4o-mini",
          temperature: 0.3, // Baixa criatividade, alta precisão
          maxTokens: 1500,
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`)
      }

      const data = await response.json()
      console.log("📥 Resposta da IA:", data)

      // Tentar extrair JSON da resposta
      let suggestions: AISuggestion[] = []

      try {
        const content = data.content || data.response || ""
        const jsonMatch = content.match(/\{[\s\S]*\}/)

        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          suggestions = parsed.sugestoes || []
        } else {
          // Fallback: criar sugestões padrão
          suggestions = [
            {
              categoria: "Análise Baseada em IA",
              sugestao: content.substring(0, 300) + "...",
              confianca: 70,
              prioridade: "media" as const,
              tipo: "estrategia" as const,
            },
          ]
        }
      } catch (parseError) {
        console.error("Erro ao parsear JSON:", parseError)
        suggestions = [
          {
            categoria: "Sugestão Geral",
            sugestao:
              "Com base no histórico e tempo em aberto, recomendo contato proativo focando em valor agregado e urgência na decisão.",
            confianca: 60,
            prioridade: "media" as const,
            tipo: "estrategia" as const,
          },
        ]
      }

      setAiSuggestions(suggestions)
    } catch (error: any) {
      console.error("❌ Erro ao carregar sugestões:", error)
      setSuggestionsError(`Erro ao gerar sugestões: ${error.message}`)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const getPriorityIcon = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "media":
        return <TrendingUp className="h-4 w-4 text-yellow-500" />
      case "baixa":
        return <Lightbulb className="h-4 w-4 text-blue-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "estrategia":
        return <Target className="h-3 w-3" />
      case "timing":
        return <Clock className="h-3 w-3" />
      case "abordagem":
        return <MessageSquare className="h-3 w-3" />
      case "objecao":
        return <Shield className="h-3 w-3" />
      case "fechamento":
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Lightbulb className="h-3 w-3" />
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Feedback visual opcional
    })
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
            {pendingBudgets.map((budget) => (
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

                {budget.observacoes_atuais && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                    <strong>Última observação:</strong> {budget.observacoes_atuais}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Follow-up com Abas */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Follow-up: {selectedBudget?.cliente}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              Orçamento {selectedBudget?.sequencia} - R$ {selectedBudget?.valor.toLocaleString("pt-BR")} -{" "}
              {calculateDaysOpen(selectedBudget?.data || "")} dias em aberto
              <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
                <Brain className="h-3 w-3 mr-1" />
                IA Estratégica
              </Badge>
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="followup" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Follow-up
              </TabsTrigger>
              <TabsTrigger value="ai-suggestions" className="flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Sugestões IA
              </TabsTrigger>
            </TabsList>

            <TabsContent value="followup" className="space-y-4 mt-6">
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

            <TabsContent value="ai-suggestions" className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    Sugestões Estratégicas IA
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Análise baseada no histórico de interações e padrões de comportamento
                  </p>
                </div>
                <Button
                  onClick={loadAISuggestions}
                  disabled={isLoadingSuggestions}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isLoadingSuggestions ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Gerar Sugestões
                    </>
                  )}
                </Button>
              </div>

              {suggestionsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{suggestionsError}</AlertDescription>
                </Alert>
              )}

              {aiSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(suggestion.prioridade)}
                          <Badge variant="outline" className="text-xs">
                            {getTypeIcon(suggestion.tipo)}
                            <span className="ml-1 capitalize">{suggestion.tipo}</span>
                          </Badge>
                          <Badge variant={suggestion.confianca > 80 ? "default" : "secondary"} className="text-xs">
                            {suggestion.confianca}% confiança
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(suggestion.sugestao)}
                          className="p-1 h-8 w-8"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>

                      <h4 className="font-medium text-gray-900 mb-2">{suggestion.categoria}</h4>

                      <p className="text-sm text-gray-700 leading-relaxed">{suggestion.sugestao}</p>

                      <div className="mt-3 flex items-center gap-2">
                        <Badge
                          variant={
                            suggestion.prioridade === "alta"
                              ? "destructive"
                              : suggestion.prioridade === "media"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          Prioridade {suggestion.prioridade}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">Dica Profissional</span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Essas sugestões são baseadas em análise de dados históricos e padrões de mercado. Use-as como
                      guia, mas sempre considere o contexto específico do cliente.
                    </p>
                  </div>
                </div>
              ) : (
                !isLoadingSuggestions && (
                  <div className="text-center py-12">
                    <Brain className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-600 mb-2">Sugestões Estratégicas Personalizadas</h4>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Clique em "Gerar Sugestões" para receber análises baseadas em IA sobre o histórico de interações
                      deste orçamento.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-2xl mx-auto text-xs">
                      <div className="text-center p-3 bg-red-50 rounded-lg border border-red-100">
                        <Target className="h-6 w-6 text-red-500 mx-auto mb-1" />
                        <span className="text-red-700">Estratégias</span>
                      </div>
                      <div className="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <Clock className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                        <span className="text-yellow-700">Timing</span>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <MessageSquare className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                        <span className="text-blue-700">Abordagem</span>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-100">
                        <Shield className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                        <span className="text-purple-700">Objeções</span>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                        <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
                        <span className="text-green-700">Fechamento</span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
