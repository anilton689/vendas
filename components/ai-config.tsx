"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle, RefreshCw, Database, Shield, Zap } from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

export function AIConfig() {
  const { config, updateConfig, testConnection, isLoading, refreshConfig } = useAIConfig()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleTestConnection = async () => {
    const result = await testConnection()
    setTestResult(result)
    setTimeout(() => setTestResult(null), 3000)
  }

  const handleRefreshConfig = async () => {
    setIsRefreshing(true)
    await refreshConfig()
    setIsRefreshing(false)
    setTestResult({ success: true, message: "✅ Configuração atualizada da planilha!" })
    setTimeout(() => setTestResult(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Configuração da IA</h2>
          <p className="text-muted-foreground">Configure o comportamento da inteligência artificial</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            Config na Planilha
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            IA Segura
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="model" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="model">Modelo</TabsTrigger>
          <TabsTrigger value="prompts">Prompts</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configurações do Modelo
              </CardTitle>
              <CardDescription>Configure o modelo de IA e parâmetros de geração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={config.model}
                    onChange={(e) => updateConfig({ ...config, model: e.target.value })}
                    placeholder="gpt-4o-mini"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTokens">Máximo de Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    value={config.maxTokens}
                    onChange={(e) => updateConfig({ ...config, maxTokens: Number.parseInt(e.target.value) || 1000 })}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura: {config.temperature}</Label>
                <Slider
                  id="temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={[config.temperature]}
                  onValueChange={(value) => updateConfig({ ...config, temperature: value[0] })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Mais Preciso</span>
                  <span>Mais Criativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Prompts Personalizados
              </CardTitle>
              <CardDescription>
                Prompts são carregados da planilha (aba ConfigIA). Para alterar, edite diretamente na planilha.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  Centralizado na Planilha
                </Badge>
                <Button
                  onClick={handleRefreshConfig}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 bg-transparent"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Atualizando..." : "Atualizar da Planilha"}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                  <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    readOnly
                    className="min-h-[120px] bg-muted/50"
                    placeholder="Carregando da planilha..."
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Somente leitura - edite na planilha</span>
                    <span>{config.systemPrompt.length} caracteres</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="followupPrompt">Prompt para Follow-ups</Label>
                  <Textarea
                    id="followupPrompt"
                    value={config.followupPrompt}
                    readOnly
                    className="min-h-[120px] bg-muted/50"
                    placeholder="Carregando da planilha..."
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Somente leitura - edite na planilha</span>
                    <span>{config.followupPrompt.length} caracteres</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="analysisPrompt">Prompt para Análises</Label>
                  <Textarea
                    id="analysisPrompt"
                    value={config.analysisPrompt}
                    readOnly
                    className="min-h-[120px] bg-muted/50"
                    placeholder="Carregando da planilha..."
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Somente leitura - edite na planilha</span>
                    <span>{config.analysisPrompt.length} caracteres</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Como personalizar os prompts:</p>
                    <ol className="mt-2 space-y-1 text-blue-800 list-decimal list-inside">
                      <li>Abra sua planilha do Google Sheets</li>
                      <li>Vá para a aba "ConfigIA"</li>
                      <li>Edite os valores na coluna B (systemPrompt, followupPrompt, analysisPrompt)</li>
                      <li>Volte aqui e clique em "Atualizar da Planilha"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Teste de Conexão
              </CardTitle>
              <CardDescription>Verifique se a IA está funcionando corretamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleTestConnection} disabled={isLoading} className="flex items-center gap-2">
                  {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  {isLoading ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-lg border ${
                    testResult.success
                      ? "bg-green-50 border-green-200 text-green-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {testResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{testResult.message}</span>
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Status da Configuração:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Modelo:</span>
                    <Badge variant="outline">{config.model}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperatura:</span>
                    <Badge variant="outline">{config.temperature}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Tokens:</span>
                    <Badge variant="outline">{config.maxTokens}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>API Key:</span>
                    <Badge variant="secondary">Configurada no Servidor</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Prompts:</span>
                    <Badge variant="secondary">Carregados da Planilha</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
