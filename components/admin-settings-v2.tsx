"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, AlertTriangle, LinkIcon, TestTube, Trash2, Globe, Key, FileSpreadsheet } from 'lucide-react'
import { useGoogleSheetsWrite } from '@/hooks/useGoogleSheetsWrite'

export function AdminSettingsV2() {
  // Método 1: Apps Script (atual)
  const [endpoint, setEndpoint] = useState("")
  const [appsScriptMessage, setAppsScriptMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Método 2: API Direta
  const [apiKey, setApiKey] = useState("")
  const [spreadsheetId, setSpreadsheetId] = useState("")
  const [apiMessage, setApiMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { testWrite, isLoading: isApiLoading, error: apiError } = useGoogleSheetsWrite()

  useEffect(() => {
    // Carregar configurações salvas
    const savedEndpoint = localStorage.getItem("write-endpoint")
    if (savedEndpoint) setEndpoint(savedEndpoint)

    const savedConfig = localStorage.getItem("sheets-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setApiKey(config.apiKey || "")
        setSpreadsheetId(config.spreadsheetId || "")
      } catch (error) {
        console.error("Erro ao carregar configuração:", error)
      }
    }
  }, [])

  // Método 1: Apps Script
  const handleSaveAppsScript = () => {
    if (!endpoint.trim()) {
      setAppsScriptMessage({ type: "error", text: "Informe o URL do Apps Script Web App." })
      return
    }
    localStorage.setItem("write-endpoint", endpoint.trim())
    setAppsScriptMessage({ type: "success", text: "Endpoint do Apps Script salvo com sucesso!" })
  }

  const handleTestAppsScript = async () => {
    setIsTesting(true)
    setAppsScriptMessage(null)
    try {
      if (!endpoint.trim()) {
        setAppsScriptMessage({ type: "error", text: "Informe o URL do Apps Script Web App para testar." })
        return
      }

      const now = new Date()
      const payload = {
        sequencia_orcamento: "TESTE-APPS-SCRIPT",
        data_hora_followup: now.toISOString(),
        status: "aguardando",
        observacoes: "Teste de conexão Apps Script - pode excluir esta linha",
        codigo_vendedor: "1",
        nome_vendedor: "Admin",
        tipo_acao: "teste",
        data_orcamento: now.toISOString().slice(0, 10),
        dias_followup: "A agendar",
        valor_orcamento: 0
      }

      const res = await fetch(endpoint.trim(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const txt = await res.text()
        throw new Error(`HTTP ${res.status}: ${txt}`)
      }
      const data = await res.json().catch(() => ({}))
      if (data?.success) {
        setAppsScriptMessage({ type: "success", text: "✅ Apps Script OK! Uma linha de TESTE foi enviada para a aba Historico." })
      } else {
        setAppsScriptMessage({ type: "success", text: "✅ Apps Script conectado! Verifique se a linha de TESTE entrou na aba Historico." })
      }
    } catch (err: any) {
      setAppsScriptMessage({ type: "error", text: `❌ Falha no Apps Script: ${err?.message || "erro desconhecido"}` })
    } finally {
      setIsTesting(false)
    }
  }

  // Método 2: API Direta
  const handleTestApiDirect = async () => {
    setApiMessage(null)
    
    if (!apiKey.trim() || !spreadsheetId.trim()) {
      setApiMessage({ type: "error", text: "Informe a API Key e o ID da planilha." })
      return
    }

    const success = await testWrite({ apiKey: apiKey.trim(), spreadsheetId: spreadsheetId.trim() })
    
    if (success) {
      setApiMessage({ type: "success", text: "✅ API Direta OK! Uma linha de TESTE foi enviada para a aba Historico." })
      // Salvar configuração se o teste passou
      localStorage.setItem("direct-api-config", JSON.stringify({
        apiKey: apiKey.trim(),
        spreadsheetId: spreadsheetId.trim()
      }))
    } else {
      setApiMessage({ type: "error", text: `❌ Falha na API Direta: ${apiError || "erro desconhecido"}` })
    }
  }

  const handleClearAppsScript = () => {
    localStorage.removeItem("write-endpoint")
    setEndpoint("")
    setAppsScriptMessage({ type: "success", text: "Endpoint do Apps Script removido." })
  }

  const handleClearApiDirect = () => {
    localStorage.removeItem("direct-api-config")
    setApiMessage({ type: "success", text: "Configuração da API Direta removida." })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configurações de Integração
        </CardTitle>
        <CardDescription>
          Configure como os follow-ups serão salvos na planilha. Teste ambos os métodos e use o que funcionar melhor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="apps-script" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apps-script">📜 Apps Script (Recomendado)</TabsTrigger>
            <TabsTrigger value="api-direct">🔑 API Direta (Alternativa)</TabsTrigger>
          </TabsList>

          <TabsContent value="apps-script" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Método 1: Google Apps Script (Webhook)</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Este é o método recomendado. Você precisa criar um Google Apps Script e publicá-lo como Web App.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endpoint">URL do Apps Script Web App</Label>
                <Input
                  id="endpoint"
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveAppsScript}>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleTestAppsScript} disabled={isTesting || !endpoint.trim()}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {isTesting ? "Testando..." : "Testar"}
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClearAppsScript}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>

              {appsScriptMessage && (
                <Alert variant={appsScriptMessage.type === "success" ? "default" : "destructive"}>
                  {appsScriptMessage.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription className="whitespace-pre-line">{appsScriptMessage.text}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          <TabsContent value="api-direct" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Método 2: API Direta do Google Sheets</h4>
                <p className="text-sm text-gray-600 mb-4">
                  ⚠️ <strong>Limitação:</strong> A API Key padrão do Google não permite escrita em planilhas. 
                  Este método só funcionará se você configurar uma Service Account com permissões de escrita.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key-direct">API Key do Google</Label>
                <Input
                  id="api-key-direct"
                  type="password"
                  placeholder="AIzaSyC..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="spreadsheet-id-direct">ID da Planilha</Label>
                <Input
                  id="spreadsheet-id-direct"
                  placeholder="1VOMhDFzm7yCkbYEXzV-d..."
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleTestApiDirect} disabled={isApiLoading || !apiKey.trim() || !spreadsheetId.trim()}>
                  <TestTube className="h-4 w-4 mr-2" />
                  {isApiLoading ? "Testando..." : "Testar API Direta"}
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClearApiDirect}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              </div>

              {apiMessage && (
                <Alert variant={apiMessage.type === "success" ? "default" : "destructive"}>
                  {apiMessage.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  <AlertDescription className="whitespace-pre-line">{apiMessage.text}</AlertDescription>
                </Alert>
              )}

              {apiError && !apiMessage && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="whitespace-pre-line">{apiError}</AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">💡 Dicas de Solução de Problemas:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Apps Script "Failed to fetch":</strong> Verifique se o script foi publicado como "Qualquer pessoa" pode acessar</li>
            <li>• <strong>API Direta "Sem permissão de escrita":</strong> API Keys normais só permitem leitura. Use Apps Script ou Service Account</li>
            <li>• <strong>Aba "Historico" não encontrada:</strong> Certifique-se de que existe uma aba chamada exatamente "Historico" na planilha</li>
            <li>• <strong>Planilha não encontrada:</strong> Verifique se o ID da planilha está correto e se ela está compartilhada</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
