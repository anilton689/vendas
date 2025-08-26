"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  MessageSquare,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Brain,
  Target,
  Clock,
  MessageCircle,
  Shield,
  CheckSquare,
  BarChart3,
  RefreshCw,
} from "lucide-react"
import type { Budget } from "@/types/budget"

interface User {
  codigo: string
  nome: string
  tipo: "admin" | "vendedor"
}

interface FollowupFormProps {
  budget: Budget
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
}

export function FollowupForm({ budget, user, isOpen, onClose, onSubmit }: FollowupFormProps) {
  const [activeTab, setActiveTab] = useState<"followup" | "suggestions">("followup")
  const [status, setStatus] = useState("")
  const [canal, setCanal] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState("")

  // Estados para sugestões IA
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<any>(null)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [categoryContent, setCategoryContent] = useState<{ [key: string]: string }>({})

  const resetForm = () => {
    setStatus("")
    setCanal("")
    setObservacoes("")
    setSubmitMessage("")
    setSuggestions(null)
    setActiveCategory(null)
    setCategoryContent({})
    setActiveTab("followup")
  }

  useEffect(() => {
    if (isOpen) {
      resetForm()
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!status || !canal || !observacoes.trim()) {
      setSubmitMessage("Por favor, preencha todos os campos obrigatórios.")
      return
    }

    setIsSubmitting(true)
    setSubmitMessage("")

    try {
      await onSubmit({
        sequencia: budget.sequencia,
        status_novo: status,
        canal_contato: canal,
        observacoes: observacoes,
        vendedor_codigo: user?.codigo,
        vendedor_nome: user?.nome,
      })

      setSubmitMessage("Follow-up registrado com sucesso!")
      setTimeout(() => {
        onClose()
        resetForm()
      }, 1500)
    } catch (error) {
      setSubmitMessage("Erro ao registrar follow-up. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateSuggestions = async () => {
    setIsGenerating(true)

    try {
      // Simula análise IA avançada
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockSuggestions = {
        probabilidade: Math.floor(Math.random() * 40) + 40, // 40-80%
        confianca: Math.floor(Math.random() * 30) + 70, // 70-100%
        urgencia: Math.floor(Math.random() * 4) + 6, // 6-10
        segmento: ["Corporativo", "PME", "Governo", "Varejo"][Math.floor(Math.random() * 4)],
        analise_geral: `Baseado no histórico de ${budget.cliente}, identificamos um perfil ${budget.valor > 5000 ? "corporativo" : "PME"} com ${Math.floor(Math.random() * 15) + 10} dias de ciclo médio de vendas. O orçamento de R$ ${budget.valor.toLocaleString("pt-BR")} indica ${budget.valor > 10000 ? "alto potencial" : "potencial moderado"} de fechamento.`,
      }

      setSuggestions(mockSuggestions)
    } catch (error) {
      console.error("Erro ao gerar sugestões:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCategoryContent = async (category: string) => {
    if (categoryContent[category]) {
      setActiveCategory(activeCategory === category ? null : category)
      return
    }

    setActiveCategory(category)

    try {
      // Simula geração de conteúdo específico por categoria
      await new Promise((resolve) => setTimeout(resolve, 1500))

      let content = ""

      switch (category) {
        case "estrategias":
          content = `**ESTRATÉGIAS PERSONALIZADAS PARA ${budget.cliente.toUpperCase()}**

🎯 **Análise do Perfil:**
• Cliente ${budget.valor > 10000 ? "corporativo" : "PME"} com orçamento de R$ ${budget.valor.toLocaleString("pt-BR")}
• ${Math.floor(Math.random() * 15) + 10} dias em aberto - necessita abordagem ${Math.floor(Math.random() * 15) + 10 > 15 ? "urgente" : "estratégica"}
• Segmento: ${budget.valor > 5000 ? "B2B" : "B2C"} com potencial de expansão

💡 **Estratégias Recomendadas:**

1. **Abordagem Consultiva (SPIN Selling)**
   - Situação: "Como está funcionando o processo atual de [área relacionada]?"
   - Problema: "Quais são os principais desafios que vocês enfrentam?"
   - Implicação: "O que acontece se isso não for resolvido nos próximos meses?"
   - Necessidade: "Qual seria o impacto de resolver isso definitivamente?"

2. **Gatilhos Mentais Específicos:**
   - **Escassez**: "Temos apenas 3 vagas para implementação este mês"
   - **Autoridade**: "Empresas como [concorrente] já implementaram soluções similares"
   - **Prova Social**: "95% dos nossos clientes veem ROI em 60 dias"

3. **Estratégia de Valor:**
   - Demonstre ROI específico para o segmento
   - Apresente cases de sucesso similares
   - Ofereça garantias ou período de teste`
          break

        case "timing":
          content = `**CRONOGRAMA ESTRATÉGICO DE CONTATOS**

⏰ **Timing Ideal Baseado em Análise Comportamental:**

📅 **HOJE (Ação Imediata):**
• Horário: ${Math.random() > 0.5 ? "14h-16h" : "9h-11h"} (maior taxa de resposta)
• Canal: ${budget.telefone_cliente ? "Ligação telefônica" : "E-mail"} + WhatsApp
• Objetivo: Quebrar o gelo e agendar reunião técnica
• Script: "Olá [nome], vi que vocês solicitaram orçamento para [produto/serviço]. Tenho algumas ideias que podem otimizar ainda mais o resultado em até 30%. Posso falar rapidamente?"

📅 **AMANHÃ (+1 dia):**
• Follow-up por e-mail com material técnico
• Enviar case de sucesso similar
• Propor reunião virtual de 30 minutos

📅 **+3 DIAS:**
• Ligação de acompanhamento
• Verificar se recebeu o material
• Identificar objeções ou dúvidas

📅 **+7 DIAS:**
• Abordagem de urgência suave
• Mencionar outros interessados (escassez)
• Propor condições especiais

🎯 **Frequência Recomendada:**
• Primeira semana: Contato a cada 2 dias
• Segunda semana: Contato a cada 3 dias
• Terceira semana: Contato semanal com valor agregado`
          break

        case "abordagem":
          content = `**SCRIPTS DE ABORDAGEM PERSONALIZADOS**

📞 **ABERTURA TELEFÔNICA:**
"Olá [nome], aqui é [seu nome] da [empresa]. Estou ligando sobre o orçamento ${budget.sequencia} que vocês solicitaram. Tenho ${Math.floor(Math.random() * 3) + 2} minutos para compartilhar uma ideia que pode aumentar o resultado em até 30%. Posso falar rapidamente?"

📧 **E-MAIL DE REATIVAÇÃO:**
Assunto: "💡 Ideia para otimizar seu projeto - ${budget.cliente}"

"Olá [nome],

Analisando seu projeto de R$ ${budget.valor.toLocaleString("pt-BR")}, identifiquei 3 oportunidades de melhoria que outros clientes do seu segmento aproveitaram:

1. [Benefício específico 1]
2. [Benefício específico 2]  
3. [Benefício específico 3]

Que tal conversarmos 15 minutos amanhã às ${Math.random() > 0.5 ? "14h" : "10h"}? Posso mostrar exatamente como isso funcionaria no seu caso.

Abraços,
[Seu nome]"

💬 **WHATSAPP (Informal):**
"Oi [nome]! 👋 
Sobre aquele orçamento de R$ ${budget.valor.toLocaleString("pt-BR")}...
Acabei de ver um case MUITO similar ao seu que deu super certo! 🚀
Posso te mostrar rapidamente? São só 10 min no Zoom 😊"

🤝 **REUNIÃO PRESENCIAL/VIRTUAL:**
1. **Quebra-gelo** (2 min): Perguntar sobre o negócio/desafios atuais
2. **Descoberta** (10 min): Aplicar SPIN Selling
3. **Apresentação** (15 min): Focar nos benefícios identificados
4. **Fechamento** (3 min): Próximos passos claros`
          break

        case "objecoes":
          content = `**MANUAL DE OBJEÇÕES E RESPOSTAS**

💰 **"ESTÁ MUITO CARO"**
Resposta: "Entendo sua preocupação com o investimento. Vamos analisar o custo x benefício: se isso resolver [problema identificado], qual seria o valor disso para vocês mensalmente? Geralmente nossos clientes recuperam o investimento em [X] meses."

⏰ **"PRECISO PENSAR"**
Resposta: "Claro, é uma decisão importante. Para te ajudar a pensar melhor, quais são os 2 ou 3 pontos principais que você gostaria de avaliar? Posso esclarecer isso agora mesmo."

🏢 **"PRECISO CONSULTAR A DIRETORIA"**
Resposta: "Perfeito! Para facilitar sua apresentação para a diretoria, que tal eu preparar um resumo executivo com ROI projetado? Quando seria a reunião deles?"

🔄 **"VAMOS AGUARDAR O PRÓXIMO ANO"**
Resposta: "Entendo. Só para eu entender melhor: o que mudaria no próximo ano que tornaria isso mais prioritário? Porque se o problema existe hoje, o custo de não resolver pode ser maior que o investimento."

🏪 **"ESTAMOS AVALIANDO OUTRAS OPÇÕES"**
Resposta: "Ótimo, é importante comparar. Posso perguntar quais critérios são mais importantes para vocês na decisão? Assim posso destacar como nos diferenciamos nesses pontos."

⚡ **TÉCNICA DE REVERSÃO:**
Transforme objeção em pergunta:
• "Caro" → "O que seria um investimento justo para resolver isso?"
• "Não tenho tempo" → "Quando seria o momento ideal para implementar?"
• "Não funciona" → "O que precisaria funcionar para ser perfeito para vocês?"`
          break

        case "fechamento":
          content = `**TÉCNICAS DE FECHAMENTO AVANÇADAS**

🎯 **FECHAMENTO ASSUMPTIVO:**
"Perfeito! Vou preparar o contrato para começarmos na próxima semana. Prefere que eu envie hoje à tarde ou amanhã de manhã?"

⚖️ **FECHAMENTO ALTERNATIVO:**
"Duas opções para você: podemos começar com o pacote básico de R$ [valor] ou partir direto para o completo de R$ [valor]. Qual faz mais sentido para o momento de vocês?"

⏰ **FECHAMENTO DE URGÊNCIA:**
"Olha, tenho uma vaga na agenda de implementação para esta semana. Se confirmarmos hoje, consigo garantir o início imediato. Caso contrário, só teria disponibilidade em [data futura]."

🎁 **FECHAMENTO COM BÔNUS:**
"Se fecharmos hoje, posso incluir [bônus específico] sem custo adicional. É algo que normalmente cobramos R$ [valor], mas vejo que vocês realmente precisam disso."

📊 **FECHAMENTO BASEADO EM DADOS:**
"Baseado no que conversamos, o ROI seria de [X]% em [Y] meses. Considerando que vocês gastam R$ [valor] mensalmente com [problema atual], isso se paga sozinho. Faz sentido começarmos?"

🤝 **FECHAMENTO CONSULTIVO:**
"Pelo que entendi, vocês precisam resolver [problema] até [prazo]. Nossa solução resolve exatamente isso em [tempo]. O que precisa acontecer da sua parte para tomarmos essa decisão hoje?"

✅ **SINAIS DE COMPRA A OBSERVAR:**
• Pergunta sobre prazos de implementação
• Quer saber sobre suporte/garantia
• Pergunta sobre formas de pagamento
• Menciona como vai apresentar internamente
• Fala sobre próximos passos

🚨 **QUANDO USAR CADA TÉCNICA:**
• **Assumptivo**: Cliente já demonstrou interesse claro
• **Alternativo**: Cliente indeciso entre opções
• **Urgência**: Cliente procrastinando
• **Bônus**: Cliente focado no preço
• **Dados**: Cliente analítico/técnico
• **Consultivo**: Relacionamento já estabelecido`
          break
      }

      setCategoryContent((prev) => ({
        ...prev,
        [category]: content,
      }))
    } catch (error) {
      console.error("Erro ao gerar conteúdo:", error)
    }
  }

  const categories = [
    { id: "estrategias", label: "Estratégias", color: "bg-red-100 text-red-700 hover:bg-red-200", icon: Target },
    { id: "timing", label: "Timing", color: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200", icon: Clock },
    { id: "abordagem", label: "Abordagem", color: "bg-blue-100 text-blue-700 hover:bg-blue-200", icon: MessageCircle },
    { id: "objecoes", label: "Objeções", color: "bg-purple-100 text-purple-700 hover:bg-purple-200", icon: Shield },
    {
      id: "fechamento",
      label: "Fechamento",
      color: "bg-green-100 text-green-700 hover:bg-green-200",
      icon: CheckSquare,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <MessageSquare className="h-5 w-5" />
                Follow-up: {budget.cliente}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 mt-2">
                <span>
                  Orçamento {budget.sequencia} - R$ {budget.valor.toLocaleString("pt-BR")} -{" "}
                  {Math.floor((new Date().getTime() - new Date(budget.data).getTime()) / (1000 * 60 * 60 * 24))} dias em
                  aberto
                </span>
                <Badge className="bg-blue-100 text-blue-700">IA Estratégica</Badge>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex border-b px-6">
          <button
            onClick={() => setActiveTab("followup")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "followup"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Follow-up
          </button>
          <button
            onClick={() => setActiveTab("suggestions")}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === "suggestions"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Brain className="h-4 w-4" />
            Sugestões IA
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "followup" ? (
            <ScrollArea className="h-[500px] p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Novo Status *</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="orcamento_enviado">Orçamento Enviado</SelectItem>
                        <SelectItem value="em_negociacao">Em Negociação</SelectItem>
                        <SelectItem value="aguardando_aprovacao">Aguardando Aprovação</SelectItem>
                        <SelectItem value="pedido_fechado">Pedido Fechado</SelectItem>
                        <SelectItem value="orcamento_perdido">Orçamento Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="canal">Canal de Contato *</Label>
                    <Select value={canal} onValueChange={setCanal}>
                      <SelectTrigger>
                        <SelectValue placeholder="Como foi o contato?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="telefone">📞 Telefone</SelectItem>
                        <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                        <SelectItem value="email">📧 E-mail</SelectItem>
                        <SelectItem value="presencial">🤝 Presencial</SelectItem>
                        <SelectItem value="video_chamada">💻 Vídeo Chamada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações da Conversa *</Label>
                  <Textarea
                    id="observacoes"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    placeholder="Descreva detalhadamente a conversa, objeções, próximos passos, etc..."
                    className="min-h-[120px]"
                  />
                </div>

                {submitMessage && (
                  <div
                    className={`p-3 rounded-md ${
                      submitMessage.includes("sucesso")
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {submitMessage.includes("sucesso") ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {submitMessage}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
            </ScrollArea>
          ) : (
            <div className="h-[500px] p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-blue-600" />
                    Sugestões Estratégicas IA
                  </h3>
                  <p className="text-sm text-gray-600">
                    Análise baseada no histórico de interações e padrões de comportamento
                  </p>
                </div>
                <Button onClick={generateSuggestions} disabled={isGenerating} className="bg-blue-600 hover:bg-blue-700">
                  {isGenerating ? (
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

              <ScrollArea className="h-[400px]">
                {!suggestions ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Brain className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Sugestões Estratégicas Personalizadas</h4>
                    <p className="text-gray-600 max-w-md">
                      Clique em "Gerar Sugestões" para receber análises baseadas em IA sobre o histórico de interações
                      deste orçamento.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Análise Geral */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Análise Geral do Cliente
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-blue-700">{suggestions.analise_geral}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{suggestions.probabilidade}%</div>
                            <div className="text-xs text-blue-600">Probabilidade</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{suggestions.confianca}%</div>
                            <div className="text-xs text-green-600">Confiança</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-orange-600">{suggestions.urgencia}/10</div>
                            <div className="text-xs text-orange-600">Urgência</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{suggestions.segmento}</div>
                            <div className="text-xs text-purple-600">Segmento</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Categorias de Sugestões */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      {categories.map((category) => {
                        const Icon = category.icon
                        const isActive = activeCategory === category.id
                        const hasContent = categoryContent[category.id]

                        return (
                          <Button
                            key={category.id}
                            variant="outline"
                            onClick={() => generateCategoryContent(category.id)}
                            className={`${category.color} border-2 h-auto p-4 flex flex-col items-center gap-2 transition-all ${
                              isActive ? "ring-2 ring-blue-500" : ""
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{category.label}</span>
                            {hasContent && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                          </Button>
                        )
                      })}
                    </div>

                    {/* Conteúdo da Categoria Ativa */}
                    {activeCategory && categoryContent[activeCategory] && (
                      <Card className="mt-4">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            {React.createElement(categories.find((c) => c.id === activeCategory)?.icon || Target, {
                              className: "h-5 w-5",
                            })}
                            {categories.find((c) => c.id === activeCategory)?.label}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                              {categoryContent[activeCategory]}
                            </pre>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
