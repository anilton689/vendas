"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  MessageSquare,
  BarChart3,
  Shield,
  Server,
} from "lucide-react"

interface AIConfig {
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
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt: `Você é um assistente especializado em vendas e follow-up de orçamentos. 
Seu objetivo é ajudar vendedores a fechar mais negócios através de análises inteligentes e sugestões estratégicas.
Seja sempre prático, direto e focado em resultados.`,
    followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up em formato de lista clara:

• **Próxima Ação:** [Qual a melhor abordagem para este cliente?]
• **Timing:** [Quando fazer o próximo contato?]
• **Argumentos:** [Que argumentos usar?]
• **Objeções:** [Como superar possíveis objeções?]
• **Estratégia:** [Estratégia específica para este caso]

Use SEMPRE este formato de lista com bullets (•) e negrito (**) nos títulos.
Seja direto e prático. Máximo 5 pontos.`,
    analysisPrompt: `Analise este orçamento e forneça:
1. Probabilidade de fechamento (0-100%)
2. Principais motivos que podem influenciar a decisão
3. Estratégias recomendadas
4. Próximos passos sugeridos`,
    isConfigured: true,
  })

  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPrompts, setIsSavingPrompts] = useState(false)

  useEffect(() => {
    // Carregar configuração salva (sem API Key)
    const savedConfig = localStorage.getItem("ai-config")
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig)
        // Remover apiKey se existir (migração)
        delete parsed.apiKey
        setConfig((prev) => ({ ...prev, ...parsed, isConfigured: true }))
        console.log("✅ Configuração da IA carregada:", { model: parsed.model })
      } catch (error) {
        console.error("❌ Erro ao carregar configuração da IA:", error)
      }
    }
  }, [])

  const saveConfig = () => {
    setIsSaving(true)
    try {
      const configToSave = {
        ...config,
        isConfigured: true,
      }
      // Remover apiKey se existir
      delete (configToSave as any).apiKey
      localStorage.setItem("ai-config", JSON.stringify(configToSave))
      setConfig(configToSave)
      setTestResult({ success: true, message: "✅ Configuração salva com sucesso!" })
      console.log("✅ Configuração da IA salva:", { model: configToSave.model })
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
        isConfigured: true,
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
    setIsLoading(true)
    setTestResult(null)

    console.log("🧪 Testando conexão com IA usando API Key do servidor...")

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

        let errorMessage = `❌ Erro na conexão: ${errorData.error || "Falha desconhecida"}`

        // Mensagens específicas para erros comuns
        if (errorData.error?.includes("API Key da OpenAI não configurada")) {
          errorMessage = "❌ Configure a variável OPENAI_API_KEY no Vercel"
        } else if (errorData.error?.includes("insufficient_quota")) {
          errorMessage = "❌ Cota da API excedida. Verifique seu plano na OpenAI."
        } else if (errorData.error?.includes("rate_limit")) {
          errorMessage = "❌ Limite de requisições excedido. Tente novamente em alguns minutos."
        }

        setTestResult({
          success: false,
          message: errorMessage,
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
      followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up em formato de lista clara:

• **Próxima Ação:** [Qual a melhor abordagem para este cliente?]
• **Timing:** [Quando fazer o próximo contato?]
• **Argumentos:** [Que argumentos usar?]
• **Objeções:** [Como superar possíveis objeções?]
• **Estratégia:** [Estratégia específica para este caso]

Use SEMPRE este formato de lista com bullets (•) e negrito (**) nos títulos.
Seja direto e prático. Máximo 5 pontos.`,
      analysisPrompt: `Analise este orçamento e forneça:
1. Probabilidade de fechamento (0-100%)
2. Principais motivos que podem influenciar a decisão
3. Estratégias recomendadas
4. Próximos passos sugeridos`,
    }))
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Configuração da IA - Modo Seguro
          </CardTitle>
          <CardDescription>A API Key da OpenAI está configurada de forma segura no servidor (Vercel)</CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Server className="h-3 w-3 mr-1" />
              API Key no Servidor
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Configuração Segura
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Alert className="bg-green-50 border-green-200">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>🔒 Segurança Aprimorada:</strong> A API Key da OpenAI agora está armazenada de forma segura no
          servidor do Vercel, evitando exposição no frontend e garantindo que a OpenAI não desative sua chave.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">⚙️ Básico</TabsTrigger>
          <TabsTrigger value="prompts">💬 Prompts</TabsTrigger>
          <TabsTrigger value="advanced">🔧 Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Básicas
              </CardTitle>
              <CardDescription>Configure o modelo e parâmetros da IA</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🔧 Como configurar no Vercel:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Acesse seu projeto no Vercel Dashboard</li>
                  <li>Vá em Settings → Environment Variables</li>
                  <li>Adicione uma nova variável:</li>
                  <li className="ml-4">
                    • Name: <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code>
                  </li>
                  <li className="ml-4">• Value: sua chave da OpenAI (sk-proj-...)</li>
                  <li>Clique em "Save"</li>
                  <li>Faça um novo deploy do projeto</li>
                </ol>
                <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    <strong>✅ Vantagem:</strong> A API Key fica segura no servidor e não é exposta no frontend,
                    evitando que a OpenAI desative sua chave por motivos de segurança.
                  </p>
                </div>
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
              <CardDescription>Personalize como a IA analisa e responde sobre orçamentos</CardDescription>
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
                  rows={6}
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
                <input
                  id="maxTokens"
                  type="number"
                  min={100}
                  max={4000}
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: Number.parseInt(e.target.value) || 1000 })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  1000 tokens ≈ 750 palavras. Mais tokens = respostas mais detalhadas (e mais caras)
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">💡 Dicas de Otimização:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
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
