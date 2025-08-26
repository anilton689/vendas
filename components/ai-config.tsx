"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Settings,
  Brain,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  MessageSquare,
} from "lucide-react"

interface AIConfigProps {
  onConfigSaved?: () => void
}

export function AIConfig({ onConfigSaved }: AIConfigProps) {
  const [config, setConfig] = useState({
    model: "gpt-4o-mini",
    temperature: 0.7,
    maxTokens: 1000,
    systemPrompt:
      "Você é um assistente especializado em vendas e follow-up de orçamentos. Forneça respostas práticas e específicas para ajudar vendedores a fechar mais negócios.",
    followupPrompt: `Analise este orçamento e forneça sugestões específicas para o próximo follow-up em formato de lista clara:

• **Próxima Ação:** [Qual a melhor abordagem para este cliente?]
• **Timing:** [Quando fazer o próximo contato?]
• **Argumentos:** [Que argumentos usar?]
• **Objeções:** [Como superar possíveis objeções?]
• **Estratégia:** [Estratégia específica para este caso]

Use SEMPRE este formato de lista com bullets (•) e negrito (**) nos títulos.
Seja direto e prático. Máximo 5 pontos.`,
    analysisPrompt: `Analise este orçamento e forneça uma análise estruturada em formato JSON:

{
  "probabilidade": [número de 0 a 100],
  "categoria_risco": "[baixo/médio/alto]",
  "motivos_principais": ["motivo1", "motivo2", "motivo3"],
  "estrategias_recomendadas": ["estrategia1", "estrategia2", "estrategia3"],
  "proximos_passos": ["passo1", "passo2", "passo3"],
  "prazo_sugerido": "[em dias para próximo contato]",
  "observacoes_importantes": "observação relevante"
}

Base sua análise nos dados fornecidos: valor, tempo em aberto, histórico de interações e status atual.`,
    isConfigured: false,
  })

  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = () => {
    try {
      const savedConfig = localStorage.getItem("ai-config")
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig)
        setConfig((prev) => ({ ...prev, ...parsed }))
        console.log("🔧 Configuração da IA carregada:", parsed)
      }
    } catch (error) {
      console.error("❌ Erro ao carregar configuração:", error)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      const configToSave = { ...config, isConfigured: true }
      localStorage.setItem("ai-config", JSON.stringify(configToSave))
      setConfig(configToSave)
      setSaveMessage("✅ Configuração salva com sucesso!")

      if (onConfigSaved) {
        onConfigSaved()
      }

      console.log("💾 Configuração da IA salva:", configToSave)

      setTimeout(() => setSaveMessage(""), 3000)
    } catch (error) {
      console.error("❌ Erro ao salvar configuração:", error)
      setSaveMessage("❌ Erro ao salvar configuração")
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      console.log("🧪 Testando conexão com a IA...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: config.systemPrompt,
            },
            {
              role: "user",
              content: "Teste de conexão. Responda apenas: 'Conexão estabelecida com sucesso!'",
            },
          ],
          model: config.model,
          temperature: config.temperature,
          maxTokens: 100,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("✅ Teste de conexão bem-sucedido:", data)
        setTestResult({
          success: true,
          message: `Conexão estabelecida! Modelo: ${config.model}`,
        })
      } else {
        const errorData = await response.json()
        console.error("❌ Erro no teste:", response.status, errorData)
        setTestResult({
          success: false,
          message: `Erro ${response.status}: ${errorData.error || "Erro desconhecido"}`,
        })
      }
    } catch (error: any) {
      console.error("❌ Erro no teste de conexão:", error)
      setTestResult({
        success: false,
        message: `Erro de conexão: ${error.message}`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configuração da IA
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Shield className="h-3 w-3 mr-1" />
              API Segura
            </Badge>
          </CardTitle>
          <CardDescription>Configure a inteligência artificial para análises e sugestões de follow-up</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">⚙️ Básico</TabsTrigger>
              <TabsTrigger value="prompts">📝 Prompts</TabsTrigger>
              <TabsTrigger value="test">🧪 Teste</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo da IA</Label>
                  <Select
                    value={config.model}
                    onValueChange={(value) => setConfig((prev) => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini (Recomendado)</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o (Mais Avançado)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Econômico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                  <Select
                    value={config.maxTokens.toString()}
                    onValueChange={(value) => setConfig((prev) => ({ ...prev, maxTokens: Number.parseInt(value) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500 (Respostas Curtas)</SelectItem>
                      <SelectItem value="1000">1000 (Recomendado)</SelectItem>
                      <SelectItem value="2000">2000 (Respostas Longas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Criatividade: {config.temperature}</Label>
                <Slider
                  value={[config.temperature]}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, temperature: value[0] }))}
                  max={1}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Mais Preciso</span>
                  <span>Mais Criativo</span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="prompts" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                  <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) => setConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={3}
                    placeholder="Defina como a IA deve se comportar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followupPrompt">Prompt para Sugestões de Follow-up</Label>
                  <Textarea
                    id="followupPrompt"
                    value={config.followupPrompt}
                    onChange={(e) => setConfig((prev) => ({ ...prev, followupPrompt: e.target.value }))}
                    rows={8}
                    placeholder="Como a IA deve gerar sugestões de follow-up..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisPrompt">Prompt para Análise Estruturada</Label>
                  <Textarea
                    id="analysisPrompt"
                    value={config.analysisPrompt}
                    onChange={(e) => setConfig((prev) => ({ ...prev, analysisPrompt: e.target.value }))}
                    rows={10}
                    placeholder="Como a IA deve fazer análises estruturadas..."
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Segurança:</strong> A API Key está configurada no servidor Vercel e não é exposta no
                    frontend.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-4">
                  <Button onClick={testConnection} disabled={isTesting} className="flex items-center gap-2">
                    {isTesting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Testando...
                      </>
                    ) : (
                      <>
                        <TestTube className="h-4 w-4" />
                        Testar Conexão
                      </>
                    )}
                  </Button>

                  {testResult && (
                    <Alert className={testResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                      {testResult.success ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <AlertDescription className={testResult.success ? "text-green-700" : "text-red-700"}>
                        {testResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Status da Configuração:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      {config.isConfigured ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span>Configuração: {config.isConfigured ? "Ativa" : "Pendente"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Modelo: {config.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span>Tokens: {config.maxTokens}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button onClick={saveConfig} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Settings className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>

          {saveMessage && (
            <Alert className="mt-4">
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
