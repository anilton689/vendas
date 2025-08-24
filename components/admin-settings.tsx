"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, LinkIcon, TestTube, Trash2, Globe } from 'lucide-react'

export function AdminSettings() {
  const [endpoint, setEndpoint] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("write-endpoint")
    if (saved) setEndpoint(saved)
  }, [])

  const handleSave = () => {
    if (!endpoint.trim()) {
      setMessage({ type: "error", text: "Informe o URL do Apps Script Web App." })
      return
    }
    localStorage.setItem("write-endpoint", endpoint.trim())
    setMessage({ type: "success", text: "Endpoint salvo com sucesso!" })
  }

  const handleClear = () => {
    localStorage.removeItem("write-endpoint")
    setEndpoint("")
    setMessage({ type: "success", text: "Endpoint removido." })
  }

  const handleTest = async () => {
    setIsTesting(true)
    setMessage(null)
    try {
      if (!endpoint.trim()) {
        setMessage({ type: "error", text: "Informe o URL do Apps Script Web App para testar." })
        return
      }

      // Monta payload mínimo de teste sem poluir seus dados: tipo_acao = "teste"
      const now = new Date()
      const payload = {
        sequencia_orcamento: "TESTE-000",
        data_hora_followup: now.toISOString(),
        status: "aguardando",
        observacoes: "Teste de conexão - pode excluir esta linha",
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
        setMessage({ type: "success", text: "Conexão OK! Uma linha de TESTE foi enviada para a aba Historico." })
      } else {
        setMessage({ type: "success", text: "Conexão OK! Verifique se a linha de TESTE entrou na aba Historico." })
      }
    } catch (err: any) {
      setMessage({ type: "error", text: `Falha no teste: ${err?.message || "erro desconhecido"}` })
    } finally {
      setIsTesting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configurações de Integração
        </CardTitle>
        <CardDescription>Configure o endpoint de escrita (Apps Script) para salvar follow-ups na aba Historico</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="endpoint">Endpoint de escrita (Apps Script Web App)</Label>
          <Input
            id="endpoint"
            placeholder="https://script.google.com/macros/s/AKfycb.../exec"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
          <p className="text-sm text-gray-600">
            Cole aqui a URL do seu Web App publicado no Google Apps Script (Deploy &gt; New deployment &gt; Web app &gt; Anyone).
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSave}>
            <LinkIcon className="h-4 w-4 mr-2" />
            Salvar Endpoint
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={isTesting || !endpoint.trim()}>
            <TestTube className="h-4 w-4 mr-2" />
            {isTesting ? "Testando..." : "Testar Conexão"}
          </Button>
          <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleClear}>
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        </div>

        {message && (
          <Alert variant={message.type === "success" ? "default" : "destructive"}>
            {message.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription className="whitespace-pre-line">{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="text-sm text-gray-600">
          Campos gravados na planilha Historico: {"sequencia_orcamento, data_hora_followup, status, observacoes, codigo_vendedor, nome_vendedor, tipo_acao, data_orcamento, dias_followup, valor_orcamento"}.
        </div>
      </CardContent>
    </Card>
  )
}
