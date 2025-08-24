"use client"

import { useState } from "react"

interface ProposalData {
  cliente: string
  valor: number
  diasAberto: number
  statusAtual: string
  observacoes: string
  historico: any[]
}

interface AIAnalysis {
  probabilidade: number
  motivos: string[]
  estrategias: string[]
  proximosPassos: string[]
}

export function useAIAssistant() {
  const [isLoading, setIsLoading] = useState(false)

  const analyzeProposal = async (data: ProposalData): Promise<AIAnalysis> => {
    setIsLoading(true)
    try {
      const config = JSON.parse(localStorage.getItem("ai-config") || "{}")
      if (!config.apiKey) {
        throw new Error("IA não configurada. Configure a API Key primeiro.")
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `${config.analysisPrompt}

Dados do orçamento:
- Cliente: ${data.cliente}
- Valor: R$ ${data.valor.toLocaleString("pt-BR")}
- Dias em aberto: ${data.diasAberto}
- Status atual: ${data.statusAtual}
- Observações: ${data.observacoes}
- Histórico: ${data.historico.length} interações

Forneça uma análise estruturada em formato JSON com:
{
  "probabilidade": número de 0 a 100,
  "motivos": ["motivo1", "motivo2", ...],
  "estrategias": ["estrategia1", "estrategia2", ...],
  "proximosPassos": ["passo1", "passo2", ...]
}`,
          config,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro na análise IA")
      }

      const result = await response.json()

      // Tentar extrair JSON da resposta
      try {
        const jsonMatch = result.response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.warn("Erro ao parsear JSON, usando resposta padrão")
      }

      // Fallback se não conseguir parsear JSON
      return {
        probabilidade: 50,
        motivos: ["Análise baseada nos dados fornecidos"],
        estrategias: ["Manter contato regular", "Identificar objeções"],
        proximosPassos: ["Agendar nova conversa", "Enviar proposta revisada"],
      }
    } catch (error) {
      console.error("Erro na análise IA:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const chatWithAI = async (message: string, context: ProposalData): Promise<string> => {
    setIsLoading(true)
    try {
      const config = JSON.parse(localStorage.getItem("ai-config") || "{}")
      if (!config.apiKey) {
        throw new Error("IA não configurada. Configure a API Key primeiro.")
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Contexto do orçamento:
- Cliente: ${context.cliente}
- Valor: R$ ${context.valor.toLocaleString("pt-BR")}
- Dias em aberto: ${context.diasAberto}
- Status: ${context.statusAtual}
- Observações: ${context.observacoes}

Pergunta do vendedor: ${message}`,
          config,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro no chat IA")
      }

      const result = await response.json()
      return result.response
    } catch (error) {
      console.error("Erro no chat IA:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    analyzeProposal,
    chatWithAI,
    isLoading,
  }
}
