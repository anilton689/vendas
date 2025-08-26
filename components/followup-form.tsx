"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  Plus,
  MessageSquare,
  MessageCircle,
  Copy,
  Send,
  Lightbulb,
  Bot,
  User,
  Loader2,
  Target,
  Zap,
} from "lucide-react"

import type { Budget } from "@/types/budget"

interface FollowupFormProps {
  budget: Budget
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: { codigo: string; nome: string }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AISuggestion {
  tipo: string
  titulo: string
  conteudo: string
  prioridade: "alta" | "media" | "baixa"
}

interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  followupPrompt: string
  analysisPrompt: string
  isConfigured: boolean
}

export function FollowupForm({ budget, isOpen, onClose, onSuccess, user }: FollowupFormProps) {
  const [followupStatus, setFollowupStatus] = useState("")
  const [followupObservacoes, setFollowupObservacoes] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("whatsapp")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estados para IA
  const [chatMessages, setChatMessages] = useState<Message[]>([])
  const [currentMessage, setCurrentMessage] = useState("")
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<AISuggestion[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)

  // Função para carregar configuração da IA da planilha
  const loadAIConfig = async () => {
    try {
      console.log("🔄 [FollowupForm] Carregando configuração da IA...")

      const adminConfig = localStorage.getItem("admin-sheets-config")
      if (!adminConfig) {
        console.log("⚠️ [FollowupForm] Configuração da planilha não encontrada")
        return
      }

      const { apiKey, spreadsheetId } = JSON.parse(adminConfig)
      if (!apiKey || !spreadsheetId) {
        console.log("⚠️ [FollowupForm] API Key ou Spreadsheet ID não configurados")
        return
      }

      // Buscar dados da aba ConfigIA
      const range = "ConfigIA!A:B"
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

      const response = await fetch(url)
      if (!response.ok) {
        console.error("❌ [FollowupForm] Erro ao buscar ConfigIA:", response.status)
        return
      }

      const data = await response.json()
      if (!data.values || data.values.length === 0) {
        console.warn("⚠️ [FollowupForm] Aba ConfigIA não encontrada ou vazia")
        return
      }

      // Processar dados da planilha
      const configData: Record<string, string> = {}
      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i]
        if (row && row.length >= 2) {
          const tipo = String(row[0] || "").trim()
          const valor = String(row[1] || "").trim()
          if (tipo && valor) {
            configData[tipo] = valor
          }
        }
      }

      const config: AIConfig = {
        model: configData.model || "gpt-4o-mini",
        temperature: Number.parseFloat(configData.temperature) || 0.7,
        maxTokens: Number.parseInt(configData.maxTokens) || 1000,
        systemPrompt: configData.systemPrompt || "Você é um assistente especializado em vendas.",
        followupPrompt: configData.followupPrompt || "Analise este orçamento e forneça sugestões para follow-up.",
        analysisPrompt: configData.analysisPrompt || "Analise este orçamento e forneça insights.",
        isConfigured: true,
      }

      setAiConfig(config)
      console.log("✅ [FollowupForm] Configuração da IA carregada:", {
        model: config.model,
        systemPromptLength: config.systemPrompt.length,
        followupPromptLength: config.followupPrompt.length,
      })

      return config
    } catch (error) {
      console.error("❌ [FollowupForm] Erro ao carregar configuração da IA:", error)
      return null
    }
  }

  useEffect(() => {
    if (isOpen && budget) {
      // Limpar form
      setFollowupStatus("")
      setFollowupObservacoes("")
      setChatMessages([])
      setCurrentMessage("")
      setAISuggestions([])

      // Carregar configuração da IA
      loadAIConfig().then((config) => {
        if (config) {
          loadAISuggestions(config)
        }
      })
    }
  }, [isOpen, budget])

  const loadAISuggestions = async (config?: AIConfig) => {
    if (!budget) return

    const currentConfig = config || aiConfig
    if (!currentConfig) {
      console.log("⚠️ [FollowupForm] Configuração da IA não carregada")
      return
    }

    setIsLoadingSuggestions(true)
    try {
      const budgetContext = `
DADOS DO ORÇAMENTO:
- Sequência: ${budget.sequencia}
- Cliente: ${budget.cliente}
- Valor: R$ ${budget.valor.toLocaleString("pt-BR")}
- Status Atual: ${budget.status_atual}
- Dias em Aberto: ${calculateDaysOpen(budget.data)}
- Observações: ${budget.observacoes_atuais || "Nenhuma"}
- Histórico: ${budget.historico?.length || 0} interações anteriores
${budget.historico?.length ? `Último follow-up: ${budget.historico[budget.historico.length - 1]?.observacoes}` : ""}
`

      const fullMessage = `${currentConfig.followupPrompt || "Analise este orçamento e forneça sugestões para follow-up."}

${budgetContext}

Forneça 4 sugestões específicas para o follow-up no formato JSON:
{
  "sugestoes": [
    {
      "tipo": "abordagem|negociacao|fechamento|relacionamento",
      "titulo": "Título da sugestão",
      "conteudo": "Descrição detalhada da ação recomendada",
      "prioridade": "alta|media|baixa"
    }
  ]
}`

      console.log("📤 [FollowupForm] Enviando para sugestões da IA:", {
        messageLength: fullMessage.length,
        hasConfig: !!currentConfig,
        systemPromptLength: currentConfig.systemPrompt?.length || 0,
      })

      const requestBody = {
        prompt: fullMessage, // Mudou de 'message' para 'prompt'
        budget: {
          sequencia_orcamento: budget.sequencia,
          nome_cliente: budget.cliente,
          valor_orcamento: budget.valor,
          status: budget.status_atual,
          dias_desde_criacao: calculateDaysOpen(budget.data),
          observacoes: budget.observacoes_atuais || "Nenhuma",
        },
        config: {
          model: currentConfig.model || "gpt-4o-mini",
          temperature: currentConfig.temperature || 0.7,
          maxTokens: currentConfig.maxTokens || 1000,
          systemPrompt: currentConfig.systemPrompt || "Você é um assistente especializado em vendas.",
        },
      }

      console.log("📦 [FollowupForm] Dados das sugestões sendo enviados:", {
        hasMessage: !!requestBody.prompt,
        messageLength: requestBody.prompt?.length || 0,
        hasSystemPrompt: !!requestBody.config.systemPrompt,
      })

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ [FollowupForm] Erro na API:", errorData)
        throw new Error(`Erro na API da IA: ${response.status} - ${errorData.error || "Erro desconhecido"}`)
      }

      const data = await response.json()
      console.log("📥 [FollowupForm] Resposta da IA para sugestões:", data)

      // Tentar extrair JSON da resposta
      try {
        const responseText = data.response || ""
        const jsonMatch = responseText.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          if (parsed.sugestoes && Array.isArray(parsed.sugestoes)) {
            setAISuggestions(parsed.sugestoes)
            console.log("✅ [FollowupForm] Sugestões carregadas:", parsed.sugestoes.length)
          }
        }
      } catch (parseError) {
        console.warn("⚠️ [FollowupForm] Erro ao parsear sugestões da IA:", parseError)
        // Sugestões padrão como fallback
        setAISuggestions([
          {
            tipo: "abordagem",
            titulo: "Contato de Acompanhamento",
            conteudo:
              "Entre em contato para verificar se o cliente teve tempo de analisar a proposta e esclarecer dúvidas.",
            prioridade: "alta",
          },
          {
            tipo: "negociacao",
            titulo: "Flexibilidade na Proposta",
            conteudo:
              "Explore possibilidades de ajustes na proposta, como condições de pagamento ou escopo do projeto.",
            prioridade: "media",
          },
        ])
      }
    } catch (error) {
      console.error("❌ [FollowupForm] Erro ao carregar sugestões da IA:", error)
    } finally {
      setIsLoadingSuggestions(false)
    }
  }

  const sendChatMessage = async () => {
    if (!currentMessage.trim() || isAILoading) {
      console.log("⚠️ [FollowupForm] Mensagem vazia ou IA ocupada")
      return
    }

    if (!aiConfig) {
      console.log("⚠️ [FollowupForm] Configuração da IA não carregada")
      alert("❌ Configuração da IA não carregada. Aguarde um momento e tente novamente.")
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const messageToSend = currentMessage.trim()
    setCurrentMessage("")
    setIsAILoading(true)

    try {
      console.log("🤖 [FollowupForm] Enviando mensagem para IA:", {
        message: messageToSend,
        messageLength: messageToSend.length,
        hasBudget: !!budget,
        hasSystemPrompt: !!aiConfig.systemPrompt,
        systemPromptLength: aiConfig.systemPrompt?.length || 0,
        model: aiConfig.model,
      })

      const requestBody = {
        prompt: messageToSend, // Mudou de 'message' para 'prompt'
        budget: budget
          ? {
              sequencia_orcamento: budget.sequencia,
              nome_cliente: budget.cliente,
              nome_vendedor: user.nome,
              valor_orcamento: budget.valor,
              data_orcamento: budget.data,
              status: budget.status_atual,
              dias_desde_criacao: calculateDaysOpen(budget.data),
              observacoes: budget.observacoes_atuais || "Nenhuma",
            }
          : null,
        config: {
          model: aiConfig.model || "gpt-4o-mini",
          temperature: aiConfig.temperature || 0.7,
          maxTokens: aiConfig.maxTokens || 1000,
          systemPrompt: aiConfig.systemPrompt || "Você é um assistente especializado em vendas.",
        },
      }

      console.log("📦 [FollowupForm] Dados sendo enviados:", {
        hasMessage: !!requestBody.prompt,
        messageLength: requestBody.prompt?.length || 0,
        hasConfig: !!requestBody.config,
        hasSystemPrompt: !!requestBody.config.systemPrompt,
        systemPromptLength: requestBody.config.systemPrompt?.length || 0,
      })

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })

      console.log("📡 [FollowupForm] Status da resposta:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("❌ [FollowupForm] Erro na API:", errorData)
        throw new Error(errorData.error || "Erro na comunicação com a IA")
      }

      const data = await response.json()
      console.log("✅ [FollowupForm] Resposta recebida da IA")

      const aiResponse = data.response || "Desculpe, não consegui processar sua solicitação."

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error: any) {
      console.error("❌ [FollowupForm] Erro ao enviar mensagem:", error)

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `❌ Erro: ${error.message}`,
        timestamp: new Date(),
      }

      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsAILoading(false)
    }
  }

  const submitFollowup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!followupStatus || !followupObservacoes.trim()) {
      alert("Por favor, preencha o status e as observações.")
      return
    }

    // Buscar URL do Apps Script com fallback automático
    let writeEndpoint = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

    // Se não encontrar, configurar automaticamente
    if (!writeEndpoint) {
      writeEndpoint =
        "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"
      localStorage.setItem("write-endpoint", writeEndpoint)
      localStorage.setItem("apps-script-url", writeEndpoint)
      console.log("🔧 URL do Apps Script configurada automaticamente:", writeEndpoint)
    }

    console.log("🔍 URL do Apps Script encontrada:", writeEndpoint)

    setIsSubmitting(true)

    try {
      const followupData = {
        sequencia_orcamento: budget.sequencia,
        data_hora_followup: new Date().toISOString(),
        status: followupStatus,
        observacoes: followupObservacoes,
        codigo_vendedor: user.codigo,
        nome_vendedor: user.nome,
        tipo_acao: "followup",
        data_orcamento: budget.data,
        valor_orcamento: budget.valor,
        canal_contato: selectedChannel,
      }

      console.log("📦 Enviando dados para Apps Script:", followupData)
      console.log("🚀 URL de destino:", writeEndpoint)

      // Criar form invisível para submissão
      const form = document.createElement("form")
      form.method = "POST"
      form.action = writeEndpoint
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

      onClose()
      onSuccess()
      alert("✅ Follow-up registrado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao enviar follow-up:", error)
      alert(`❌ Erro ao registrar follow-up: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDaysOpen = (budgetDate: string): number => {
    const today = new Date()
    const [year, month, day] = budgetDate.split("-").map(Number)
    const budgetDateObj = new Date(year, month - 1, day)
    const diffTime = today.getTime() - budgetDateObj.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("💾 Texto copiado!")
  }

  const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "bg-red-100 text-red-800 border-red-200"
      case "media":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "baixa":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getPriorityIcon = (prioridade: string) => {
    switch (prioridade) {
      case "alta":
        return "🔥"
      case "media":
        return "⚡"
      case "baixa":
        return "💡"
      default:
        return "📌"
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendChatMessage()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up: {budget?.cliente}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{budget?.sequencia}</Badge>
                <Badge variant="secondary">R$ {budget?.valor.toLocaleString("pt-BR")}</Badge>
                <Badge variant="outline">{calculateDaysOpen(budget?.data || "")} dias em aberto</Badge>
                {aiConfig && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    IA Configurada
                  </Badge>
                )}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="followup" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Sugestões IA
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              Chat IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followup" className="space-y-4 mt-4">
            <form onSubmit={submitFollowup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Novo Status do Orçamento *</Label>
                  <Select value={followupStatus} onValueChange={setFollowupStatus} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aguardando_analise">🔍 Aguardando Análise</SelectItem>
                      <SelectItem value="em_negociacao">💬 Em Negociação</SelectItem>
                      <SelectItem value="aguardando_aprovacao">⏳ Aguardando Aprovação</SelectItem>
                      <SelectItem value="pedido_fechado">✅ Pedido Fechado</SelectItem>
                      <SelectItem value="orcamento_perdido">❌ Orçamento Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="channel">Canal de Contato</Label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                      <SelectItem value="email">📧 E-mail</SelectItem>
                      <SelectItem value="telefone">📞 Telefone</SelectItem>
                      <SelectItem value="reuniao">🤝 Reunião</SelectItem>
                      <SelectItem value="visita">🏢 Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações do Follow-up *</Label>
                <Textarea
                  id="observacoes"
                  placeholder="Descreva o que aconteceu no follow-up, próximos passos, feedback do cliente, etc..."
                  value={followupObservacoes}
                  onChange={(e) => setFollowupObservacoes(e.target.value)}
                  rows={4}
                  className="mt-1"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!followupStatus || !followupObservacoes.trim() || isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Registrar Follow-up
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4 mt-4">
            {!aiConfig ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-gray-600">Carregando configuração da IA...</p>
                </CardContent>
              </Card>
            ) : isLoadingSuggestions ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-gray-600">Gerando sugestões inteligentes...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Sugestões Personalizadas
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => loadAISuggestions()}>
                    <Zap className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </div>

                <div className="grid gap-4">
                  {aiSuggestions.map((suggestion, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getPriorityIcon(suggestion.prioridade)}</span>
                            <h4 className="font-semibold">{suggestion.titulo}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(suggestion.prioridade)}>{suggestion.prioridade}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(suggestion.conteudo)}>
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{suggestion.conteudo}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {suggestion.tipo}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {aiSuggestions.length === 0 && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-sm text-gray-600">Nenhuma sugestão disponível no momento.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 mt-4">
            {!aiConfig ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-sm text-gray-600">Carregando configuração da IA...</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Chat Contextual
                  </CardTitle>
                  <CardDescription>Converse sobre estratégias específicas para este orçamento</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-64 mb-4 border rounded-lg p-4">
                    <div className="space-y-3">
                      {chatMessages.length === 0 && (
                        <div className="text-center text-gray-500 py-8">
                          <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="mb-2">Inicie uma conversa sobre este orçamento</p>
                          <div className="text-xs space-y-1">
                            <p>💡 "Como posso acelerar o fechamento?"</p>
                            <p>💡 "Que objeções posso esperar?"</p>
                            <p>💡 "Como negociar o preço?"</p>
                          </div>
                        </div>
                      )}

                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                          >
                            <div className="flex-shrink-0">
                              {message.role === "user" ? (
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                                  <Bot className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div
                              className={`rounded-lg p-3 ${
                                message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
                              }`}
                            >
                              <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                              <div
                                className={`text-xs mt-1 opacity-70 ${
                                  message.role === "user" ? "text-blue-100" : "text-gray-500"
                                }`}
                              >
                                {message.timestamp.toLocaleTimeString("pt-BR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {isAILoading && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-gray-100 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Pensando...
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      placeholder="Digite sua pergunta sobre este orçamento..."
                      onKeyPress={handleKeyPress}
                      disabled={isAILoading}
                      className="flex-1"
                    />
                    <Button onClick={sendChatMessage} disabled={!currentMessage.trim() || isAILoading}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <MessageCircle className="w-3 h-3 mr-1" />
                        {aiConfig?.model || "gpt-4o-mini"}
                      </Badge>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                        Prompt da Planilha
                      </Badge>
                    </div>
                    <div>{chatMessages.length > 0 && `${chatMessages.length} mensagens`}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
