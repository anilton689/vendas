"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bot,
  Settings,
  TestTube,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  BarChart3,
  Shield,
  Server,
  RefreshCw,
  Database,
  Info,
} from "lucide-react"
import { useAIConfig } from "@/hooks/useAIConfig"

export function AIConfig() {
  const { config, testConnection, isLoading, refreshConfig } = useAIConfig()
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
              Sempre Atualizado
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>📊 Leitura Automática:</strong> Os prompts são carregados automaticamente da aba "ConfigIA" da
          planilha sempre que você entra no sistema. Para ver mudanças feitas na planilha, clique em "Atualizar da
          Planilha".
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
              <CardDescription>Configurações carregadas da planilha Google Sheets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="model">Modelo da IA (da planilha)</Label>
                <div className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">{config.model}</div>
                <p className="text-xs text-gray-500 mt-1">
                  Valor carregado da aba ConfigIA da planilha. Para alterar, edite na planilha.
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
                    ✅ <strong>Carregamento automático</strong> ao entrar no sistema
                  </p>
                  <p>
                    ✅ <strong>Configuração centralizada</strong> para todos os usuários
                  </p>
                  <p>
                    ✅ <strong>Backup automático</strong> no Google Drive
                  </p>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded border-l-4 border-green-400">
                  <p className="text-sm text-green-800">
                    <strong>💡 Como usar:</strong> Edite os prompts diretamente na planilha (aba ConfigIA) e clique em
                    "Atualizar da Planilha" para carregar as mudanças no sistema.
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
                Prompts da Planilha (Somente Leitura)
              </CardTitle>
              <CardDescription>
                Prompts carregados automaticamente da aba "ConfigIA" da planilha Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-50 border-yellow-200">
                <Info className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>📝 Para editar os prompts:</strong> Vá na planilha Google Sheets → aba "ConfigIA" → edite os
                  valores na coluna B → volte aqui e clique em "Atualizar da Planilha"
                </AlertDescription>
              </Alert>

              <div>
                <Label htmlFor="systemPrompt">Prompt do Sistema (da planilha)</Label>
                <Textarea id="systemPrompt" value={config.systemPrompt} readOnly rows={4} className="mt-1 bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">
                  Define como a IA se comporta. Para alterar, edite na planilha ConfigIA linha "systemPrompt".
                </p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {config.systemPrompt.length}</p>
              </div>

              <div>
                <Label htmlFor="followupPrompt">Prompt para Follow-ups (da planilha)</Label>
                <Textarea
                  id="followupPrompt"
                  value={config.followupPrompt}
                  readOnly
                  rows={8}
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para sugestões de follow-up. Para alterar, edite na planilha ConfigIA linha "followupPrompt".
                </p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {config.followupPrompt.length}</p>
              </div>

              <div>
                <Label htmlFor="analysisPrompt">Prompt para Análises (da planilha)</Label>
                <Textarea
                  id="analysisPrompt"
                  value={config.analysisPrompt}
                  readOnly
                  rows={4}
                  className="mt-1 bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usado para análises detalhadas. Para alterar, edite na planilha ConfigIA linha "analysisPrompt".
                </p>
                <p className="text-xs text-blue-600 mt-1">Caracteres: {config.analysisPrompt.length}</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRefresh} disabled={isRefreshing} className="bg-blue-600 hover:bg-blue-700">
                  {isRefreshing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Atualizando da Planilha...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar da Planilha
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
                    ✅ <strong>Sempre atualizado:</strong> Carrega automaticamente ao entrar no sistema
                  </li>
                  <li>
                    ✅ <strong>Centralizado:</strong> Uma configuração para todos os usuários
                  </li>
                  <li>
                    ✅ <strong>Persistente:</strong> Nunca perde as configurações
                  </li>
                  <li>
                    ✅ <strong>Fácil edição:</strong> Edita direto na planilha Google Sheets
                  </li>
                  <li>
                    ✅ <strong>Backup automático:</strong> Salvo no Google Drive
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-900 mb-2">📝 Como Editar os Prompts:</h4>
                <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
                  <li>Abra a planilha Google Sheets</li>
                  <li>Vá na aba "ConfigIA"</li>
                  <li>Edite os valores na coluna B:</li>
                  <li className="ml-4">• systemPrompt (linha 2)</li>
                  <li className="ml-4">• followupPrompt (linha 3)</li>
                  <li className="ml-4">• analysisPrompt (linha 4)</li>
                  <li>Volte aqui e clique em "Atualizar da Planilha"</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Configurações Avançadas (da planilha)
              </CardTitle>
              <CardDescription>Parâmetros carregados da aba ConfigIA da planilha</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="temperature">Criatividade (Temperature): {config.temperature}</Label>
                <div className="mt-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Valor da planilha: {config.temperature}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Para alterar, edite na planilha ConfigIA linha "temperature"
                </p>
              </div>

              <div>
                <Label htmlFor="maxTokens">Tamanho Máximo da Resposta: {config.maxTokens}</Label>
                <div className="mt-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  Valor da planilha: {config.maxTokens} tokens
                </div>
                <p className="text-xs text-gray-500 mt-1">Para alterar, edite na planilha ConfigIA linha "maxTokens"</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📊 Estrutura da Aba ConfigIA:</h4>
                <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded">
                  <div>A1: Tipo | B1: Valor</div>
                  <div>A2: systemPrompt | B2: [seu prompt]</div>
                  <div>A3: followupPrompt | B3: [seu prompt]</div>
                  <div>A4: analysisPrompt | B4: [seu prompt]</div>
                  <div>A5: model | B5: gpt-4o-mini</div>
                  <div>A6: temperature | B6: 0.7</div>
                  <div>A7: maxTokens | B7: 1000</div>
                </div>
              </div>

              <Button onClick={handleRefresh} className="w-full" disabled={isRefreshing}>
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Atualizando da Planilha...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Atualizar Todas as Configurações da Planilha
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
