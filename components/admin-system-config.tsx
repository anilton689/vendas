"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Database, TestTube, CheckCircle, AlertCircle, Link, Save } from "lucide-react"

export function AdminSystemConfig() {
  const [sheetsConfig, setSheetsConfig] = useState({
    apiKey: "",
    spreadsheetId: "",
  })
  const [writeEndpoint, setWriteEndpoint] = useState("")
  const [testResults, setTestResults] = useState<{
    sheets: { success: boolean; message: string } | null
    script: { success: boolean; message: string } | null
  }>({ sheets: null, script: null })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Carregar configurações salvas
    const savedConfig = localStorage.getItem("sheets-config")
    if (savedConfig) {
      try {
        setSheetsConfig(JSON.parse(savedConfig))
      } catch (error) {
        console.error("Erro ao carregar configuração:", error)
      }
    }

    const savedEndpoint = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")
    if (savedEndpoint) {
      setWriteEndpoint(savedEndpoint)
    } else {
      // Configurar URL padrão automaticamente
      const defaultUrl =
        "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"
      setWriteEndpoint(defaultUrl)
      localStorage.setItem("write-endpoint", defaultUrl)
      localStorage.setItem("apps-script-url", defaultUrl)
    }
  }, [])

  const saveConfig = () => {
    localStorage.setItem("sheets-config", JSON.stringify(sheetsConfig))
    localStorage.setItem("write-endpoint", writeEndpoint)
    localStorage.setItem("apps-script-url", writeEndpoint) // Adicionar esta linha
    alert("✅ Configurações salvas com sucesso!")
  }

  const testSheetsConnection = async () => {
    if (!sheetsConfig.apiKey || !sheetsConfig.spreadsheetId) {
      setTestResults((prev) => ({
        ...prev,
        sheets: { success: false, message: "API Key e ID da planilha são obrigatórios" },
      }))
      return
    }

    setIsLoading(true)
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetsConfig.spreadsheetId}/values/Orçamentos!A1:H1?key=${sheetsConfig.apiKey}`
      const response = await fetch(url)

      if (response.ok) {
        const data = await response.json()
        setTestResults((prev) => ({
          ...prev,
          sheets: {
            success: true,
            message: `✅ Conexão estabelecida! Planilha encontrada com ${data.values?.[0]?.length || 0} colunas.`,
          },
        }))
      } else {
        const errorData = await response.json()
        setTestResults((prev) => ({
          ...prev,
          sheets: {
            success: false,
            message: `❌ Erro: ${errorData.error?.message || "Falha na conexão"}`,
          },
        }))
      }
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        sheets: { success: false, message: `❌ Erro de rede: ${error.message}` },
      }))
    } finally {
      setIsLoading(false)
    }
  }

  const testScriptEndpoint = async () => {
    if (!writeEndpoint) {
      setTestResults((prev) => ({
        ...prev,
        script: { success: false, message: "URL do Apps Script é obrigatória" },
      }))
      return
    }

    setIsLoading(true)
    try {
      // Teste simples GET na URL
      const testUrl = writeEndpoint.replace("/exec", "/dev")
      const response = await fetch(testUrl, { method: "GET", mode: "no-cors" })

      // Como no-cors não retorna dados, assumimos sucesso se não houver erro
      setTestResults((prev) => ({
        ...prev,
        script: {
          success: true,
          message: "✅ URL do Apps Script está acessível (teste básico)",
        },
      }))
    } catch (error: any) {
      setTestResults((prev) => ({
        ...prev,
        script: { success: false, message: `❌ Erro: ${error.message}` },
      }))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </CardTitle>
          <CardDescription>Configure as integrações necessárias para o funcionamento completo</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="sheets" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sheets">📊 Google Sheets</TabsTrigger>
          <TabsTrigger value="script">⚙️ Apps Script</TabsTrigger>
        </TabsList>

        <TabsContent value="sheets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Configuração do Google Sheets
              </CardTitle>
              <CardDescription>Configure a conexão com sua planilha de orçamentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="apiKey">API Key do Google Sheets *</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="AIzaSy..."
                  value={sheetsConfig.apiKey}
                  onChange={(e) => setSheetsConfig({ ...sheetsConfig, apiKey: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obtenha em:{" "}
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    className="text-blue-600 hover:underline"
                    rel="noreferrer"
                  >
                    Google Cloud Console
                  </a>
                </p>
              </div>

              <div>
                <Label htmlFor="spreadsheetId">ID da Planilha *</Label>
                <Input
                  id="spreadsheetId"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={sheetsConfig.spreadsheetId}
                  onChange={(e) => setSheetsConfig({ ...sheetsConfig, spreadsheetId: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Extraia da URL da planilha: docs.google.com/spreadsheets/d/<strong>[ID_AQUI]</strong>/edit
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testSheetsConnection} disabled={isLoading}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {isLoading ? "Testando..." : "Testar Conexão"}
                </Button>
                {sheetsConfig.apiKey && sheetsConfig.spreadsheetId && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configurado
                  </Badge>
                )}
              </div>

              {testResults.sheets && (
                <Alert variant={testResults.sheets.success ? "default" : "destructive"}>
                  {testResults.sheets.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResults.sheets.message}</AlertDescription>
                </Alert>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">📋 Estrutura Necessária da Planilha:</h4>
                <div className="text-sm text-blue-800 space-y-2">
                  <div>
                    <strong>Aba "Orçamentos":</strong>
                    <p className="ml-2">
                      A=Data, B=Sequência, C=Cliente, D=Valor, E=Código Vendedor, F=Nome Vendedor, G=Email, H=Telefone
                    </p>
                  </div>
                  <div>
                    <strong>Aba "Historico":</strong>
                    <p className="ml-2">
                      A=Sequência Orçamento, B=Data/Hora Follow-up, C=Status, D=Observações, E=Código Vendedor, F=Nome
                      Vendedor
                    </p>
                  </div>
                  <div>
                    <strong>Aba "Vendedor":</strong>
                    <p className="ml-2">A=Código, B=Nome, C=Tipo (admin/vendedor)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="script" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Link className="h-5 w-5" />
                Configuração do Apps Script
              </CardTitle>
              <CardDescription>Configure o endpoint para gravação de follow-ups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="writeEndpoint">URL do Web App (Apps Script) *</Label>
                <Input
                  id="writeEndpoint"
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycby.../exec"
                  value={writeEndpoint}
                  onChange={(e) => setWriteEndpoint(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">URL gerada após implantação do Apps Script como Web App</p>
              </div>

              <div className="flex gap-2">
                <Button onClick={testScriptEndpoint} disabled={isLoading}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {isLoading ? "Testando..." : "Testar Endpoint"}
                </Button>
                {writeEndpoint && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Configurado
                  </Badge>
                )}
              </div>

              {testResults.script && (
                <Alert variant={testResults.script.success ? "default" : "destructive"}>
                  {testResults.script.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{testResults.script.message}</AlertDescription>
                </Alert>
              )}

              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-medium text-orange-900 mb-2">⚙️ Como configurar o Apps Script:</h4>
                <ol className="text-sm text-orange-800 space-y-1 list-decimal list-inside">
                  <li>
                    Acesse{" "}
                    <a href="https://script.google.com" target="_blank" className="underline" rel="noreferrer">
                      script.google.com
                    </a>
                  </li>
                  <li>Crie um novo projeto</li>
                  <li>Cole o código do arquivo "apps-script-funcional-v71.js"</li>
                  <li>Salve o projeto</li>
                  <li>Vá em "Implantar" → "Nova implantação"</li>
                  <li>Tipo: "Aplicativo da Web"</li>
                  <li>Executar como: "Eu"</li>
                  <li>Quem tem acesso: "Qualquer pessoa"</li>
                  <li>Copie a URL gerada e cole acima</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2">
        <Button onClick={saveConfig}>
          <Save className="h-4 w-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </div>
  )
}
