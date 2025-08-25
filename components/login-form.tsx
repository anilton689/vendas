"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, User, Lock, Settings, CheckCircle, AlertCircle } from "lucide-react"
import { useGoogleSheetsAuth } from "@/hooks/useGoogleSheetsAuth"

interface LoginFormProps {
  onLogin: (userData: { codigo: string; nome: string; tipo: "admin" | "vendedor"; loginEm: string }) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [credentials, setCredentials] = useState({
    codigo: "",
    senha: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showConfig, setShowConfig] = useState(false)
  const [isConfigured, setIsConfigured] = useState(false)

  const { authenticateUser } = useGoogleSheetsAuth()

  // Configuração fixa baseada nas informações fornecidas
  const GOOGLE_SHEETS_CONFIG = {
    apiKey: "AIzaSyDto3POftQiQbAK2jGEv9uqB7rLyzWa8l8",
    spreadsheetId: "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds",
  }

  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"

  const OPENAI_API_KEY =
    "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"

  useEffect(() => {
    // Configurar automaticamente as APIs na inicialização
    configureAPIs()
  }, [])

  const configureAPIs = () => {
    try {
      // Salvar configuração do Google Sheets
      localStorage.setItem("admin-api-key", GOOGLE_SHEETS_CONFIG.apiKey)
      localStorage.setItem("admin-spreadsheet-id", GOOGLE_SHEETS_CONFIG.spreadsheetId)
      localStorage.setItem("admin-sheets-config", JSON.stringify(GOOGLE_SHEETS_CONFIG))
      localStorage.setItem("sheets-config", JSON.stringify(GOOGLE_SHEETS_CONFIG))

      // Salvar URL do Apps Script
      localStorage.setItem("write-endpoint", APPS_SCRIPT_URL)

      // Configurar IA automaticamente
      const aiConfig = {
        apiKey: OPENAI_API_KEY,
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
      }

      localStorage.setItem("ai-config", JSON.stringify(aiConfig))

      setIsConfigured(true)
      console.log("✅ Todas as APIs configuradas automaticamente")
    } catch (error) {
      console.error("❌ Erro ao configurar APIs:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!credentials.codigo || !credentials.senha) {
      setError("Código e senha são obrigatórios")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      console.log("🔍 Tentando autenticação via Google Sheets...")
      console.log("📋 Usando planilha:", GOOGLE_SHEETS_CONFIG.spreadsheetId)
      console.log("👤 Código do usuário:", credentials.codigo)

      // Tentar autenticação via Google Sheets
      const vendedor = await authenticateUser(GOOGLE_SHEETS_CONFIG, credentials.codigo, credentials.senha)

      if (vendedor) {
        // Determinar tipo de usuário baseado no código
        const isAdmin = credentials.codigo === "1"

        const userData = {
          codigo: vendedor.codigo_vendedor,
          nome: vendedor.nome_vendedor,
          tipo: isAdmin ? ("admin" as const) : ("vendedor" as const),
          loginEm: new Date().toISOString(),
        }

        console.log("✅ Login via Google Sheets realizado:", userData)
        await onLogin(userData)
      } else {
        throw new Error("Código ou senha inválidos. Verifique suas credenciais na planilha.")
      }
    } catch (error: any) {
      console.error("❌ Erro no login:", error)
      setError(error.message || "Erro ao fazer login")
    } finally {
      setIsLoading(false)
    }
  }

  if (showConfig) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            Configuração do Sistema
          </CardTitle>
          <CardDescription>Configurações automáticas aplicadas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>✅ Sistema Configurado Automaticamente!</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• Google Sheets API: Configurada</li>
                <li>• Planilha de dados: Conectada</li>
                <li>• Apps Script: URL salva</li>
                <li>• IA ChatGPT: API Key configurada</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3">📊 Google Sheets</h4>
              <div className="text-sm text-blue-800 space-y-2">
                <p>
                  <strong>API Key:</strong> AIza...8l8 ✅
                </p>
                <p>
                  <strong>Planilha:</strong> 1tGG...Zds ✅
                </p>
                <p>
                  <strong>Aba:</strong> Vendedor
                </p>
                <p>
                  <strong>Colunas:</strong> A (código), C (senha)
                </p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-3">🤖 IA ChatGPT</h4>
              <div className="text-sm text-purple-800 space-y-2">
                <p>
                  <strong>API Key:</strong> sk-proj...qbUA ✅
                </p>
                <p>
                  <strong>Modelo:</strong> GPT-4o Mini
                </p>
                <p>
                  <strong>Status:</strong> Configurada
                </p>
                <p>
                  <strong>Prompts:</strong> Vendas otimizados
                </p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-medium text-green-900 mb-3">📝 Apps Script</h4>
              <div className="text-sm text-green-800 space-y-2">
                <p>
                  <strong>URL:</strong> script.google.com ✅
                </p>
                <p>
                  <strong>Função:</strong> Follow-up automático
                </p>
                <p>
                  <strong>Status:</strong> Pronto para uso
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-3">👥 Usuários</h4>
              <div className="text-sm text-yellow-800 space-y-2">
                <p>
                  <strong>Admin:</strong> Código 1
                </p>
                <p>
                  <strong>Vendedores:</strong> Demais códigos
                </p>
                <p>
                  <strong>Autenticação:</strong> Via planilha
                </p>
                <p>
                  <strong>Aba:</strong> Vendedor (A=código, C=senha)
                </p>
              </div>
            </div>
          </div>

          <Button onClick={() => setShowConfig(false)} className="w-full">
            Voltar ao Login
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">💎 Crystal Follow-up</CardTitle>
          <CardDescription>Entre com seu código de vendedor e senha</CardDescription>
          {isConfigured && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Sistema configurado</span>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Código do Vendedor</label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Digite seu código (ex: 1 para admin)"
                  value={credentials.codigo}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, codigo: e.target.value }))}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="password"
                  placeholder="Digite sua senha"
                  value={credentials.senha}
                  onChange={(e) => setCredentials((prev) => ({ ...prev, senha: e.target.value }))}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Autenticando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfig(true)}
              className="w-full"
              disabled={isLoading}
            >
              <Settings className="mr-2 h-4 w-4" />
              Ver Configurações
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="font-medium text-blue-900 mb-2">📋 Informações de Login:</p>
              <div className="space-y-1 text-xs text-blue-800">
                <p>
                  • <strong>Admin:</strong> Código 1 + sua senha
                </p>
                <p>
                  • <strong>Vendedores:</strong> Seu código + sua senha
                </p>
                <p>• Dados vêm da aba "Vendedor" da planilha</p>
                <p>• Coluna A = código, Coluna C = senha</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
