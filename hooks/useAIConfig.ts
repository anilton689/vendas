"use client"

import { useState, useEffect } from "react"

interface AIConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  followupPrompt: string
  analysisPrompt: string
  isConfigured: boolean
}

const defaultConfig: AIConfig = {
  apiKey: "",
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt:
    "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil.",
  followupPrompt:
    "Baseado nas informações do orçamento, sugira uma mensagem de follow-up profissional e persuasiva para {canal}. Considere o tempo decorrido e status atual.",
  analysisPrompt:
    "Analise este orçamento e forneça: 1) Probabilidade de fechamento (0-100%), 2) Motivos que influenciam positivamente, 3) Estratégias recomendadas, 4) Próximos passos sugeridos.",
  isConfigured: false,
}

export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Carregar configuração do localStorage
    const savedConfig = localStorage.getItem("ai-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        const mergedConfig = { ...defaultConfig, ...parsed }
        setConfig(mergedConfig)
        console.log("✅ Configuração da IA carregada do localStorage:", {
          hasApiKey: !!mergedConfig.apiKey,
          model: mergedConfig.model,
        })
      } catch (error) {
        console.error("❌ Erro ao carregar configuração da IA:", error)
      }
    }
  }, [])

  const updateConfig = (newConfig: AIConfig) => {
    const configWithFlag = {
      ...newConfig,
      isConfigured: !!newConfig.apiKey,
    }
    setConfig(configWithFlag)
    localStorage.setItem("ai-config", JSON.stringify(configWithFlag))
    console.log("✅ Configuração da IA atualizada:", {
      hasApiKey: !!configWithFlag.apiKey,
      isConfigured: configWithFlag.isConfigured,
    })
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    if (!config.apiKey) {
      return { success: false, message: "API Key não configurada" }
    }

    setIsLoading(true)
    try {
      console.log("🧪 Testando conexão com IA...", {
        hasApiKey: !!config.apiKey,
        apiKeyStart: config.apiKey.substring(0, 7) + "...",
      })

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Teste de conexão - responda apenas 'Conexão OK'",
          budget: null,
          config: {
            apiKey: config.apiKey,
            model: config.model,
            temperature: config.temperature,
            maxTokens: 100,
            systemPrompt: "Você é um assistente de teste. Responda apenas 'Conexão OK'.",
          },
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Teste de conexão bem-sucedido:", data)
        return { success: true, message: "✅ Conexão com OpenAI estabelecida com sucesso!" }
      } else {
        const errorData = await response.json()
        console.error("❌ Erro no teste de conexão:", errorData)
        return { success: false, message: `❌ Erro: ${errorData.error || "Falha na conexão"}` }
      }
    } catch (error: any) {
      console.error("❌ Erro de rede no teste:", error)
      return { success: false, message: `❌ Erro de rede: ${error.message}` }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    config,
    updateConfig,
    testConnection,
    isLoading,
  }
}
