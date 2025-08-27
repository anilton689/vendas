"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import {
  MessageSquare,
  Brain,
  TrendingUp,
  Target,
  Lightbulb,
  Copy,
  CheckCircle,
  ArrowRight,
  Clock,
  User,
  Phone,
  Mail,
  MessageCircle,
  Calendar,
  FileText,
  Zap,
  Shield,
  Loader2,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface FollowupFormProps {
  budget: Budget
  user: any
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

interface StepData {
  customerInfo?: {
    interestLevel: string
    mainConcern: string
    additionalInfo: string
  }
  followupData?: {
    status: string
    nextAction: string
    scheduledDate: string
    notes: string
  }
  analysis?: {
    closingProbability: number
    riskLevel: string
    psychologyProfile: string
    mentalTriggers: string[]
    personalizedScript: string
    nextSteps: string[]
  }
}

export function FollowupForm({ budget, user, isOpen, onClose, onSubmit }: FollowupFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState<StepData>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = [
    { id: 1, title: "Informações", icon: MessageSquare, description: "Dados do cliente" },
    { id: 2, title: "Follow-up", icon: FileText, description: "Ações e status" },
    { id: 3, title: "Análise IA", icon: Brain, description: "Processamento inteligente" },
    { id: 4, title: "Resultados", icon: Target, description: "Estratégias e próximos passos" },
  ]

  const interestLevels = [
    {
      value: "muito_interessado",
      label: "Muito Interessado",
      description: "Cliente demonstra grande interesse",
      color: "bg-green-100 border-green-300 text-green-800",
      icon: "🟢",
    },
    {
      value: "interessado",
      label: "Interessado",
      description: "Cliente mostra interesse moderado",
      color: "bg-yellow-100 border-yellow-300 text-yellow-800",
      icon: "🟡",
    },
    {
      value: "neutro",
      label: "Neutro",
      description: "Cliente não demonstra posição clara",
      color: "bg-gray-100 border-gray-300 text-gray-800",
      icon: "⚪",
    },
    {
      value: "resistente",
      label: "Resistente",
      description: "Cliente apresenta objeções",
      color: "bg-orange-100 border-orange-300 text-orange-800",
      icon: "🟠",
    },
    {
      value: "desinteressado",
      label: "Desinteressado",
      description: "Cliente não demonstra interesse",
      color: "bg-red-100 border-red-300 text-red-800",
      icon: "🔴",
    },
  ]

  const statusOptions = [
    { value: "orcamento_enviado", label: "Orçamento Enviado", color: "blue" },
    { value: "aguardando_analise", label: "Aguardando Análise", color: "yellow" },
    { value: "em_negociacao", label: "Em Negociação", color: "orange" },
    { value: "aguardando_aprovacao", label: "Aguardando Aprovação", color: "purple" },
    { value: "pedido_fechado", label: "Pedido Fechado", color: "green" },
    { value: "orcamento_perdido", label: "Orçamento Perdido", color: "red" },
  ]

  const nextActions = [
    { value: "ligar", label: "Ligar para o cliente", icon: Phone },
    { value: "email", label: "Enviar email", icon: Mail },
    { value: "whatsapp", label: "Mensagem WhatsApp", icon: MessageCircle },
    { value: "reuniao", label: "Agendar reunião", icon: Calendar },
    { value: "proposta", label: "Enviar nova proposta", icon: FileText },
    { value: "aguardar", label: "Aguardar retorno", icon: Clock },
  ]

  const generateAIAnalysis = async () => {
    setIsAnalyzing(true)

    // Simular análise da IA baseada nos dados coletados
    await new Promise((resolve) => setTimeout(resolve, 3000))

    const { customerInfo, followupData } = stepData

    // Análise baseada no nível de interesse
    let closingProbability = 50
    let riskLevel = "medium"
    let psychologyProfile = "Comprador Padrão"

    if (customerInfo?.interestLevel === "muito_interessado") {
      closingProbability = 85
      riskLevel = "low"
      psychologyProfile = "Comprador Entusiasmado"
    } else if (customerInfo?.interestLevel === "interessado") {
      closingProbability = 70
      riskLevel = "low"
      psychologyProfile = "Comprador Analítico"
    } else if (customerInfo?.interestLevel === "neutro") {
      closingProbability = 45
      riskLevel = "medium"
      psychologyProfile = "Comprador Cauteloso"
    } else if (customerInfo?.interestLevel === "resistente") {
      closingProbability = 25
      riskLevel = "high"
      psychologyProfile = "Comprador Cético"
    } else if (customerInfo?.interestLevel === "desinteressado") {
      closingProbability = 10
      riskLevel = "very_high"
      psychologyProfile = "Comprador Relutante"
    }

    const mentalTriggers = [
      "Escassez: Oferta limitada no tempo",
      "Autoridade: Referências de outros clientes",
      "Reciprocidade: Benefícios exclusivos",
      "Prova Social: Cases de sucesso similares",
    ]

    const personalizedScript = `Olá ${budget.cliente}, 

Com base na nossa conversa anterior sobre ${customerInfo?.mainConcern || "suas necessidades"}, preparei uma proposta personalizada que atende exatamente ao que você precisa.

Nossos clientes similares obtiveram resultados excepcionais com esta solução. Posso agendar 15 minutos para mostrar como isso se aplicaria ao seu caso específico?

Atenciosamente,
${user?.nome || "Vendedor"}`

    const nextSteps = [
      `${followupData?.nextAction === "ligar" ? "Ligar" : "Contatar"} cliente em 24h`,
      "Enviar material complementar",
      "Agendar demonstração personalizada",
      "Preparar proposta final",
    ]

    const analysis = {
      closingProbability,
      riskLevel,
      psychologyProfile,
      mentalTriggers,
      personalizedScript,
      nextSteps,
    }

    setStepData((prev) => ({ ...prev, analysis }))
    setIsAnalyzing(false)
  }

  const handleNext = async () => {
    if (currentStep === 3 && !stepData.analysis) {
      await generateAIAnalysis()
    }
    setCurrentStep((prev) => Math.min(prev + 1, 4))
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        budget,
        ...stepData,
      })
      onClose()
    } catch (error) {
      console.error("Erro ao submeter:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyScript = () => {
    if (stepData.analysis?.personalizedScript) {
      navigator.clipboard.writeText(stepData.analysis.personalizedScript)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <MessageSquare className="h-12 w-12 text-blue-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Informações do Cliente</h3>
        <p className="text-gray-600">Como foi o último contato com o cliente?</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-3">1. Nível de Interesse do Cliente *</label>
          <div className="space-y-2">
            {interestLevels.map((level) => (
              <label
                key={level.value}
                className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  stepData.customerInfo?.interestLevel === level.value
                    ? level.color
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="interestLevel"
                  value={level.value}
                  checked={stepData.customerInfo?.interestLevel === level.value}
                  onChange={(e) =>
                    setStepData((prev) => ({
                      ...prev,
                      customerInfo: { ...prev.customerInfo, interestLevel: e.target.value },
                    }))
                  }
                  className="sr-only"
                />
                <span className="text-lg mr-3">{level.icon}</span>
                <div className="flex-1">
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm opacity-75">{level.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">2. Principal Preocupação do Cliente *</label>
          <Select
            value={stepData.customerInfo?.mainConcern || ""}
            onValueChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                customerInfo: { ...prev.customerInfo, mainConcern: value },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a principal preocupação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="preco">Preço / Orçamento</SelectItem>
              <SelectItem value="prazo">Prazo de entrega</SelectItem>
              <SelectItem value="qualidade">Qualidade do produto/serviço</SelectItem>
              <SelectItem value="suporte">Suporte pós-venda</SelectItem>
              <SelectItem value="aprovacao">Aprovação interna</SelectItem>
              <SelectItem value="concorrencia">Comparação com concorrentes</SelectItem>
              <SelectItem value="outro">Outro motivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">3. Informações Adicionais (Opcional)</label>
          <Textarea
            placeholder="Detalhes importantes da conversa, objeções específicas, próximos passos mencionados..."
            value={stepData.customerInfo?.additionalInfo || ""}
            onChange={(e) =>
              setStepData((prev) => ({
                ...prev,
                customerInfo: { ...prev.customerInfo, additionalInfo: e.target.value },
              }))
            }
            rows={3}
          />
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Dados do Follow-up</h3>
        <p className="text-gray-600">Defina o status e próximas ações</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Status Atual do Orçamento *</label>
          <Select
            value={stepData.followupData?.status || ""}
            onValueChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                followupData: { ...prev.followupData, status: value },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Próxima Ação *</label>
          <Select
            value={stepData.followupData?.nextAction || ""}
            onValueChange={(value) =>
              setStepData((prev) => ({
                ...prev,
                followupData: { ...prev.followupData, nextAction: value },
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a próxima ação" />
            </SelectTrigger>
            <SelectContent>
              {nextActions.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  <div className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Data/Hora Agendada (Opcional)</label>
          <input
            type="datetime-local"
            className="w-full p-2 border border-gray-300 rounded-md"
            value={stepData.followupData?.scheduledDate || ""}
            onChange={(e) =>
              setStepData((prev) => ({
                ...prev,
                followupData: { ...prev.followupData, scheduledDate: e.target.value },
              }))
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Observações do Follow-up *</label>
          <Textarea
            placeholder="Descreva o que foi conversado, acordos feitos, próximos passos..."
            value={stepData.followupData?.notes || ""}
            onChange={(e) =>
              setStepData((prev) => ({
                ...prev,
                followupData: { ...prev.followupData, notes: e.target.value },
              }))
            }
            rows={4}
          />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Brain className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Análise Inteligente</h3>
        <p className="text-gray-600">IA processando seus dados para gerar insights</p>
      </div>

      {isAnalyzing ? (
        <div className="text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium mb-2">Analisando dados...</p>
          <p className="text-gray-600 mb-4">A IA está processando as informações coletadas</p>
          <Progress value={66} className="w-full max-w-md mx-auto" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Resumo dos Dados Coletados
              </h4>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Nível de Interesse:</strong>{" "}
                  {interestLevels.find((l) => l.value === stepData.customerInfo?.interestLevel)?.label ||
                    "Não informado"}
                </p>
                <p>
                  <strong>Principal Preocupação:</strong> {stepData.customerInfo?.mainConcern || "Não informado"}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {statusOptions.find((s) => s.value === stepData.followupData?.status)?.label || "Não informado"}
                </p>
                <p>
                  <strong>Próxima Ação:</strong>{" "}
                  {nextActions.find((a) => a.value === stepData.followupData?.nextAction)?.label || "Não informado"}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button onClick={generateAIAnalysis} className="bg-gradient-to-r from-green-600 to-blue-600">
              <Brain className="h-4 w-4 mr-2" />
              Gerar Análise Completa
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-12 w-12 text-purple-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Resultados da Análise</h3>
        <p className="text-gray-600">Estratégias personalizadas para este cliente</p>
      </div>

      {stepData.analysis && (
        <div className="space-y-4">
          {/* Dashboard de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-800">{stepData.analysis.closingProbability}%</div>
                <div className="text-sm text-green-700">Probabilidade de Fechamento</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-blue-800">{stepData.analysis.psychologyProfile}</div>
                <div className="text-sm text-blue-700">Perfil Psicológico</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-bold text-purple-800 capitalize">{stepData.analysis.riskLevel}</div>
                <div className="text-sm text-purple-700">Nível de Risco</div>
              </CardContent>
            </Card>
          </div>

          {/* Gatilhos Mentais */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Gatilhos Mentais Recomendados
              </h4>
              <div className="space-y-2">
                {stepData.analysis.mentalTriggers.map((trigger, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <Lightbulb className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">{trigger}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Script Personalizado */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  Script Personalizado
                </h4>
                <Button variant="outline" size="sm" onClick={copyScript}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copiar
                </Button>
              </div>
              <div className="bg-gray-50 p-3 rounded border text-sm whitespace-pre-wrap">
                {stepData.analysis.personalizedScript}
              </div>
            </CardContent>
          </Card>

          {/* Próximos Passos */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-green-500" />
                Próximos Passos Estratégicos
              </h4>
              <div className="space-y-2">
                {stepData.analysis.nextSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return stepData.customerInfo?.interestLevel && stepData.customerInfo?.mainConcern
      case 2:
        return stepData.followupData?.status && stepData.followupData?.nextAction && stepData.followupData?.notes
      case 3:
        return stepData.analysis
      case 4:
        return true
      default:
        return false
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Follow-up Inteligente
          </DialogTitle>
          <div className="text-sm text-gray-600">
            {budget.cliente} • R$ {budget.valor.toLocaleString("pt-BR")} • Seq: {budget.sequencia}
          </div>
          <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
            <Brain className="h-3 w-3 mr-1" />
            IA Avançada
          </Badge>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    currentStep >= step.id ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 text-gray-400"
                  }`}
                >
                  <step.icon className="h-4 w-4" />
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-sm font-medium ${currentStep >= step.id ? "text-blue-600" : "text-gray-400"}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && <ArrowRight className="h-4 w-4 text-gray-300 mx-4 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4 max-h-[60vh]">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 pt-0 border-t flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            disabled={currentStep === 1}
          >
            Voltar
          </Button>

          <div className="flex gap-2">
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Finalizar Follow-up
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
