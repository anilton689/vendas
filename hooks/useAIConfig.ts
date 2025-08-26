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

  // Função para buscar configuração da planilha usando a mesma API que o sistema já usa
  const fetchConfigFromSheet = async (): Promise<AIConfig | null> => {
    try {
      // Usar as mesmas configurações que o sistema já usa para acessar a planilha
      const adminConfig = localStorage.getItem("admin-sheets-config")
      if (!adminConfig) {
        console.log("🔍 [useAIConfig] Configuração da planilha não encontrada no localStorage")
        return null
      }

      const { apiKey, spreadsheetId } = JSON.parse(adminConfig)
      if (!apiKey || !spreadsheetId) {
        console.log("🔍 [useAIConfig] API Key ou Spreadsheet ID não configurados")
        return null
      }

      console.log("📊 [useAIConfig] Buscando configuração da IA na planilha ConfigIA...")
      console.log("🔑 [useAIConfig] Usando API Key:", apiKey.substring(0, 20) + "...")
      console.log("📋 [useAIConfig] Spreadsheet ID:", spreadsheetId)

      // Buscar dados da aba ConfigIA
      const range = "ConfigIA!A:B"
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?key=${apiKey}`

      console.log("🌐 [useAIConfig] URL da requisição:", url)

      const response = await fetch(url)
      console.log("📡 [useAIConfig] Status da resposta:", response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ [useAIConfig] Erro na requisição:", errorText)
        return null
      }

      const data = await response.json()
      console.log("📋 [useAIConfig] Dados recebidos da planilha:", data)

      if (!data.values || data.values.length === 0) {
        console.warn("⚠️ [useAIConfig] Aba ConfigIA não encontrada ou vazia")
        return null
      }

      // Processar dados da planilha
      const configData: Record<string, string> = {}

      // Pular cabeçalho (linha 1) e processar dados
      for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i]
        if (row && row.length >= 2) {
          const tipo = String(row[0] || "").trim()
          const valor = String(row[1] || "").trim()

          if (tipo && valor) {
            configData[tipo] = valor
            console.log(`📝 [useAIConfig] ${tipo}: ${valor.substring(0, 50)}...`)
          }
        }
      }

      console.log("🔧 [useAIConfig] Configuração processada:", Object.keys(configData))

      // Montar configuração final com dados da planilha
      const sheetConfig: AIConfig = {
        model: configData.model || defaultConfig.model,
        temperature: configData.temperature ? Number.parseFloat(configData.temperature) : defaultConfig.temperature,
        maxTokens: configData.maxTokens ? Number.parseInt(configData.maxTokens) : defaultConfig.maxTokens,
        systemPrompt: configData.systemPrompt || defaultConfig.systemPrompt,
        followupPrompt: configData.followupPrompt || defaultConfig.followupPrompt,
        analysisPrompt: configData.analysisPrompt || defaultConfig.analysisPrompt,
        isConfigured: true,
      }

      console.log("✅ [useAIConfig] Configuração da IA carregada da planilha:", {
        model: sheetConfig.model,
        temperature: sheetConfig.temperature,
        maxTokens: sheetConfig.maxTokens,
        systemPromptLength: sheetConfig.systemPrompt.length,
        followupPromptLength: sheetConfig.followupPrompt.length,
        analysisPromptLength: sheetConfig.analysisPrompt.length,
      })

      return sheetConfig
    } catch (error) {
      console.error("❌ [useAIConfig] Erro ao buscar configuração da planilha:", error)
      return null
    }
  }

  // Função para carregar configuração sempre da planilha
  const loadConfig = async () => {
    setIsLoading(true)

    try {
      console.log("🔄 [useAIConfig] Carregando configuração da IA...")

      // Sempre tentar buscar da planilha primeiro
      const sheetConfig = await fetchConfigFromSheet()

      if (sheetConfig) {
        setConfig(sheetConfig)
        console.log("✅ [useAIConfig] Configuração carregada da planilha com sucesso")
      } else {
        // Fallback para configuração padrão
        console.log("🔄 [useAIConfig] Usando configuração padrão (planilha não acessível)")
        setConfig({ ...defaultConfig, isConfigured: true })
      }
    } catch (error) {
      console.error("❌ [useAIConfig] Erro ao carregar configuração:", error)
      setConfig({ ...defaultConfig, isConfigured: true })
    } finally {
      setIsLoading(false)
    }
  }

  // Carregar configuração quando o hook é inicializado
  useEffect(() => {
    loadConfig()
  }, [])

  const updateConfig = async (newConfig: AIConfig) => {
    try {
      console.log("💾 [useAIConfig] Atualizando configuração...")

      // Atualizar estado local imediatamente
      setConfig({ ...newConfig, isConfigured: true })

      console.log("✅ [useAIConfig] Configuração atualizada localmente")
    } catch (error) {
      console.error("❌ [useAIConfig] Erro ao atualizar configuração:", error)
    }
  }

  const testConnection = async (): Promise<{ success: boolean; message: string }> => {
    setIsLoading(true)
    try {
      console.log("🧪 [useAIConfig] Testando conexão com IA usando API Key do servidor...")

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
        console.log("✅ [useAIConfig] Teste de conexão bem-sucedido:", data)
        return { success: true, message: "✅ Conexão com OpenAI estabelecida com sucesso!" }
      } else {
        const errorData = await response.json()
        console.error("❌ [useAIConfig] Erro no teste de conexão:", errorData)
        return { success: false, message: `❌ Erro: ${errorData.error || "Falha na conexão"}` }
      }
    } catch (error: any) {
      console.error("❌ [useAIConfig] Erro de rede no teste:", error)
      return { success: false, message: `❌ Erro de rede: ${error.message}` }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshConfig = async () => {
    console.log("🔄 [useAIConfig] Forçando atualização da configuração...")
    await loadConfig()
  }

  return {
    config,
    updateConfig,
    testConnection,
    isLoading,
    refreshConfig,
    reloadConfig: loadConfig,
  }
}
