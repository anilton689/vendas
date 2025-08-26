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
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Função para buscar configuração da planilha
  const fetchConfigFromSheet = async (): Promise<AIConfig | null> => {
    try {
      const adminConfig = localStorage.getItem("admin-sheets-config")
      if (!adminConfig) {
        console.log("🔍 [useAIConfig] Configuração da planilha não encontrada")
        return null
      }

      const { apiKey, spreadsheetId } = JSON.parse(adminConfig)
      if (!apiKey || !spreadsheetId) {
        console.log("🔍 [useAIConfig] API Key ou Spreadsheet ID não configurados")
        return null
      }

      console.log("📊 [useAIConfig] Buscando configuração da IA na planilha...")

      const range = "ConfigIA!A:B"
      const encodedRange = encodeURIComponent(range)
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`

      const response = await fetch(url)

      if (!response.ok) {
        console.error("❌ [useAIConfig] Erro ao buscar ConfigIA:", response.status, response.statusText)
        return null
      }

      const data = await response.json()

      if (!data.values || data.values.length === 0) {
        console.warn("⚠️ [useAIConfig] Aba ConfigIA não encontrada ou vazia")
        return null
      }

      console.log("📋 [useAIConfig] Dados da aba ConfigIA:", data.values)

      // Processar dados da planilha
      const configData: any = {}

      // Pular cabeçalho (linha 1) e processar dados
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

      console.log("🔧 [useAIConfig] Configuração processada:", configData)

      // Montar configuração final
      const sheetConfig: AIConfig = {
        model: configData.model || defaultConfig.model,
        temperature: Number.parseFloat(configData.temperature) || defaultConfig.temperature,
        maxTokens: Number.parseInt(configData.maxTokens) || defaultConfig.maxTokens,
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

  // Função para carregar configuração (planilha + cache)
  const loadConfig = async () => {
    setIsLoading(true)

    try {
      // Verificar cache (atualizar a cada 5 minutos)
      const now = Date.now()
      const cacheExpiry = 5 * 60 * 1000 // 5 minutos

      if (now - lastFetch < cacheExpiry) {
        console.log("📦 [useAIConfig] Usando configuração em cache")
        setIsLoading(false)
        return
      }

      // Tentar buscar da planilha
      const sheetConfig = await fetchConfigFromSheet()

      if (sheetConfig) {
        setConfig(sheetConfig)
        setLastFetch(now)

        // Salvar cache local para performance
        localStorage.setItem(
          "ai-config-cache",
          JSON.stringify({
            config: sheetConfig,
            timestamp: now,
          }),
        )

        console.log("✅ [useAIConfig] Configuração atualizada da planilha")
      } else {
        // Fallback: tentar cache local
        const cachedData = localStorage.getItem("ai-config-cache")
        if (cachedData) {
          try {
            const { config: cachedConfig } = JSON.parse(cachedData)
            setConfig(cachedConfig)
            console.log("📦 [useAIConfig] Usando configuração do cache local")
          } catch (error) {
            console.error("❌ [useAIConfig] Erro ao carregar cache:", error)
            setConfig({ ...defaultConfig, isConfigured: true })
          }
        } else {
          console.log("🔄 [useAIConfig] Usando configuração padrão")
          setConfig({ ...defaultConfig, isConfigured: true })
        }
      }
    } catch (error) {
      console.error("❌ [useAIConfig] Erro ao carregar configuração:", error)
      setConfig({ ...defaultConfig, isConfigured: true })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadConfig()
  }, [])

  const updateConfig = async (newConfig: AIConfig) => {
    try {
      console.log("💾 [useAIConfig] Atualizando configuração na planilha...")

      // Atualizar estado local imediatamente
      setConfig({ ...newConfig, isConfigured: true })

      // Tentar salvar na planilha via Apps Script
      const writeEndpoint = localStorage.getItem("write-endpoint")
      if (!writeEndpoint) {
        console.warn("⚠️ [useAIConfig] URL do Apps Script não configurada")
        return
      }

      // Preparar dados para envio
      const configData = {
        action: "updateConfigIA",
        data: {
          model: newConfig.model,
          temperature: newConfig.temperature.toString(),
          maxTokens: newConfig.maxTokens.toString(),
          systemPrompt: newConfig.systemPrompt,
          followupPrompt: newConfig.followupPrompt,
          analysisPrompt: newConfig.analysisPrompt,
        },
      }

      console.log("📤 [useAIConfig] Enviando configuração para Apps Script:", configData)

      // Criar form para envio
      const form = document.createElement("form")
      form.method = "POST"
      form.action = writeEndpoint
      form.style.display = "none"

      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "json_data"
      input.value = JSON.stringify(configData)
      form.appendChild(input)

      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)

      console.log("✅ [useAIConfig] Configuração enviada para a planilha")

      // Atualizar cache local
      const now = Date.now()
      localStorage.setItem(
        "ai-config-cache",
        JSON.stringify({
          config: newConfig,
          timestamp: now,
        }),
      )
      setLastFetch(now)
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
    setLastFetch(0) // Forçar atualização
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
