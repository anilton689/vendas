"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ExternalLink, CheckCircle, AlertCircle, LinkIcon, Eye, EyeOff, Bug } from "lucide-react"
import { useGoogleSheets } from "@/hooks/useGoogleSheets"

interface GoogleSheetsImportProps {
  onImport: (data: any[]) => void
}

export function GoogleSheetsImport({ onImport }: GoogleSheetsImportProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [range, setRange] = useState("A:D")
  const [showApiKey, setShowApiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const { fetchSheetData, isLoading, error } = useGoogleSheets()

  // NOVO: Carregar configurações salvas na inicialização
  useEffect(() => {
    const savedConfig = localStorage.getItem("admin-sheets-config")
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig)
        setApiKey(config.apiKey || "")
        setSpreadsheetUrl(config.spreadsheetUrl || "")
      } catch (error) {
        console.error("Erro ao carregar configuração de importação:", error)
      }
    }
  }, [])

  const extractSpreadsheetId = (url: string): string | null => {
    // Diferentes formatos de URL do Google Sheets
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /^([a-zA-Z0-9-_]+)$/, // Apenas o ID
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }

    return null
  }

  const validateInputs = () => {
    if (!spreadsheetUrl.trim()) {
      alert("Por favor, insira a URL ou ID da planilha")
      return false
    }

    if (!apiKey.trim()) {
      alert("Por favor, insira sua chave da API do Google")
      return false
    }

    if (!range.trim()) {
      alert("Por favor, especifique o intervalo de células")
      return false
    }

    return true
  }

  const handleImport = async () => {
    if (!validateInputs()) return

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
    if (!spreadsheetId) {
      alert("URL da planilha inválida. Verifique se é uma URL válida do Google Sheets ou um ID válido")
      return
    }

    try {
      const data = await fetchSheetData({
        apiKey: apiKey.trim(),
        spreadsheetId,
        range: range.trim(),
      })

      onImport(data)
      setTestResult({
        success: true,
        message: `✅ Planilha importada com sucesso! ${data.length} registros encontrados.`,
        data: data.slice(0, 3), // Primeiros 3 registros para preview
      })
    } catch (err) {
      setTestResult({ success: false, message: `❌ ${error || "Erro ao importar planilha"}` })
    }
  }

  const handleTestConnection = async () => {
    if (!validateInputs()) return

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl)
    if (!spreadsheetId) {
      setTestResult({ success: false, message: "❌ URL da planilha inválida" })
      return
    }

    try {
      // Primeiro teste: apenas verificar acesso
      await fetchSheetData({
        apiKey: apiKey.trim(),
        spreadsheetId,
        range: "A1:Z1", // Pegar primeira linha completa para ver os cabeçalhos
      })

      // Segundo teste: pegar dados reais
      const data = await fetchSheetData({
        apiKey: apiKey.trim(),
        spreadsheetId,
        range: range.trim(),
      })

      setTestResult({
        success: true,
        message: `✅ Conexão testada com sucesso! A planilha está acessível.\n\n📊 Encontrados ${data.length} registros.\n\n🔍 Preview dos dados:`,
        data: data.slice(0, 2), // Primeiros 2 registros para preview
      })
    } catch (err) {
      setTestResult({ success: false, message: `❌ ${error || "Erro no teste de conexão"}` })
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug Mode Toggle */}
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setDebugMode(!debugMode)}>
          <Bug className="h-4 w-4 mr-2" />
          {debugMode ? "Desativar" : "Ativar"} Debug
        </Button>
        {debugMode && (
          <span className="text-sm text-gray-600">
            Modo debug ativo - verifique o console do navegador para logs detalhados
          </span>
        )}
      </div>

      {/* URL da Planilha */}
      <div className="space-y-2">
        <Label htmlFor="spreadsheet-url">URL ou ID da Planilha do Google Sheets</Label>
        <div className="flex gap-2">
          <Input
            id="spreadsheet-url"
            type="text"
            placeholder="https://docs.google.com/spreadsheets/d/1ABC123.../edit ou apenas 1ABC123..."
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-sm text-gray-600">Cole a URL completa ou apenas o ID da planilha</p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="api-key">Chave da API do Google</Label>
        <div className="flex gap-2">
          <Input
            id="api-key"
            type={showApiKey ? "text" : "password"}
            placeholder="AIzaSyC..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowApiKey(!showApiKey)}
            title={showApiKey ? "Ocultar API Key" : "Mostrar API Key"}
          >
            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Obtenha sua chave no{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-1"
          >
            Google Cloud Console
            <ExternalLink className="h-3 w-3" />
          </a>
        </p>
      </div>

      {/* Range */}
      <div className="space-y-2">
        <Label htmlFor="range">Intervalo de Células</Label>
        <Input id="range" placeholder="A:D" value={range} onChange={(e) => setRange(e.target.value)} />
        <p className="text-sm text-gray-600">
          Exemplos: A:D (colunas A até D), A1:D100 (intervalo específico), Sheet1!A:D (aba específica)
        </p>
      </div>

      {/* Resultado do Teste */}
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="whitespace-pre-line">{testResult.message}</div>
            {testResult.data && testResult.data.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <strong>Preview dos dados:</strong>
                <pre className="text-xs mt-2 overflow-x-auto">{JSON.stringify(testResult.data, null, 2)}</pre>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Erro da API */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      {/* Botões */}
      <div className="flex gap-2">
        <Button onClick={handleTestConnection} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
          Testar Conexão
        </Button>

        <Button onClick={handleImport} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LinkIcon className="h-4 w-4 mr-2" />}
          Importar Dados
        </Button>
      </div>
    </div>
  )
}
