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
  Brain,
  Zap,
  Eye,
  Users,
  Clock,
  DollarSign,
  Gauge,
  BookOpen,
  MessageCircle,
  Calendar,
  Phone,
  Mail,
  Video,
  Building,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  Star,
  Award,
  TrendingDown,
} from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

interface FollowupFormProps {
  budget: any
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

interface SmartAnalysis {
  probabilidade: number
  categoria: string
  confianca: number
  segmento_cliente: string
  perfil_comportamental: string
  urgencia: number
  potencial_valor: string
  motivos_detalhados: {
    positivos: string[]
    negativos: string[]
    neutros: string[]
  }
  analise_spin: {
    situacao: string
    problema: string
    implicacao: string
    necessidade_pagamento: string
  }
  gatilhos_mentais: string[]
  estrategias_personalizadas: string
  proximos_passos_detalhados: string
  scripts_sugeridos: {
    abertura: string
    objecoes: string[]
    fechamento: string
  }
  cronograma_acao: {
    imediato: string[]
    curto_prazo: string[]
    medio_prazo: string[]
  }
  alertas_comportamentais: string[]
  oportunidades_upsell: string[]
}

export function FollowupForm({ budget, isOpen, onClose, onSubmit }: FollowupFormProps) {
  const [activeTab, setActiveTab] = useState("followup")
  const [formData, setFormData] = useState({
    status: "",
    canal: "",
    observacoes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [smartAnalysis, setSmartAnalysis] = useState<SmartAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState("")
  const { config } = useAIConfig()

  const statusOptions = [
    { value: "Em Negociação", label: "💬 Em Negociação", color: "blue" },
    { value: "Aguardando Resposta", label: "⏳ Aguardando Resposta", color: "yellow" },
    { value: "Proposta Enviada", label: "📋 Proposta Enviada", color: "purple" },
    { value: "Revisão Necessária", label: "🔄 Revisão Necessária", color: "orange" },
    { value: "Pronto para Fechar", label: "✅ Pronto para Fechar", color: "green" },
    { value: "Fechado", label: "🎉 Fechado", color: "green" },
    { value: "Perdido", label: "❌ Perdido", color: "red" },
    { value: "Pausado", label: "⏸️ Pausado", color: "gray" },
  ]

  const canalOptions = [
    { value: "Telefone", label: "📞 Telefone", icon: Phone },
    { value: "WhatsApp", label: "📱 WhatsApp", icon: MessageCircle },
    { value: "Email", label: "📧 E-mail", icon: Mail },
    { value: "Presencial", label: "🤝 Presencial", icon: Users },
    { value: "Video Chamada", label: "📹 Vídeo Chamada", icon: Video },
    { value: "LinkedIn", label: "💼 LinkedIn", icon: Building },
  ]

  useEffect(() => {
    if (isOpen && budget) {
      setFormData({
        status: "",
        canal: "",
        observacoes: "",
      })
      setSmartAnalysis(null)
      setActiveTab("followup")
    }
  }, [isOpen, budget])

  const generateSmartAnalysis = async () => {
    if (!budget || !config.apiKey) return

    setIsAnalyzing(true)
    setCurrentAnalysisStep("Iniciando análise inteligente...")

    try {
      // Coletar dados contextuais
      const historico = budget.historico || []
      const diasAberto = budget.dias_followup || 0
      const valor = budget.valor || 0
      const ultimaInteracao = historico[0]?.observacoes || "Nenhuma interação anterior"

      setCurrentAnalysisStep("Analisando perfil do cliente...")

      const analysisPrompt = `
Você é um consultor sênior de vendas especializado em análise comportamental de clientes e técnicas avançadas de fechamento. 
Analise este orçamento com profundidade e forneça insights acionáveis para o vendedor.

DADOS DO ORÇAMENTO:
- Cliente: ${budget.cliente}
- Valor: R$ ${valor.toLocaleString("pt-BR")}
- Dias em aberto: ${diasAberto}
- Status atual: ${budget.status_atual || "Novo"}
- Segmento: ${this.inferirSegmento(budget.cliente)}
- Última interação: ${ultimaInteracao}

HISTÓRICO DE CONVERSAS (${historico.length} interações):
${
  historico
    .map(
      (h: any, i: number) =>
        `${i + 1}. [${new Date(h.data_hora_followup).toLocaleDateString("pt-BR")}] 
   Status: ${h.status} | Canal: ${h.canal_contato} 
   Observações: ${h.observacoes}`,
    )
    .join("\n") || "Nenhuma conversa anterior registrada"
}

ANÁLISE SOLICITADA:
Forneça uma análise JSON estruturada com:

{
  "probabilidade": número de 0-100 baseado em dados reais,
  "confianca": nível de confiança na análise (0-100),
  "categoria": "Alto Risco" | "Médio Risco" | "Baixo Risco" | "Oportunidade Quente",
  "segmento_cliente": categoria específica do cliente,
  "perfil_comportamental": personalidade do tomador de decisão inferida,
  "urgencia": nível de urgência percebida (1-10),
  "potencial_valor": análise do potencial real de receita,
  
  "motivos_detalhados": {
    "positivos": ["sinais positivos identificados"],
    "negativos": ["sinais de alerta"],
    "neutros": ["fatores neutros ou incertos"]
  },
  
  "analise_spin": {
    "situacao": "análise da situação atual do cliente",
    "problema": "problema/dor identificado ou inferido", 
    "implicacao": "implicações se não resolver o problema",
    "necessidade_pagamento": "necessidade de solução que justifique o investimento"
  },
  
  "gatilhos_mentais": ["gatilhos específicos para este perfil"],
  "alertas_comportamentais": ["comportamentos que indicam resistência ou interesse"],
  "oportunidades_upsell": ["possibilidades de expansão da venda"]
}

IMPORTANTE: 
- Base sua análise em evidências dos dados fornecidos
- Seja específico para este cliente e situação
- Use seu conhecimento de psicologia de vendas
- Identifique padrões comportamentais reais
- Forneça insights acionáveis, não genéricos
`

      setCurrentAnalysisStep("Processando análise SPIN...")

      const analysisResponse = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: analysisPrompt,
          config: {
            model: config.model || "gpt-4",
            temperature: 0.3,
            maxTokens: 1500,
            systemPrompt: `Você é um especialista em vendas com 20 anos de experiência em análise comportamental de clientes, SPIN Selling, psicologia de vendas e técnicas de fechamento. Forneça análises precisas, específicas e acionáveis.`,
          },
        }),
      })

      if (!analysisResponse.ok) throw new Error("Erro na análise")
      const analysisData = await analysisResponse.json()

      setCurrentAnalysisStep("Gerando estratégias personalizadas...")

      // Gerar estratégias detalhadas
      const strategiesPrompt = `
Com base na análise anterior do cliente ${budget.cliente}, você agora deve criar estratégias específicas e scripts de vendas.

CONTEXTO DA ANÁLISE ANTERIOR:
${analysisData.response}

GERE AGORA:

1. ESTRATÉGIAS PERSONALIZADAS (texto detalhado):
- Abordagem específica para este perfil de cliente
- Técnicas de rapport building adequadas
- Como abordar as objeções prováveis
- Sequência de argumentação mais efetiva
- Momentos ideais para avançar na venda

2. PRÓXIMOS PASSOS DETALHADOS (cronograma específico):
- Ações imediatas (próximas 24h)
- Ações de curto prazo (próximos 3-5 dias)
- Ações de médio prazo (próximas 2 semanas)
- Pontos de verificação e marcos

3. SCRIPTS SUGERIDOS:
- Script de abertura personalizado
- Respostas para 3 objeções mais prováveis
- Script de fechamento específico para o perfil

4. CRONOGRAMA DE AÇÃO:
- Lista de tarefas específicas com timing
- Frequência de contato recomendada
- Canais prioritários para cada etapa

Seja MUITO específico para este caso, não genérico.
`

      const strategiesResponse = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: strategiesPrompt,
          config: {
            model: config.model || "gpt-4",
            temperature: 0.7,
            maxTokens: 2000,
            systemPrompt: `Você é um coach de vendas elite. Crie estratégias específicas, práticas e detalhadas. Use técnicas comprovadas como SPIN Selling, psicologia de influência e análise comportamental.`,
          },
        }),
      })

      if (!strategiesResponse.ok) throw new Error("Erro ao gerar estratégias")
      const strategiesData = await strategiesResponse.json()

      setCurrentAnalysisStep("Finalizando análise...")

      // Processar resposta JSON
      let analysisJson: any = {}
      try {
        const jsonMatch = analysisData.response.match(/\{[\s\S]*?\}/)
        if (jsonMatch) {
          analysisJson = JSON.parse(jsonMatch[0])
        }
      } catch (e) {
        // Fallback para análise básica
        analysisJson = {
          probabilidade: this.calcularProbabilidade(budget, historico),
          categoria: this.determinarCategoria(diasAberto, valor),
          confianca: 70,
          segmento_cliente: this.inferirSegmento(budget.cliente),
          perfil_comportamental: "Aguardando mais dados",
          urgencia: Math.min(10, Math.max(1, Math.floor(diasAberto / 2))),
          potencial_valor: "Análise em andamento",
          motivos_detalhados: {
            positivos: ["Cliente demonstrou interesse inicial"],
            negativos: [`${diasAberto} dias sem fechamento`],
            neutros: ["Necessária mais investigação"],
          },
          analise_spin: {
            situacao: "Situação sendo mapeada",
            problema: "Problema a ser identificado",
            implicacao: "Implicações em análise",
            necessidade_pagamento: "Necessidade sendo qualificada",
          },
          gatilhos_mentais: ["Escassez", "Autoridade", "Prova social"],
          alertas_comportamentais: ["Tempo de resposta", "Interesse demonstrado"],
          oportunidades_upsell: ["A definir após qualificação"],
        }
      }

      // Extrair estratégias e scripts do texto de estratégias
      const strategiesText = strategiesData.response

      const extractSection = (text: string, sectionName: string): string => {
        const regex = new RegExp(`${sectionName}:?([\\s\\S]*?)(?=\\n\\d+\\.|$)`, "i")
        const match = text.match(regex)
        return match ? match[1].trim() : "Aguardando análise detalhada..."
      }

      // Montar análise completa
      const completeAnalysis: SmartAnalysis = {
        ...analysisJson,
        estrategias_personalizadas:
          extractSection(strategiesText, "ESTRATÉGIAS PERSONALIZADAS") || strategiesText.substring(0, 800),
        proximos_passos_detalhados: extractSection(strategiesText, "PRÓXIMOS PASSOS DETALHADOS"),
        scripts_sugeridos: {
          abertura: extractSection(strategiesText, "Script de abertura"),
          objecoes: [
            "Preço muito alto → 'Entendo sua preocupação...'",
            "Preciso pensar → 'Claro, quais pontos específicos...'",
            "Não tenho orçamento → 'Vamos ver como podemos...'",
          ],
          fechamento: extractSection(strategiesText, "Script de fechamento"),
        },
        cronograma_acao: {
          imediato: [`Ligar em até 2h`, `Enviar material específico`, `Agendar próxima conversa`],
          curto_prazo: [`Follow-up em 48h`, `Apresentar proposta`, `Negociar condições`],
          medio_prazo: [`Fechar negócio`, `Implementar solução`, `Buscar expansão`],
        },
      }

      setSmartAnalysis(completeAnalysis)
    } catch (error) {
      console.error("Erro na análise inteligente:", error)
      // Fallback para análise básica
      setSmartAnalysis({
        probabilidade: 50,
        categoria: "Médio Risco",
        confianca: 60,
        segmento_cliente: "Setor Público",
        perfil_comportamental: "Conservador",
        urgencia: 5,
        potencial_valor: "Médio potencial",
        motivos_detalhados: {
          positivos: ["Orçamento em análise"],
          negativos: ["Tempo prolongado em aberto"],
          neutros: ["Aguardando mais informações"],
        },
        analise_spin: {
          situacao: "Cliente em processo de análise",
          problema: "Necessidade de solução identificada",
          implicacao: "Atraso pode impactar operação",
          necessidade_pagamento: "Investimento justificado",
        },
        gatilhos_mentais: ["Autoridade", "Escassez", "Consenso"],
        estrategias_personalizadas: "Erro ao gerar estratégias. Tente novamente.",
        proximos_passos_detalhados: "Erro ao gerar próximos passos. Tente novamente.",
        scripts_sugeridos: {
          abertura: "Olá [Nome], estou ligando para dar seguimento à nossa proposta...",
          objecoes: ["Tratamento de objeções personalizado"],
          fechamento: "Baseado no que conversamos, faz sentido avançarmos?",
        },
        cronograma_acao: {
          imediato: ["Entrar em contato", "Qualificar necessidade"],
          curto_prazo: ["Apresentar proposta", "Negociar termos"],
          medio_prazo: ["Fechar negócio", "Implementar"],
        },
        alertas_comportamentais: ["Tempo de resposta lento"],
        oportunidades_upsell: ["A identificar"],
      })
    } finally {
      setIsAnalyzing(false)
      setCurrentAnalysisStep("")
    }
  }

  // Funções auxiliares para fallback
  const calcularProbabilidade = (budget: any, historico: any[]) => {
    let prob = 50 // base

    // Ajustar por tempo
    const dias = budget.dias_followup || 0
    if (dias < 5) prob += 20
    else if (dias < 15) prob += 10
    else if (dias > 30) prob -= 20

    // Ajustar por valor
    const valor = budget.valor || 0
    if (valor > 50000) prob += 10
    else if (valor < 5000) prob -= 10

    // Ajustar por histórico
    if (historico.length > 3) prob += 15
    else if (historico.length === 0) prob -= 10

    return Math.min(95, Math.max(5, prob))
  }

  const determinarCategoria = (dias: number, valor: number) => {
    if (dias > 30 || valor < 1000) return "Alto Risco"
    if (dias < 7 && valor > 10000) return "Oportunidade Quente"
    return "Médio Risco"
  }

  const inferirSegmento = (cliente: string) => {
    const lower = cliente.toLowerCase()
    if (lower.includes("prefeitura") || lower.includes("município") || lower.includes("governo")) {
      return "Setor Público"
    }
    if (lower.includes("ltda") || lower.includes("s.a") || lower.includes("eireli")) {
      return "Setor Privado"
    }
    return "A classificar"
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
        return "text-red-600 bg-red-50 border-red-200"
      case "Médio Risco":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "Baixo Risco":
        return "text-green-600 bg-green-50 border-green-200"
      case "Oportunidade Quente":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getRiskIcon = (categoria: string) => {
    switch (categoria) {
      case "Alto Risco":
        return <TrendingDown className="h-4 w-4" />
      case "Médio Risco":
        return <AlertTriangle className="h-4 w-4" />
      case "Baixo Risco":
        return <CheckCircle className="h-4 w-4" />
      case "Oportunidade Quente":
        return <TrendingUp className="h-4 w-4" />
      default:
        return <Target className="h-4 w-4" />
    }
  }

  const getUrgencyColor = (urgencia: number) => {
    if (urgencia >= 8) return "text-red-600"
    if (urgencia >= 6) return "text-yellow-600"
    if (urgencia >= 4) return "text-blue-600"
    return "text-green-600"
  }

  if (!budget) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader className="space-y-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="h-5 w-5" />
            Follow-up: {budget.cliente}
          </DialogTitle>
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <Badge variant="outline" className="font-mono">
              #{budget.sequencia}
            </Badge>
            <Badge variant="secondary" className="font-semibold">
              <DollarSign className="h-3 w-3 mr-1" />
              R$ {budget.valor?.toLocaleString("pt-BR")}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {budget.dias_followup || 0} dias em aberto
            </Badge>
            {smartAnalysis && (
              <Badge className={`${getRiskColor(smartAnalysis.categoria)} border`}>
                {getRiskIcon(smartAnalysis.categoria)}
                <span className="ml-1">{smartAnalysis.categoria}</span>
              </Badge>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followup" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Registrar Follow-up
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Análise Inteligente IA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="followup" className="space-y-6 overflow-y-auto max-h-[calc(95vh-200px)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-semibold">
                    Novo Status *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger className="h-11">
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

                <div className="space-y-2">
                  <Label htmlFor="canal" className="text-sm font-semibold">
                    Canal de Contato *
                  </Label>
                  <Select
                    value={formData.canal}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, canal: value }))}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Como foi o contato" />
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
                <Label htmlFor="observacoes" className="text-sm font-semibold">
                  Detalhes da Conversa *
                </Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Descreva detalhadamente o que foi conversado:&#10;• Qual foi a reação do cliente?&#10;• Quais objeções foram levantadas?&#10;• Que próximos passos foram acordados?&#10;• Como o cliente está se sentindo sobre a proposta?&#10;• Há alguma urgência ou prazo específico?"
                  rows={6}
                  className="resize-none text-sm leading-relaxed"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  📝 Seja específico e detalhado - essas informações alimentarão a análise IA
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="px-6 bg-transparent">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="px-6">
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

          <TabsContent value="analysis" className="space-y-4 overflow-y-auto max-h-[calc(95vh-200px)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-6 w-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">Análise Inteligente de Vendas</h3>
                  <p className="text-sm text-muted-foreground">
                    IA especializada em SPIN Selling e psicologia de vendas
                  </p>
                </div>
              </div>
              <Button
                onClick={generateSmartAnalysis}
                disabled={isAnalyzing || !config.apiKey}
                size="lg"
                className="px-6"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Gerar Análise Completa
                  </>
                )}
              </Button>
            </div>

            {!config.apiKey && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
                  <h3 className="font-semibold mb-2">Configure a API Key da IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Para usar a análise inteligente, configure sua API Key da OpenAI nas configurações do sistema.
                  </p>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">Análise em andamento...</p>
                      <p className="text-sm text-blue-600">{currentAnalysisStep}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {smartAnalysis && (
              <div className="space-y-6">
                {/* Métricas Principais */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Gauge className="h-3 w-3" />
                        PROBABILIDADE
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-blue-600">{smartAnalysis.probabilidade}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-1000"
                          style={{ width: `${smartAnalysis.probabilidade}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        CONFIANÇA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-2xl font-bold text-purple-600">{smartAnalysis.confianca}%</div>
                      <div className="text-xs text-muted-foreground">na análise</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        URGÊNCIA
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className={`text-2xl font-bold ${getUrgencyColor(smartAnalysis.urgencia)}`}>
                        {smartAnalysis.urgencia}/10
                      </div>
                      <div className="text-xs text-muted-foreground">nível de urgência</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        SEGMENTO
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-sm font-medium">{smartAnalysis.segmento_cliente}</div>
                      <div className="text-xs text-muted-foreground">{smartAnalysis.perfil_comportamental}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Análise SPIN Selling */}
                <Card className="border-indigo-200 bg-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-600" />
                      Análise SPIN Selling
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-xs text-indigo-800 mb-1">SITUAÇÃO</h4>
                        <p className="text-sm">{smartAnalysis.analise_spin.situacao}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-indigo-800 mb-1">PROBLEMA</h4>
                        <p className="text-sm">{smartAnalysis.analise_spin.problema}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-indigo-800 mb-1">IMPLICAÇÃO</h4>
                        <p className="text-sm">{smartAnalysis.analise_spin.implicacao}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-indigo-800 mb-1">NECESSIDADE-PAGAMENTO</h4>
                        <p className="text-sm">{smartAnalysis.analise_spin.necessidade_pagamento}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Motivos Detalhados */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                        <ThumbsUp className="h-4 w-4" />
                        Sinais Positivos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {smartAnalysis.motivos_detalhados.positivos.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200 bg-red-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-red-800">
                        <ThumbsDown className="h-4 w-4" />
                        Sinais de Alerta
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {smartAnalysis.motivos_detalhados.negativos.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-red-600 mt-0.5">⚠</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-gray-200 bg-gray-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-gray-800">
                        <Eye className="h-4 w-4" />
                        Pontos Neutros
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {smartAnalysis.motivos_detalhados.neutros.map((item, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-gray-600 mt-0.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Gatilhos Mentais */}
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                      <Zap className="h-4 w-4" />
                      Gatilhos Mentais Recomendados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {smartAnalysis.gatilhos_mentais.map((gatilho, i) => (
                        <Badge key={i} variant="secondary" className="bg-purple-100 text-purple-800">
                          {gatilho}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Estratégias e Próximos Passos */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Target className="h-4 w-4 text-green-600" />
                        Estratégias Personalizadas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 pr-3">
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {smartAnalysis.estrategias_personalizadas}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        Próximos Passos Detalhados
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64 pr-3">
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">
                          {smartAnalysis.proximos_passos_detalhados}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Scripts Sugeridos */}
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2 text-orange-800">
                      <MessageCircle className="h-4 w-4" />
                      Scripts de Vendas Sugeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-orange-800 mb-2">💬 Script de Abertura</h4>
                      <div className="bg-white p-3 rounded border text-sm">
                        {smartAnalysis.scripts_sugeridos.abertura}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-orange-800 mb-2">🛡️ Tratamento de Objeções</h4>
                      <div className="space-y-2">
                        {smartAnalysis.scripts_sugeridos.objecoes.map((objecao, i) => (
                          <div key={i} className="bg-white p-2 rounded border text-xs">
                            {objecao}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-sm text-orange-800 mb-2">🎯 Script de Fechamento</h4>
                      <div className="bg-white p-3 rounded border text-sm">
                        {smartAnalysis.scripts_sugeridos.fechamento}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cronograma de Ação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-blue-600" />
                      Cronograma de Ação Sugerido
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold text-xs text-red-600 mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          IMEDIATO (hoje)
                        </h4>
                        <ul className="space-y-1">
                          {smartAnalysis.cronograma_acao.imediato.map((acao, i) => (
                            <li key={i} className="text-xs flex items-start gap-1">
                              <span className="text-red-600 mt-0.5">●</span>
                              {acao}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-xs text-yellow-600 mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          CURTO PRAZO (2-5 dias)
                        </h4>
                        <ul className="space-y-1">
                          {smartAnalysis.cronograma_acao.curto_prazo.map((acao, i) => (
                            <li key={i} className="text-xs flex items-start gap-1">
                              <span className="text-yellow-600 mt-0.5">●</span>
                              {acao}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-semibold text-xs text-green-600 mb-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          MÉDIO PRAZO (1-2 semanas)
                        </h4>
                        <ul className="space-y-1">
                          {smartAnalysis.cronograma_acao.medio_prazo.map((acao, i) => (
                            <li key={i} className="text-xs flex items-start gap-1">
                              <span className="text-green-600 mt-0.5">●</span>
                              {acao}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Alertas e Oportunidades */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-yellow-800">
                        <AlertCircle className="h-4 w-4" />
                        Alertas Comportamentais
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {smartAnalysis.alertas_comportamentais.map((alerta, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600 mt-0.5">⚡</span>
                            {alerta}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2 text-green-800">
                        <Award className="h-4 w-4" />
                        Oportunidades de Upsell
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {smartAnalysis.oportunidades_upsell.map((oportunidade, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-green-600 mt-0.5">💰</span>
                            {oportunidade}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                {/* Rodapé da análise */}
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 pt-4 border-t">
                  <Brain className="h-3 w-3" />
                  <span>
                    Análise gerada por IA especializada em vendas • Confiança: {smartAnalysis.confianca}% • Baseada em
                    dados reais e técnicas comprovadas
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
