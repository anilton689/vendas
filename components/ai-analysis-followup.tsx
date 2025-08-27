"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Brain,
  Target,
  MessageSquare,
  User,
  Clock,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  Zap,
  Heart,
  Shield,
  Sparkles,
  BarChart3,
  Settings,
  Play,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface AIAnalysisFollowupProps {
  budget: Budget
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
}

interface AIAnalysis {
  spinAnalysis: {
    situation: { score: number; insights: string; questions: string[] }
    problem: { score: number; insights: string; questions: string[] }
    implication: { score: number; insights: string; questions: string[] }
    needPayoff: { score: number; insights: string; questions: string[] }
  }
  psychProfile: {
    personality: string
    decisionStyle: string
    motivators: string[]
    fears: string[]
    mentalTriggers: string[]
  }
  strategy: {
    nextActions: string[]
    scripts: { opening: string; objections: string; closing: string }
    timeline: string[]
    riskFactors: string[]
    opportunities: string[]
  }
  closingProbability: number
}

export function AIAnalysisFollowup({ budget, isOpen, onClose, onSubmit }: AIAnalysisFollowupProps) {
  const [activeTab, setActiveTab] = useState("analysis")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  // Configurações da análise
  const [analysisConfig, setAnalysisConfig] = useState({
    focus: "complete", // complete, spin, psychology, objections, closing
    urgency: [5],
    depth: "standard", // quick, standard, deep
    includeScripts: true,
    includePsychProfile: true,
    includeTimeline: true,
  })

  // Follow-up form
  const [followupData, setFollowupData] = useState({
    status: "",
    channel: "",
    notes: "",
    nextAction: "",
    nextDate: "",
    priority: "medium",
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const generateAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      // Simular análise IA (aqui você integraria com a API real)
      await new Promise((resolve) => setTimeout(resolve, 3000))

      const mockAnalysis: AIAnalysis = {
        spinAnalysis: {
          situation: {
            score: 85,
            insights: `Cliente ${budget.cliente} está em processo de expansão industrial. Empresa consolidada no setor com ${calculateDaysOpen(budget.data)} dias de relacionamento ativo.`,
            questions: [
              "Como está o crescimento da sua operação atual?",
              "Quais são os principais desafios operacionais hoje?",
              "Que mudanças vocês planejam para os próximos 6 meses?",
            ],
          },
          problem: {
            score: 72,
            insights:
              "Identificamos necessidades de otimização de processos e redução de custos operacionais. O timing do orçamento sugere urgência.",
            questions: [
              "Qual o impacto dos custos atuais no seu resultado?",
              "Que problemas isso tem causado na operação?",
              "Como isso afeta a competitividade da empresa?",
            ],
          },
          implication: {
            score: 68,
            insights:
              "Atraso na decisão pode resultar em perda de oportunidades de mercado e aumento de custos operacionais.",
            questions: [
              "Se não resolvermos isso agora, qual será o impacto em 6 meses?",
              "Como isso afetará seus resultados financeiros?",
              "Que oportunidades vocês podem perder?",
            ],
          },
          needPayoff: {
            score: 79,
            insights: "Solução oferece ROI estimado de 300% em 12 meses, com redução de 25% nos custos operacionais.",
            questions: [
              "Imagine economizar 25% nos custos operacionais - que diferença faria?",
              "Como um ROI de 300% impactaria seus planos de expansão?",
              "Que novas oportunidades isso abriria para vocês?",
            ],
          },
        },
        psychProfile: {
          personality: "Analítico-Controlador",
          decisionStyle: "Baseado em dados e ROI",
          motivators: ["Eficiência", "Resultados Financeiros", "Reconhecimento"],
          fears: ["Risco Financeiro", "Falha na Implementação", "Perda de Controle"],
          mentalTriggers: ["Escassez", "Autoridade", "Prova Social", "Reciprocidade"],
        },
        strategy: {
          nextActions: [
            "Enviar case de sucesso similar do setor industrial",
            "Agendar apresentação técnica com equipe decisora",
            "Preparar proposta de piloto com ROI garantido",
            "Conectar com cliente referência para depoimento",
            "Definir cronograma de implementação detalhado",
          ],
          scripts: {
            opening: `Olá ${budget.cliente}, vi que vocês estão avaliando soluções para otimização. Tenho um case muito similar ao de vocês que gerou 300% de ROI. Posso compartilhar os resultados?`,
            objections: `Entendo a preocupação com investimento. Por isso sugiro começarmos com um piloto de 30 dias, sem risco. Se não atingirmos 15% de economia, não cobramos nada. Que tal?`,
            closing: `Baseado no que conversamos, nossa solução resolve exatamente seus desafios e oferece o ROI que vocês precisam. Posso preparar a proposta para começarmos na próxima semana?`,
          },
          timeline: [
            "Hoje: Envio de case e agendamento",
            "Amanhã: Apresentação técnica",
            "3 dias: Proposta de piloto",
            "1 semana: Decisão final",
            "2 semanas: Início da implementação",
          ],
          riskFactors: [
            "Concorrência pode estar pressionando",
            "Orçamento pode estar limitado no final do ano",
            "Decisor pode estar sobrecarregado",
          ],
          opportunities: [
            "Empresa em expansão = maior necessidade",
            "Final de ano = pressão por resultados",
            "Relacionamento de longo prazo estabelecido",
          ],
        },
        closingProbability: 76,
      }

      setAnalysis(mockAnalysis)
    } catch (error) {
      console.error("Erro na análise:", error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const calculateDaysOpen = (dateString: string): number => {
    const today = new Date()
    const [year, month, day] = dateString.split("-").map(Number)
    const budgetDate = new Date(year, month - 1, day)
    const diffTime = today.getTime() - budgetDate.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100"
    if (score >= 60) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return "from-green-500 to-emerald-600"
    if (prob >= 50) return "from-yellow-500 to-orange-600"
    return "from-red-500 to-pink-600"
  }

  const handleFollowupSubmit = () => {
    onSubmit({
      ...followupData,
      budget: budget,
      analysis: analysis,
      timestamp: new Date().toISOString(),
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🧠 Análise IA & Follow-up Avançado
              </DialogTitle>
              <DialogDescription className="text-lg mt-2">
                <span className="font-semibold">{budget.cliente}</span> • Orçamento #{budget.sequencia} • R${" "}
                {budget.valor.toLocaleString("pt-BR")} • {calculateDaysOpen(budget.data)} dias em aberto
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-blue-50 to-purple-50">
                <TabsTrigger value="analysis" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Análise IA
                </TabsTrigger>
                <TabsTrigger value="strategy" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Estratégia
                </TabsTrigger>
                <TabsTrigger value="followup" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Follow-up
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 px-6">
              <TabsContent value="analysis" className="space-y-6 mt-6">
                {/* Configurações da Análise */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Configuração da Análise IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Foco da Análise</label>
                        <Select
                          value={analysisConfig.focus}
                          onValueChange={(value) => setAnalysisConfig({ ...analysisConfig, focus: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="complete">🎯 Análise Completa</SelectItem>
                            <SelectItem value="spin">🔄 SPIN Selling</SelectItem>
                            <SelectItem value="psychology">🧠 Psicologia</SelectItem>
                            <SelectItem value="objections">⚡ Objeções</SelectItem>
                            <SelectItem value="closing">🏆 Fechamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Nível de Urgência: {analysisConfig.urgency[0]}
                        </label>
                        <Slider
                          value={analysisConfig.urgency}
                          onValueChange={(value) => setAnalysisConfig({ ...analysisConfig, urgency: value })}
                          max={10}
                          min={1}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Profundidade</label>
                        <Select
                          value={analysisConfig.depth}
                          onValueChange={(value) => setAnalysisConfig({ ...analysisConfig, depth: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="quick">⚡ Rápida</SelectItem>
                            <SelectItem value="standard">📊 Padrão</SelectItem>
                            <SelectItem value="deep">🔬 Profunda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={analysisConfig.includeScripts}
                            onCheckedChange={(checked) =>
                              setAnalysisConfig({ ...analysisConfig, includeScripts: checked })
                            }
                          />
                          <label className="text-sm">Scripts</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={analysisConfig.includePsychProfile}
                            onCheckedChange={(checked) =>
                              setAnalysisConfig({ ...analysisConfig, includePsychProfile: checked })
                            }
                          />
                          <label className="text-sm">Perfil Psicológico</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={analysisConfig.includeTimeline}
                            onCheckedChange={(checked) =>
                              setAnalysisConfig({ ...analysisConfig, includeTimeline: checked })
                            }
                          />
                          <label className="text-sm">Timeline</label>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={generateAnalysis}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {isAnalyzing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analisando com IA...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Gerar Análise IA Completa
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Resultados da Análise */}
                {analysis && (
                  <div className="space-y-6">
                    {/* Probabilidade de Fechamento */}
                    <Card className="border-2 border-purple-200">
                      <CardContent className="p-6">
                        <div className="text-center">
                          <div
                            className={`inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-r ${getProbabilityColor(analysis.closingProbability)} text-white text-3xl font-bold mb-4`}
                          >
                            {analysis.closingProbability}%
                          </div>
                          <h3 className="text-xl font-bold mb-2">Probabilidade de Fechamento</h3>
                          <p className="text-gray-600">
                            {analysis.closingProbability >= 75
                              ? "🎯 Alta probabilidade - Cliente quente!"
                              : analysis.closingProbability >= 50
                                ? "⚡ Probabilidade moderada - Trabalhar objeções"
                                : "🔥 Baixa probabilidade - Focar em aquecimento"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Análise SPIN */}
                    <Card>
                      <CardHeader className="cursor-pointer" onClick={() => toggleSection("spin")}>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Análise SPIN Selling
                          </div>
                          {expandedSections.spin ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </CardTitle>
                      </CardHeader>
                      {expandedSections.spin && (
                        <CardContent className="space-y-4">
                          {Object.entries(analysis.spinAnalysis).map(([key, data]) => (
                            <div key={key} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold capitalize">
                                  {key === "needPayoff" ? "Need-Payoff" : key}
                                </h4>
                                <Badge className={`${getScoreColor(data.score)} font-bold`}>{data.score}/100</Badge>
                              </div>
                              <p className="text-gray-700 mb-3">{data.insights}</p>
                              <div>
                                <h5 className="font-medium mb-2">Perguntas Sugeridas:</h5>
                                <ul className="space-y-1">
                                  {data.questions.map((question, idx) => (
                                    <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                      <span className="text-blue-500 mt-1">•</span>
                                      {question}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      )}
                    </Card>

                    {/* Perfil Psicológico */}
                    {analysisConfig.includePsychProfile && (
                      <Card>
                        <CardHeader className="cursor-pointer" onClick={() => toggleSection("psych")}>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <User className="h-5 w-5" />
                              Perfil Psicológico do Cliente
                            </div>
                            {expandedSections.psych ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        {expandedSections.psych && (
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Brain className="h-4 w-4" />
                                    Tipo de Personalidade
                                  </h4>
                                  <Badge variant="outline" className="mt-1">
                                    {analysis.psychProfile.personality}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Estilo de Decisão
                                  </h4>
                                  <p className="text-sm text-gray-600 mt-1">{analysis.psychProfile.decisionStyle}</p>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Heart className="h-4 w-4" />
                                    Motivadores
                                  </h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {analysis.psychProfile.motivators.map((motivator, idx) => (
                                      <Badge key={idx} className="bg-green-100 text-green-800">
                                        {motivator}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold flex items-center gap-2">
                                    <Shield className="h-4 w-4" />
                                    Medos/Objeções
                                  </h4>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {analysis.psychProfile.fears.map((fear, idx) => (
                                      <Badge key={idx} className="bg-red-100 text-red-800">
                                        {fear}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold flex items-center gap-2 mb-2">
                                <Zap className="h-4 w-4" />
                                Gatilhos Mentais Recomendados
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {analysis.psychProfile.mentalTriggers.map((trigger, idx) => (
                                  <Badge key={idx} className="bg-purple-100 text-purple-800">
                                    {trigger}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="strategy" className="space-y-6 mt-6">
                {analysis && (
                  <div className="space-y-6">
                    {/* Próximas Ações */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Play className="h-5 w-5" />
                          Próximas Ações Recomendadas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {analysis.strategy.nextActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                {idx + 1}
                              </div>
                              <p className="text-gray-700">{action}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Scripts Personalizados */}
                    {analysisConfig.includeScripts && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Scripts Personalizados
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-4">
                            <div className="border rounded-lg p-4 bg-green-50">
                              <h4 className="font-semibold text-green-800 mb-2">🎯 Script de Abertura</h4>
                              <p className="text-gray-700 italic">"{analysis.strategy.scripts.opening}"</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-yellow-50">
                              <h4 className="font-semibold text-yellow-800 mb-2">⚡ Tratamento de Objeções</h4>
                              <p className="text-gray-700 italic">"{analysis.strategy.scripts.objections}"</p>
                            </div>
                            <div className="border rounded-lg p-4 bg-purple-50">
                              <h4 className="font-semibold text-purple-800 mb-2">🏆 Script de Fechamento</h4>
                              <p className="text-gray-700 italic">"{analysis.strategy.scripts.closing}"</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Timeline e Riscos/Oportunidades */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {analysisConfig.includeTimeline && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Timeline Recomendada
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {analysis.strategy.timeline.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                  <p className="text-sm text-gray-700">{item}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-600" />
                              Fatores de Risco
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {analysis.strategy.riskFactors.map((risk, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                  <p className="text-sm text-gray-700">{risk}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Lightbulb className="h-5 w-5 text-green-600" />
                              Oportunidades
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              {analysis.strategy.opportunities.map((opportunity, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <Lightbulb className="h-4 w-4 text-green-500 mt-0.5" />
                                  <p className="text-sm text-gray-700">{opportunity}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="followup" className="space-y-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5" />
                      Registrar Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Status do Orçamento</label>
                        <Select
                          value={followupData.status}
                          onValueChange={(value) => setFollowupData({ ...followupData, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="interesse_alto">🔥 Interesse Alto</SelectItem>
                            <SelectItem value="interesse_medio">⚡ Interesse Médio</SelectItem>
                            <SelectItem value="interesse_baixo">❄️ Interesse Baixo</SelectItem>
                            <SelectItem value="aguardando_decisao">⏳ Aguardando Decisão</SelectItem>
                            <SelectItem value="objecoes">⚠️ Objeções Identificadas</SelectItem>
                            <SelectItem value="proposta_enviada">📋 Proposta Enviada</SelectItem>
                            <SelectItem value="negociacao">💬 Em Negociação</SelectItem>
                            <SelectItem value="pedido_fechado">✅ Pedido Fechado</SelectItem>
                            <SelectItem value="orcamento_perdido">❌ Orçamento Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Canal de Contato</label>
                        <Select
                          value={followupData.channel}
                          onValueChange={(value) => setFollowupData({ ...followupData, channel: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Como foi o contato?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="telefone">📞 Telefone</SelectItem>
                            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                            <SelectItem value="email">📧 E-mail</SelectItem>
                            <SelectItem value="presencial">🤝 Presencial</SelectItem>
                            <SelectItem value="videochamada">📹 Videochamada</SelectItem>
                            <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Observações do Follow-up</label>
                      <Textarea
                        value={followupData.notes}
                        onChange={(e) => setFollowupData({ ...followupData, notes: e.target.value })}
                        placeholder="Descreva o que foi conversado, objeções, próximos passos..."
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Próxima Ação</label>
                        <Select
                          value={followupData.nextAction}
                          onValueChange={(value) => setFollowupData({ ...followupData, nextAction: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Qual a próxima ação?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ligar_amanha">📞 Ligar Amanhã</SelectItem>
                            <SelectItem value="enviar_proposta">📋 Enviar Proposta</SelectItem>
                            <SelectItem value="agendar_reuniao">📅 Agendar Reunião</SelectItem>
                            <SelectItem value="enviar_material">📎 Enviar Material</SelectItem>
                            <SelectItem value="aguardar_retorno">⏳ Aguardar Retorno</SelectItem>
                            <SelectItem value="follow_up_semanal">📆 Follow-up Semanal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Data da Próxima Ação</label>
                        <input
                          type="date"
                          value={followupData.nextDate}
                          onChange={(e) => setFollowupData({ ...followupData, nextDate: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Prioridade</label>
                      <Select
                        value={followupData.priority}
                        onValueChange={(value) => setFollowupData({ ...followupData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">🔴 Alta</SelectItem>
                          <SelectItem value="medium">🟡 Média</SelectItem>
                          <SelectItem value="low">🟢 Baixa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={onClose}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleFollowupSubmit}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Salvar Follow-up
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
