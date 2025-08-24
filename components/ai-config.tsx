"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Settings,
  TestTube,
  Save,
  CheckCircle,
  AlertCircle,
  Sparkles,
  MessageSquare,
  BarChart3,
  Eye,
  EyeOff,
} from "lucide-react"

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

export function AIConfig() {
  const [config, setConfig] = useState<AIConfig>({
    apiKey:
      "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",
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `Você é um assistente especializado em vendas e follow-up de orçamentos. 
Seu objetivo é ajudar vendedores a fechar mais negócios através de análises inteligentes e sugestões estratégicas.
Seja sempre prático, direto e focado em resultados.`,
    followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up:
- Qual a melhor abordagem para este cliente?
- Quando fazer o próximo contato?
- Que argumentos usar?
- Como superar possíveis objeções?`,
    analysisPrompt: `Analise este orçamento e forneça:
1. Probabilidade de fechamento (0-100%)
2. Principais motivos que podem influenciar a decisão
3. Estratégias recomendadas
4. Próximos passos sugeridos`,
    isConfigured: true,
  })

  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPrompts, setIsSavingPrompts] = useState(false)

  useEffect(() => {
    // Carregar configuração salva ou usar a configuração padrão
    const savedConfig = localStorage.getItem("ai-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        setConfig((prev) => ({ ...prev, ...parsed }))
        console.log("✅ Configuração da IA carregada:", { hasApiKey: !!parsed.apiKey })
      } catch (error) {
        console.error("❌ Erro ao carregar configuração da IA:", error)
        // Usar configuração padrão se houver erro
        saveConfig()
      }
    } else {
      // Salvar configuração padrão se não existir
      saveConfig()
    }
  }, [])

  const saveConfig = () => {
    setIsSaving(true)
    try {
      const configToSave = {
        ...config,
        isConfigured: !!config.apiKey,
      }
      localStorage.setItem("ai-config", JSON.stringify(configToSave))
      setConfig(configToSave)
      setTestResult({ success: true, message: "✅ Configuração salva com sucesso!" })
      console.log("✅ Configuração da IA salva:", { hasApiKey: !!configToSave.apiKey })
    } catch (error) {
      console.error("❌ Erro ao salvar configuração:", error)
      setTestResult({ success: false, message: "❌ Erro ao salvar configuração" })
    } finally {
      setIsSaving(false)
    }
  }

  const savePrompts = () => {
    setIsSavingPrompts(true)
    try {
      const configToSave = {
        ...config,
        isConfigured: !!config.apiKey,
      }
      localStorage.setItem("ai-config", JSON.stringify(configToSave))
      setConfig(configToSave)
      setTestResult({ success: true, message: "✅ Prompts salvos com sucesso!" })
      console.log("✅ Prompts da IA salvos:", {
        systemPrompt: configToSave.systemPrompt.length,
        followupPrompt: configToSave.followupPrompt.length,
        analysisPrompt: configToSave.analysisPrompt.length,
      })
    } catch (error) {
      console.error("❌ Erro ao salvar prompts:", error)
      setTestResult({ success: false, message: "❌ Erro ao salvar prompts" })
    } finally {
      setTimeout(() => {
        setIsSavingPrompts(false)
      }, 1000)
    }
  }

  const testConnection = async () => {
    if (!config.apiKey) {
      setTestResult({ success: false, message: "❌ API Key é obrigatória para o teste" })
      return
    }

    setIsLoading(true)
    setTestResult(null)

    console.log("🧪 Testando conexão com IA...", {
      hasApiKey: !!config.apiKey,
      model: config.model,
      apiKeyStart: config.apiKey.substring(0, 7) + "...",
    })

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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

      console.log("📡 Resposta da API:", response.status, response.statusText)

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Teste bem-sucedido:", data)
        setTestResult({
          success: true,
          message: "✅ Conexão estabelecida com sucesso! IA está funcionando.",
        })
      } else {
        const errorData = await response.json()
        console.error("❌ Erro na API:", errorData)
        setTestResult({
          success: false,
          message: `❌ Erro na conexão: ${errorData.error || "Falha desconhecida"}`,
        })
      }
    } catch (error: any) {
      console.error("❌ Erro de rede:", error)
      setTestResult({
        success: false,
        message: `❌ Erro de rede: ${error.message}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const resetToDefaults = () => {
    setConfig((prev) => ({
      ...prev,
      model: "gpt-4o-mini",
      temperature: 0.7,
      maxTokens: 1000,
      systemPrompt: `Você é um assistente especializado em vendas e follow-up de orçamentos. 
Seu objetivo é ajudar vendedores a fechar mais negócios através de análises inteligentes e sugestões estratégicas.
Seja sempre prático, direto e focado em resultados.`,
      followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up:
- Qual a melhor abordagem para este cliente?
- Quando fazer o próximo contato?
- Que argumentos usar?
- Como superar possíveis objeções?`,
      analysisPrompt: `Analise este orçamento e forneça:
1. Probabilidade de fechamento (0-100%)
2. Principais motivos que podem influenciar a decisão
3. Estratégias recomendadas
4. Próximos passos sugeridos`,
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Configuração da IA - ChatGPT Integrado
          </CardTitle>
          <CardDescription>
            IA configurada automaticamente com ChatGPT para análises e sugestões personalizadas de vendas
          </CardDescription>
          <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            IA Configurada e Ativa
          </Badge>
        </CardHeader>
      </Card>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">🔑 Básico</TabsTrigger>
          <TabsTrigger value="prompts">💬 Prompts</TabsTrigger>
          <TabsTrigger value="advanced">⚙️ Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Básicas
              </CardTitle>
              <CardDescription>API Key do ChatGPT configurada automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key do ChatGPT *</Label>
                <div className="relative mt-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-proj-..."
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  ✅ API Key configurada automaticamente: {config.apiKey.substring(0, 12)}...
                </p>
              </div>

              <div>
                <Label htmlFor="model">Modelo da IA</Label>
                <select
                  id="model"
                  value={config.model}
                  onChange={(e) => setConfig({ ...config, model: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="gpt-4o-mini">GPT-4o Mini (Recomendado)</option>
                  <option value="gpt-4o">GPT-4o (Mais Avançado)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Mais Rápido)</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  GPT-4o Mini oferece o melhor custo-benefício para análises de vendas
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testConnection} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Bot className="h-4 w-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>

                <Button onClick={saveConfig} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">✅ IA Configurada Automaticamente:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• API Key do ChatGPT: Configurada</li>
                  <li>• Modelo: GPT-4o Mini (otimizado)</li>
                  <li>• Prompts: Especializados em vendas</li>
                  <li>• Status: Pronta para uso</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Prompts Personalizados
              </CardTitle>
              <CardDescription>Prompts otimizados para análises de vendas e follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Defina a personalidade e comportamento da IA..."
                  value={config.systemPrompt}
                  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Define como a IA se comporta e qual é seu papel principal</p>
              </div>

              <div>
                <Label htmlFor="followupPrompt">Prompt para Follow-ups</Label>
                <Textarea
                  id="followupPrompt"
                  placeholder="Instruções para sugestões de follow-up..."
                  value={config.followupPrompt}
                  onChange={(e) => setConfig({ ...config, followupPrompt: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Usado quando a IA sugere estratégias de follow-up</p>
              </div>

              <div>
                <Label htmlFor="analysisPrompt">Prompt para Análises</Label>
                <Textarea
                  id="analysisPrompt"
                  placeholder="Instruções para análise de orçamentos..."
                  value={config.analysisPrompt}
                  onChange={(e) => setConfig({ ...config, analysisPrompt: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para análises detalhadas de probabilidade de fechamento
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetToDefaults} variant="outline">
                  Restaurar Padrões
                </Button>
                <Button onClick={savePrompts} className="bg-green-600 hover:bg-green-700 text-white">
                  {isSavingPrompts ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Salvando Prompts...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Prompts
                    </>
                  )}
                </Button>
              </div>

              {isSavingPrompts && (
                <Alert variant="default" className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">✅ Prompts salvos com sucesso!</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Configurações Avançadas
              </CardTitle>
              <CardDescription>Ajuste fino dos parâmetros da IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="temperature">Criatividade (Temperature): {config.temperature}</Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={(value) => setConfig({ ...config, temperature: value[0] })}
                  className="mt-2"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Mais Conservador</span>
                  <span>Mais Criativo</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  0.7 é ideal para análises de vendas - equilibra precisão e criatividade
                </p>
              </div>

              <div>
                <Label htmlFor="maxTokens">Tamanho Máximo da Resposta</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min={100}
                  max={4000}
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: Number.parseInt(e.target.value) || 1000 })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1000 tokens ≈ 750 palavras. Mais tokens = respostas mais detalhadas (e mais caras)
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">💡 Configuração Otimizada:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Temperature 0.7: Equilibrio ideal para vendas</li>
                  <li>• Max Tokens 1000: Suficiente para análises detalhadas</li>
                  <li>• GPT-4o Mini: Melhor custo-benefício</li>
                  <li>• Prompts específicos geram melhores resultados</li>
                </ul>
              </div>

              <Button onClick={saveConfig} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Salvar Todas as Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
