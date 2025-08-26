"use client"

import { useState, useEffect } from "react"

interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  followupPrompt: string
  analysisPrompt: string
  isConfigured: boolean
}

const defaultConfig: AIConfig = {
  model: "gpt-4o-mini",
  temperature: 0.7,
  maxTokens: 1000,
  systemPrompt:
    "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil.",
  followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up em formato de lista clara:

• **Próxima Ação:** [Qual a melhor abordagem para este cliente?]
• **Timing:** [Quando fazer o próximo contato?]
• **Argumentos:** [Que argumentos usar?]
• **Objeções:** [Como superar possíveis objeções?]
• **Estratégia:** [Estratégia específica para este caso]

Use SEMPRE este formato de lista com bullets (•) e negrito (**) nos títulos.
Seja direto e prático. Máximo 5 pontos.`,
  analysisPrompt:
    "Analise este orçamento e forneça: 1) Probabilidade de fechamento (0-100%), 2) Motivos que influenciam positivamente, 3) Estratégias recomendadas, 4) Próximos passos sugeridos.",
  isConfigured: false,
}

export function useAIConfig() {
  const [config, setConfig] = useState<AIConfig>(defaultConfig)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Carregar configuração do localStorage (sem API Key)
    const savedConfig = localStorage.getItem("ai-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        // Remover apiKey se existir (migração)
        delete parsed.apiKey
        const mergedConfig = { ...defaultConfig, ...parsed, isConfigured: true }
        setConfig(mergedConfig)
        console.log("✅ Configuração da IA carregada do localStorage:", {
          model: mergedConfig.model,
          temperature: mergedConfig.temperature,
        })
      } catch (error) {
        console.error("❌ Erro ao carregar configuração da IA:", error)
      }
    }
  }, [])

  const updateConfig = (newConfig: AIConfig) => {
    const configWithFlag = {
      ...newConfig,
      isConfigured: true,
    }
    setConfig(configWithFlag)
    // Salvar sem API Key (apenas configurações do modelo)
    const configToSave = { ...configWithFlag }
    delete (configToSave as any).apiKey
    localStorage.setItem("ai-config", JSON.stringify(configToSave))
    console.log("✅ Configuração da IA atualizada:", {
      model: configWithFlag.model,
      isConfigured: configWithFlag.isConfigured,
    })
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    try {
      console.log("🧪 Testando conexão com IA usando API Key do servidor...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Teste de conexão - responda apenas 'Conexão OK'",
          budget: null,
          config: {
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
