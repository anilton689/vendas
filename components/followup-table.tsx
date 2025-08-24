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
  Brain,
  Copy,
  Send,
  Loader2,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface FollowupTableProps {
  budgets: Budget[]
  onFollowup: () => void
  user: any | null
}

interface AIMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function FollowupTable({ budgets, onFollowup, user }: FollowupTableProps) {
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [activeTab, setActiveTab] = useState("followup")

  // Estados para IA
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [chatMessages, setChatMessages] = useState<AIMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)

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

  const getAIConfig = () => {
    try {
      const configStr = localStorage.getItem("ai-config")
      if (configStr) {
        const config = JSON.parse(configStr)
        console.log("🤖 Configuração da IA encontrada:", {
          hasApiKey: !!config.apiKey,
          model: config.model,
          temperature: config.temperature,
        })
        return config
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configuração da IA:", error)
    }
    return {}
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
    setAiSuggestions([])
    setChatMessages([])
    setChatInput("")
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedBudget(null)
    setFormData({ status: "", observacoes: "" })
    setSubmitError("")
    setAiSuggestions([])
    setChatMessages([])
  }

  const handleSubmitFollowup = async () => {
    if (!selectedBudget || !formData.status || !formData.observacoes.trim()) {
      setSubmitError("Status e observações são obrigatórios")
      return
    }

    setIsSubmitting(true)
    setSubmitError("")

    try {
      // Buscar URL do Apps Script com fallback automático
      let appsScriptUrl = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

      // Se não encontrar, configurar automaticamente
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
      console.log("🚀 URL de destino:", appsScriptUrl)

      // Criar form invisível para submissão
      const form = document.createElement("form")
      form.method = "POST"
      form.action = appsScriptUrl
      form.style.display = "none"

      // Criar iframe invisível para receber resposta
      const iframe = document.createElement("iframe")
      iframe.name = `followup-iframe-${Date.now()}`
      iframe.style.display = "none"
      form.target = iframe.name

      // Adicionar dados como campo hidden
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "json_data"
      input.value = JSON.stringify(followupData)
      form.appendChild(input)

      // Adicionar ao DOM
      document.body.appendChild(iframe)
      document.body.appendChild(form)

      // Submeter form e aguardar resposta
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

      // Fechar modal e atualizar dados
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

    const config = getAIConfig()
    if (!config.apiKey) {
      console.log("⚠️ API Key não configurada para sugestões")
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const prompt = `Analise este orçamento e forneça sugestões de follow-up:
          
Cliente: ${selectedBudget.cliente}
Valor: R$ ${selectedBudget.valor.toLocaleString("pt-BR")}
Data: ${selectedBudget.data}
Dias em aberto: ${calculateDaysOpen(selectedBudget.data)}
Status atual: ${selectedBudget.status_atual}
Observações anteriores: ${selectedBudget.observacoes_atuais || "Nenhuma"}

Forneça 4-6 sugestões práticas categorizadas por: Abordagem, Negociação, Fechamento, Relacionamento.
Formato: JSON com array de objetos {categoria, sugestao, prioridade}`

      console.log("📤 Enviando prompt para sugestões da IA...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          budget: selectedBudget,
          config: config,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Resposta da IA para sugestões:", data)

        try {
          const suggestions = JSON.parse(data.response || data.content)
          setAiSuggestions(Array.isArray(suggestions) ? suggestions : [])
        } catch {
          // Se não for JSON válido, criar sugestões padrão
          setAiSuggestions([
            {
              categoria: "Abordagem",
              sugestao: "Entre em contato via WhatsApp para agilizar a comunicação",
              prioridade: "alta",
            },
            { categoria: "Negociação", sugestao: "Ofereça condições especiais de pagamento", prioridade: "media" },
            { categoria: "Fechamento", sugestao: "Agende uma reunião presencial para finalizar", prioridade: "alta" },
            {
              categoria: "Relacionamento",
              sugestao: "Envie material complementar sobre os produtos",
              prioridade: "baixa",
            },
          ])
        }
      } else {
        console.error("❌ Erro na resposta da API:", response.status)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar sugestões:", error)
      setAiSuggestions([
        { categoria: "Erro", sugestao: "Não foi possível carregar sugestões da IA", prioridade: "baixa" },
      ])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim() || !selectedBudget) return

    const config = getAIConfig()
    if (!config.apiKey) {
      alert("❌ API Key da IA não configurada. Configure em Sistema → Configurar IA")
      return
    }

    const userMessage: AIMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setIsChatLoading(true)

    try {
      const contextMessage = `Contexto do orçamento:
Cliente: ${selectedBudget.cliente}
Valor: R$ ${selectedBudget.valor.toLocaleString("pt-BR")}
Dias em aberto: ${calculateDaysOpen(selectedBudget.data)}
Status: ${selectedBudget.status_atual}

Pergunta do usuário: ${chatInput}`

      console.log("📤 Enviando mensagem para chat da IA...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: contextMessage,
          budget: selectedBudget,
          config: config,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("📥 Resposta da IA para chat:", data)

        const aiMessage: AIMessage = {
          role: "assistant",
          content: data.response || data.content,
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, aiMessage])
      } else {
        console.error("❌ Erro na resposta da API:", response.status)
        const errorMessage: AIMessage = {
          role: "assistant",
          content: "Desculpe, ocorreu um erro. Tente novamente.",
          timestamp: new Date(),
        }
        setChatMessages((prev) => [...prev, errorMessage])
      }
    } catch (error) {
      console.error("❌ Erro no chat:", error)
      const errorMessage: AIMessage = {
        role: "assistant",
        content: "Desculpe, ocorreu um erro. Tente novamente.",
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsChatLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Nunca"
    try {
      // Se a data está no formato brasileiro "23/08/2025, 22:39:38"
      if (dateString.includes("/") && dateString.includes(",")) {
        const [datePart] = dateString.split(",")
        const [day, month, year] = datePart.split("/")
        const date = new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
        return date.toLocaleDateString("pt-BR")
      }

      // Formato padrão
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return dateString // Retorna o valor original se não conseguir converter
      }
      return date.toLocaleDateString("pt-BR")
    } catch {
      return dateString
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

  const config = getAIConfig()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-ups Pendentes
          </CardTitle>
          <CardDescription>
            {pendingBudgets.length} orçamento{pendingBudgets.length > 1 ? "s" : ""} aguardando acompanhamento
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

                {/* Informações de follow-up */}
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

      {/* Modal de Follow-up */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Follow-up: {selectedBudget?.cliente}
            </DialogTitle>
            <DialogDescription>
              Orçamento {selectedBudget?.sequencia} - R$ {selectedBudget?.valor.toLocaleString("pt-BR")} -{" "}
              {calculateDaysOpen(selectedBudget?.data || "")} dias em aberto
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="followup">📝 Follow-up</TabsTrigger>
              <TabsTrigger value="ai-suggestions">💡 Sugestões IA</TabsTrigger>
              <TabsTrigger value="ai-chat">💬 Chat IA</TabsTrigger>
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

            <TabsContent value="ai-suggestions" className="space-y-4">
              {!config.apiKey ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Configure a API Key da IA em Sistema → Configurar IA</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Sugestões Personalizadas</h3>
                    <Button onClick={loadAISuggestions} disabled={isLoadingSuggestions} size="sm">
                      {isLoadingSuggestions ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Brain className="h-4 w-4" />
                      )}
                      {isLoadingSuggestions ? "Analisando..." : "Gerar Sugestões"}
                    </Button>
                  </div>

                  {aiSuggestions.length > 0 ? (
                    <div className="space-y-3">
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{suggestion.categoria}</Badge>
                            <div className="flex items-center gap-2">
                              {suggestion.prioridade === "alta" && <span className="text-red-500">🔥</span>}
                              {suggestion.prioridade === "media" && <span className="text-yellow-500">⚡</span>}
                              {suggestion.prioridade === "baixa" && <span className="text-blue-500">💡</span>}
                              <Button size="sm" variant="ghost" onClick={() => copyToClipboard(suggestion.sugestao)}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-gray-700">{suggestion.sugestao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Clique em "Gerar Sugestões" para receber recomendações da IA</p>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="ai-chat" className="space-y-4">
              {!config.apiKey ? (
                <div className="text-center py-8 text-gray-500">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Configure a API Key da IA em Sistema → Configurar IA</p>
                </div>
              ) : (
                <>
                  <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="mb-4">Converse com a IA sobre este orçamento</p>
                        <div className="space-y-2 text-sm">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput("Qual a melhor estratégia para este cliente?")}
                          >
                            Qual a melhor estratégia?
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput("Como posso acelerar o fechamento?")}
                          >
                            Como acelerar o fechamento?
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setChatInput("Que argumentos usar na negociação?")}
                          >
                            Argumentos de negociação?
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-3 rounded-lg ${
                                message.role === "user" ? "bg-blue-500 text-white" : "bg-white border"
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p className="text-xs opacity-70 mt-1">{message.timestamp.toLocaleTimeString("pt-BR")}</p>
                            </div>
                          </div>
                        ))}
                        {isChatLoading && (
                          <div className="flex justify-start">
                            <div className="bg-white border p-3 rounded-lg">
                              <Loader2 className="h-4 w-4 animate-spin" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Digite sua pergunta sobre este orçamento..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                      className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button onClick={sendChatMessage} disabled={isChatLoading || !chatInput.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
