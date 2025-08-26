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
  RefreshCw,
  Database,
} from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

export function AIConfig() {
  const { config, updateConfig, testConnection, isLoading, refreshConfig } = useAIConfig()
  const [localConfig, setLocalConfig] = useState(config)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingPrompts, setIsSavingPrompts] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Sincronizar com configuração carregada
  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      await updateConfig(localConfig)
      setTestResult({ success: true, message: "✅ Configuração salva na planilha com sucesso!" })
    } catch (error) {
      console.error("❌ Erro ao salvar configuração:", error)
      setTestResult({ success: false, message: "❌ Erro ao salvar configuração na planilha" })
    } finally {
      setIsSaving(false)
    }
  }

  const savePrompts = async () => {
    setIsSavingPrompts(true)
    setTestResult(null)

    try {
      console.log("💬 Salvando prompts personalizados na planilha...")

      await updateConfig(localConfig)
      setTestResult({ success: true, message: "✅ Prompts salvos na planilha com sucesso!" })
    } catch (error) {
      console.error("❌ Erro ao salvar prompts:", error)
      setTestResult({ success: false, message: "❌ Erro ao salvar prompts na planilha" })
    } finally {
      setTimeout(() => {
        setIsSavingPrompts(false)
      }, 1500)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setTestResult(null)
    try {
      await refreshConfig()
      setTestResult({ success: true, message: "✅ Configuração atualizada da planilha!" })
    } catch (error) {
      setTestResult({ success: false, message: "❌ Erro ao atualizar configuração" })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleTestConnection = async () => {
    setTestResult(null)
    const result = await testConnection()
    setTestResult(result)
  }

  const resetToDefaults = () => {
    const defaultConfig = {
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
    }

    setLocalConfig(defaultConfig)
    console.log("🔄 Configuração resetada para padrões")
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Configuração da IA - Modo Seguro
          </CardTitle>
          <CardDescription>
            Configuração centralizada na planilha Google Sheets. API Key segura no servidor Vercel.
          </CardDescription>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Server className="h-3 w-3 mr-1" />
              API Key no Servidor
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Database className="h-3 w-3 mr-1" />
              Config na Planilha
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Centralizado
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>📊 Configuração Centralizada:</strong> Os prompts e configurações da IA são lidos da aba "ConfigIA" da
          planilha Google Sheets. Isso garante que todos os usuários usem a mesma configuração e nunca percam as
          personalizações.
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
              <CardDescription>Configure o modelo e parâmetros da IA (salvo na planilha)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model">Modelo da IA</Label>
                <select
                  id="model"
                  value={localConfig.model}
                  onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
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
                <Button onClick={handleTestConnection} disabled={isLoading}>
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

                <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline">
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar da Planilha
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
                      Salvar na Planilha
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
                <h4 className="font-medium text-blue-900 mb-2">📊 Configuração na Planilha:</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    ✅ <strong>Aba "ConfigIA"</strong> criada na planilha
                  </p>
                  <p>
                    ✅ <strong>Configuração centralizada</strong> para todos os usuários
                  </p>
                  <p>
                    ✅ <strong>Backup automático</strong> no Google Drive
                  </p>
                  <p>
                    ✅ <strong>Nunca perde</strong> as personalizações
                  </p>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    <strong>💡 Dica:</strong> Você pode editar os prompts diretamente na planilha (aba ConfigIA) e
                    clicar em "Atualizar da Planilha" para carregar as mudanças.
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
              <CardDescription>
                Personalize como a IA analisa e responde. As alterações são salvas na planilha Google Sheets.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="Defina a personalidade e comportamento da IA..."
                  value={localConfig.systemPrompt}
                  onChange={(e) => setLocalConfig({ ...localConfig, systemPrompt: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Define como a IA se comporta e qual é seu papel principal</p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {localConfig.systemPrompt.length}</p>
              </div>

              <div>
                <Label htmlFor="followupPrompt">Prompt para Follow-ups</Label>
                <Textarea
                  id="followupPrompt"
                  placeholder="Instruções para sugestões de follow-up..."
                  value={localConfig.followupPrompt}
                  onChange={(e) => setLocalConfig({ ...localConfig, followupPrompt: e.target.value })}
                  rows={8}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">Usado quando a IA sugere estratégias de follow-up</p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {localConfig.followupPrompt.length}</p>
              </div>

              <div>
                <Label htmlFor="analysisPrompt">Prompt para Análises</Label>
                <Textarea
                  id="analysisPrompt"
                  placeholder="Instruções para análise de orçamentos..."
                  value={localConfig.analysisPrompt}
                  onChange={(e) => setLocalConfig({ ...localConfig, analysisPrompt: e.target.value })}
                  rows={4}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para análises detalhadas de probabilidade de fechamento
                </p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {localConfig.analysisPrompt.length}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={resetToDefaults} variant="outline">
                  🔄 Restaurar Padrões
                </Button>
                <Button
                  onClick={savePrompts}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={isSavingPrompts}
                >
                  {isSavingPrompts ? (
                    <>
                      <Save className="h-4 w-4 mr-2 animate-spin" />
                      Salvando na Planilha...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Salvar na Planilha
                    </>
                  )}
                </Button>
              </div>

              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"} className="mt-4">
                  {testResult.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription className={testResult.success ? "text-green-800" : "text-red-800"}>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-medium text-green-900 mb-2">📊 Vantagens da Configuração na Planilha:</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>
                    ✅ <strong>Centralizado:</strong> Uma configuração para todos os usuários
                  </li>
                  <li>
                    ✅ <strong>Persistente:</strong> Nunca perde as configurações
                  </li>
                  <li>
                    ✅ <strong>Multiplataforma:</strong> Funciona em qualquer dispositivo
                  </li>
                  <li>
                    ✅ <strong>Backup automático:</strong> Salvo no Google Drive
                  </li>
                  <li>
                    ✅ <strong>Fácil edição:</strong> Pode alterar direto na planilha
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">💡 Dicas para Prompts Eficazes:</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>
                    • <strong>Seja específico:</strong> Detalhe exatamente o que você quer
                  </li>
                  <li>
                    • <strong>Use exemplos:</strong> Mostre o formato desejado das respostas
                  </li>
                  <li>
                    • <strong>Defina o tom:</strong> Profissional, amigável, técnico, etc.
                  </li>
                  <li>
                    • <strong>Limite o escopo:</strong> Foque no que é mais importante
                  </li>
                  <li>
                    • <strong>Teste sempre:</strong> Faça testes após personalizar
                  </li>
                </ul>
              </div>
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
              <CardDescription>Ajuste fino dos parâmetros da IA (salvo na planilha)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="temperature">Criatividade (Temperature): {localConfig.temperature}</Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[localConfig.temperature]}
                  onValueChange={(value) => setLocalConfig({ ...localConfig, temperature: value[0] })}
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
                  value={localConfig.maxTokens}
                  onChange={(e) =>
                    setLocalConfig({ ...localConfig, maxTokens: Number.parseInt(e.target.value) || 1000 })
                  }
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

              <Button onClick={saveConfig} className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Save className="h-4 w-4 mr-2 animate-spin" />
                    Salvando na Planilha...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Todas as Configurações na Planilha
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
