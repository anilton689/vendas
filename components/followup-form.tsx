"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MessageSquare,
  Send,
  Loader2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Lightbulb,
  Brain,
  Zap,
  RefreshCw,
} from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

interface FollowupFormProps {
  budget: any
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

interface AIAnalysis {
  probabilidade: number
  categoria: string
  motivos: string[]
  estrategias: string
  proximosPassos: string
}

export function FollowupForm({ budget, isOpen, onClose, onSubmit }: FollowupFormProps) {
  const [activeTab, setActiveTab] = useState("followup")
  const [formData, setFormData] = useState({
    status: "",
    canal: "",
    observacoes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGeneratingStrategies, setIsGeneratingStrategies] = useState(false)
  const [isGeneratingSteps, setIsGeneratingSteps] = useState(false)
  const { config } = useAIConfig()

  const statusOptions = [
    { value: "Em Negociação", label: "Em Negociação" },
    { value: "Aguardando Resposta", label: "Aguardando Resposta" },
    { value: "Proposta Enviada", label: "Proposta Enviada" },
    { value: "Revisão Necessária", label: "Revisão Necessária" },
    { value: "Fechado", label: "Fechado" },
    { value: "Perdido", label: "Perdido" },
  ]

  const canalOptions = [
    { value: "Telefone", label: "📞 Telefone" },
    { value: "WhatsApp", label: "📱 WhatsApp" },
    { value: "Email", label: "📧 Email" },
    { value: "Presencial", label: "🤝 Presencial" },
    { value: "Video Chamada", label: "📹 Vídeo Chamada" },
  ]

  useEffect(() => {
    if (isOpen && budget) {
      setFormData({
        status: "",
        canal: "",
        observacoes: "",
      })
      setAnalysis(null)
      setActiveTab("followup")
    }
  }, [isOpen, budget])

  const generateAIAnalysis = async () => {
    if (!budget) return

    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Analise este orçamento e forneça uma análise estruturada:

Dados do orçamento:
- Cliente: ${budget.cliente}
- Valor: R$ ${budget.valor?.toLocaleString("pt-BR")}
- Dias em aberto: ${budget.dias_followup || 0}
- Status atual: ${budget.status_atual || "Novo"}
- Última observação: ${budget.observacoes_atuais || "Nenhuma"}
- Histórico: ${budget.historico?.length || 0} interações

Forneça uma análise em formato JSON com:
{
  "probabilidade": número de 0 a 100,
  "categoria": "Alto Risco" | "Médio Risco" | "Baixo Risco",
  "motivos": ["motivo1", "motivo2", "motivo3"]
}`,
          config: {
            model: config.model,
            temperature: 0.3,
            maxTokens: 500,
            systemPrompt: "Você é um especialista em análise de vendas. Seja preciso e objetivo.",
          },
        }),
      })

      if (!response.ok) throw new Error("Erro na análise")

      const data = await response.json()

      // Tentar extrair JSON da resposta
      try {
        const jsonMatch = data.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const analysisData = JSON.parse(jsonMatch[0])
          setAnalysis({
            ...analysisData,
            estrategias: "",
            proximosPassos: "",
          })
        }
      } catch (parseError) {
        // Fallback
        setAnalysis({
          probabilidade: 50,
          categoria: "Médio Risco",
          motivos: ["Análise baseada nos dados fornecidos"],
          estrategias: "",
          proximosPassos: "",
        })
      }
    } catch (error) {
      console.error("Erro na análise:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const generateStrategies = async () => {
    if (!budget || !analysis) return

    setIsGeneratingStrategies(true)
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Como um vendedor experiente, qual estratégia você recomenda para fechar este pedido?

Contexto do orçamento:
- Cliente: ${budget.cliente}
- Valor: R$ ${budget.valor?.toLocaleString("pt-BR")}
- Dias em aberto: ${budget.dias_followup || 0}
- Status atual: ${budget.status_atual || "Novo"}
- Probabilidade de fechamento: ${analysis.probabilidade}%
- Categoria de risco: ${analysis.categoria}
- Última observação: ${budget.observacoes_atuais || "Nenhuma"}
- Histórico de conversas: ${budget.historico?.length || 0} interações

Histórico de conversas:
${
  budget.historico
    ?.map((h: any, i: number) => `${i + 1}. ${h.data_hora_followup} - Status: ${h.status} - ${h.observacoes}`)
    .join("\n") || "Nenhuma conversa anterior"
}

Forneça uma estratégia detalhada e específica para este caso, considerando:
- O perfil do cliente
- O tempo em aberto
- O histórico de interações
- Técnicas de vendas comprovadas
- Gatilhos mentais apropriados

Seja específico e prático nas recomendações.`,
          config: {
            model: config.model,
            temperature: 0.7,
            maxTokens: 800,
            systemPrompt:
              config.systemPrompt ||
              "Você é um vendedor experiente especializado em fechamento de vendas. Use técnicas comprovadas como SPIN Selling, gatilhos mentais e psicologia de vendas.",
          },
        }),
      })

      if (!response.ok) throw new Error("Erro ao gerar estratégias")

      const data = await response.json()
      setAnalysis((prev) => (prev ? { ...prev, estrategias: data.response } : null))
    } catch (error) {
      console.error("Erro ao gerar estratégias:", error)
    } finally {
      setIsGeneratingStrategies(false)
    }
  }

  const generateNextSteps = async () => {
    if (!budget || !analysis) return

    setIsGeneratingSteps(true)
    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Como um vendedor experiente usando SPIN Selling e gatilhos mentais, quais os próximos passos você recomenda para realizar essa venda?

Contexto do orçamento:
- Cliente: ${budget.cliente}
- Valor: R$ ${budget.valor?.toLocaleString("pt-BR")}
- Dias em aberto: ${budget.dias_followup || 0}
- Status atual: ${budget.status_atual || "Novo"}
- Probabilidade de fechamento: ${analysis.probabilidade}%
- Categoria de risco: ${analysis.categoria}
- Última observação: ${budget.observacoes_atuais || "Nenhuma"}

Histórico de conversas:
${
  budget.historico
    ?.map((h: any, i: number) => `${i + 1}. ${h.data_hora_followup} - Status: ${h.status} - ${h.observacoes}`)
    .join("\n") || "Nenhuma conversa anterior"
}

Forneça um plano de ação detalhado com:
- Próximos passos específicos e cronológicos
- Técnicas SPIN Selling aplicáveis
- Gatilhos mentais a serem utilizados
- Scripts de abordagem sugeridos
- Timing ideal para cada ação
- Objeções prováveis e como contorná-las

Seja específico, prático e orientado a resultados.`,
          config: {
            model: config.model,
            temperature: 0.7,
            maxTokens: 800,
            systemPrompt:
              config.systemPrompt ||
              "Você é um especialista em SPIN Selling e psicologia de vendas. Forneça planos de ação detalhados e práticos.",
          },
        }),
      })

      if (!response.ok) throw new Error("Erro ao gerar próximos passos")

      const data = await response.json()
      setAnalysis((prev) => (prev ? { ...prev, proximosPassos: data.response } : null))
    } catch (error) {
      console.error("Erro ao gerar próximos passos:", error)
    } finally {
      setIsGeneratingSteps(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.status || !formData.canal || !formData.observacoes.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...formData,
        sequencia: budget.sequencia,
        cliente: budget.cliente,
        valor: budget.valor,
      })
      onClose()
    } catch (error) {
      console.error("Erro ao enviar follow-up:", error)
      alert("Erro ao registrar follow-up. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getRiskColor = (categoria: string) => {
    switch (categoria) {
      case "Alto Risco":
        return "text-red-600"
      case "Médio Risco":
        return "text-yellow-600"
      case "Baixo Risco":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getRiskIcon = (categoria: string) => {
    switch (categoria) {
      case "Alto Risco":
        return <AlertTriangle className="h-4 w-4" />
      case "Médio Risco":
        return <Target className="h-4 w-4" />
      case "Baixo Risco":
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  if (!budget) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up: {budget.cliente}
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            Orçamento {budget.sequencia} - R$ {budget.valor?.toLocaleString("pt-BR")} - {budget.dias_followup || 0} dias
            em aberto
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Follow-up
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Análise IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followup" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Novo Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
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

                <div className="space-y-2">
                  <Label htmlFor="canal">Canal de Contato *</Label>
                  <Select
                    value={formData.canal}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, canal: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o canal" />
                    </SelectTrigger>
                    <SelectContent>
                      {canalOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações da Conversa *</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Descreva o que foi conversado, objeções, próximos passos acordados..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Registrar Follow-up
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                <span className="font-medium">Análise Estruturada</span>
                {config.apiKey && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    Premissas IA
                  </Badge>
                )}
              </div>
              <Button onClick={generateAIAnalysis} disabled={isAnalyzing || !config.apiKey} size="sm">
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar Análise
                  </>
                )}
              </Button>
            </div>

            {!config.apiKey && (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Configure a API Key da IA para usar esta funcionalidade</p>
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Probabilidade de Fechamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600 mb-2">{analysis.probabilidade}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${analysis.probabilidade}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        {getRiskIcon(analysis.categoria)}
                        Categoria de Risco
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-lg font-semibold ${getRiskColor(analysis.categoria)} mb-2`}>
                        {analysis.categoria}
                      </div>
                      <div className="text-sm text-muted-foreground">Prazo sugerido: 3-5 dias</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Motivos Principais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {analysis.motivos.map((motivo, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-500 mt-1">•</span>
                          {motivo}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Estratégias Recomendadas
                        </CardTitle>
                        <Button
                          onClick={generateStrategies}
                          disabled={isGeneratingStrategies}
                          size="sm"
                          variant="outline"
                        >
                          {isGeneratingStrategies ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Lightbulb className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {analysis.estrategias ? (
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.estrategias}</div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Clique no ícone para gerar estratégias personalizadas</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Próximos Passos
                        </CardTitle>
                        <Button onClick={generateNextSteps} disabled={isGeneratingSteps} size="sm" variant="outline">
                          {isGeneratingSteps ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Target className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-48">
                        {analysis.proximosPassos ? (
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">{analysis.proximosPassos}</div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Clique no ícone para gerar próximos passos detalhados</p>
                          </div>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Brain className="h-3 w-3" />
                  <span>Observação IA: Análise gerada automaticamente</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
