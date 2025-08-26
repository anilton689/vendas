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
  Brain,
  TestTube,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  Zap,
  MessageSquare,
  RefreshCw,
  Save,
} from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

interface AIConfigProps {
  onConfigSaved?: () => void
}

export function AIConfig({ onConfigSaved }: AIConfigProps) {
  const { config, updateConfig, testConnection, isLoading, refreshConfig } = useAIConfig()

  const [localConfig, setLocalConfig] = useState(config)
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saveMessage, setSaveMessage] = useState("")

  // Sincronizar config local quando o config do hook mudar
  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const saveConfigToSheet = async () => {
    setIsSaving(true)
    setSaveMessage("")

    try {
      console.log("💾 [AIConfig] Salvando configuração na planilha...")

      // Buscar configuração do Apps Script
      const adminConfig = localStorage.getItem("admin-sheets-config")
      if (!adminConfig) {
        throw new Error("Configuração da planilha não encontrada")
      }

      const { appsScriptUrl } = JSON.parse(adminConfig)
      if (!appsScriptUrl) {
        throw new Error("URL do Apps Script não configurada")
      }

      // Preparar dados para envio
      const configData = {
        action: "updateConfigIA",
        data: {
          systemPrompt: localConfig.systemPrompt,
          followupPrompt: localConfig.followupPrompt,
          analysisPrompt: localConfig.analysisPrompt,
          model: localConfig.model,
          temperature: localConfig.temperature.toString(),
          maxTokens: localConfig.maxTokens.toString(),
        },
      }

      console.log("📤 [AIConfig] Enviando dados:", configData)

      // Enviar para Apps Script
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json_data: JSON.stringify(configData),
        }),
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const result = await response.json()
      console.log("📥 [AIConfig] Resposta do Apps Script:", result)

      if (result.success) {
        // Atualizar configuração local
        await updateConfig({ ...localConfig, isConfigured: true })
        setSaveMessage("✅ Configuração salva na planilha com sucesso!")

        if (onConfigSaved) {
          onConfigSaved()
        }

        console.log("✅ [AIConfig] Configuração salva com sucesso")
      } else {
        throw new Error(result.error || "Erro desconhecido")
      }

      setTimeout(() => setSaveMessage(""), 5000)
    } catch (error: any) {
      console.error("❌ [AIConfig] Erro ao salvar configuração:", error)
      setSaveMessage(`❌ Erro ao salvar: ${error.message}`)
      setTimeout(() => setSaveMessage(""), 5000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)

    try {
      const result = await testConnection()
      setTestResult(result)
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Erro no teste: ${error.message}`,
      })
    } finally {
      setIsTesting(false)
    }
  }

  const handleRefreshConfig = async () => {
    console.log("🔄 [AIConfig] Atualizando configuração da planilha...")
    await refreshConfig()
    setSaveMessage("🔄 Configuração atualizada da planilha!")
    setTimeout(() => setSaveMessage(""), 3000)
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
              Integrada com Planilha
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure a inteligência artificial para análises e sugestões de follow-up. As configurações são salvas na
            aba "ConfigIA" da planilha.
          </CardDescription>
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
                    value={localConfig.model}
                    onValueChange={(value) => setLocalConfig((prev) => ({ ...prev, model: value }))}
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
                    value={localConfig.maxTokens.toString()}
                    onValueChange={(value) =>
                      setLocalConfig((prev) => ({ ...prev, maxTokens: Number.parseInt(value) }))
                    }
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
                <Label htmlFor="temperature">Criatividade: {localConfig.temperature}</Label>
                <Slider
                  value={[localConfig.temperature]}
                  onValueChange={(value) => setLocalConfig((prev) => ({ ...prev, temperature: value[0] }))}
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
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Integração com Planilha:</strong> Os prompts são carregados automaticamente da aba "ConfigIA"
                  e salvos diretamente na planilha Google Sheets.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                  <Textarea
                    id="systemPrompt"
                    value={localConfig.systemPrompt}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                    rows={3}
                    placeholder="Defina como a IA deve se comportar..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followupPrompt">Prompt para Sugestões de Follow-up</Label>
                  <Textarea
                    id="followupPrompt"
                    value={localConfig.followupPrompt}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, followupPrompt: e.target.value }))}
                    rows={8}
                    placeholder="Como a IA deve gerar sugestões de follow-up..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisPrompt">Prompt para Análise Estruturada</Label>
                  <Textarea
                    id="analysisPrompt"
                    value={localConfig.analysisPrompt}
                    onChange={(e) => setLocalConfig((prev) => ({ ...prev, analysisPrompt: e.target.value }))}
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
                    frontend. Os prompts são carregados da planilha Google Sheets.
                  </AlertDescription>
                </Alert>

                <div className="flex items-center gap-4">
                  <Button onClick={handleTestConnection} disabled={isTesting} className="flex items-center gap-2">
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
                      {localConfig.isConfigured ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      )}
                      <span>Configuração: {localConfig.isConfigured ? "Ativa" : "Pendente"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span>Modelo: {localConfig.model}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <span>Tokens: {localConfig.maxTokens}</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center mt-6">
            <Button
              onClick={handleRefreshConfig}
              variant="outline"
              disabled={isLoading}
              className="flex items-center gap-2 bg-transparent"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar da Planilha
                </>
              )}
            </Button>

            <Button onClick={saveConfigToSheet} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
