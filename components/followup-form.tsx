"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MessageSquare, MessageCircle, Loader2, ExternalLink } from "lucide-react"

import type { Budget } from "@/types/budget"

interface FollowupFormProps {
  budget: Budget
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  user: { codigo: string; nome: string }
}

export function FollowupForm({ budget, isOpen, onClose, onSuccess, user }: FollowupFormProps) {
  const [followupStatus, setFollowupStatus] = useState("")
  const [followupObservacoes, setFollowupObservacoes] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("whatsapp")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const submitFollowup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!followupStatus || !followupObservacoes.trim()) {
      alert("Por favor, preencha o status e as observações.")
      return
    }

    // Buscar URL do Apps Script com fallback automático
    let writeEndpoint = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

    // Se não encontrar, configurar automaticamente
    if (!writeEndpoint) {
      writeEndpoint =
        "https://script.google.com/macros/s/AKfycbxGZKIBspUIbfhZaanLSTkc1VGuowbpu0b8cd6HUphvZpwwQ1d_n7Uq0kiBrxCXFMnIng/exec"
      localStorage.setItem("write-endpoint", writeEndpoint)
      localStorage.setItem("apps-script-url", writeEndpoint)
      console.log("🔧 URL do Apps Script configurada automaticamente:", writeEndpoint)
    }

    console.log("🔍 URL do Apps Script encontrada:", writeEndpoint)

    setIsSubmitting(true)

    try {
      const followupData = {
        sequencia_orcamento: budget.sequencia,
        data_hora_followup: new Date().toISOString(),
        status: followupStatus,
        observacoes: followupObservacoes,
        codigo_vendedor: user.codigo,
        nome_vendedor: user.nome,
        tipo_acao: "followup",
        data_orcamento: budget.data,
        valor_orcamento: budget.valor,
        canal_contato: selectedChannel,
      }

      console.log("📦 Enviando dados para Apps Script:", followupData)
      console.log("🚀 URL de destino:", writeEndpoint)

      // Criar form invisível para submissão
      const form = document.createElement("form")
      form.method = "POST"
      form.action = writeEndpoint
      form.style.display = "none"

      // Criar iframe invisível para receber resposta
      const iframe = document.createElement("iframe")
      iframe.name = `followup-iframe-${Date.now()}`
      iframe.style.display = "none"
      form.target = iframe.name

      // Adicionar dados como campo hidden
      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "json_data"
      input.value = JSON.stringify(followupData)
      form.appendChild(input)

      // Adicionar ao DOM
      document.body.appendChild(iframe)
      document.body.appendChild(form)

      // Submeter form e aguardar resposta
      const submitPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          cleanup()
          console.log("✅ Follow-up enviado (timeout - assumindo sucesso)")
          resolve()
        }, 3000)

        const cleanup = () => {
          clearTimeout(timeout)
          if (document.body.contains(form)) document.body.removeChild(form)
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }

        iframe.onload = () => {
          cleanup()
          console.log("✅ Follow-up enviado (iframe carregado)")
          resolve()
        }

        form.submit()
        console.log("📤 Form submetido para Apps Script")
      })

      await submitPromise

      onClose()
      onSuccess()
      alert("✅ Follow-up registrado com sucesso!")
    } catch (error) {
      console.error("❌ Erro ao enviar follow-up:", error)
      alert(`❌ Erro ao registrar follow-up: ${error}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const calculateDaysOpen = (budgetDate: string): number => {
    const today = new Date()
    const [year, month, day] = budgetDate.split("-").map(Number)
    const budgetDateObj = new Date(year, month - 1, day)
    const diffTime = today.getTime() - budgetDateObj.getTime()
    return Math.floor(diffTime / (1000 * 60 * 60 * 24))
  }

  const openAIChat = () => {
    // Abrir chat IA principal em nova aba
    window.open("/ai-chat", "_blank")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up: {budget?.cliente}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{budget?.sequencia}</Badge>
                <Badge variant="secondary">R$ {budget?.valor.toLocaleString("pt-BR")}</Badge>
                <Badge variant="outline">{calculateDaysOpen(budget?.data || "")} dias em aberto</Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Botão para Chat IA */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">Precisa de ajuda com estratégias?</h3>
                    <p className="text-sm text-blue-700">Use o Chat IA para obter sugestões personalizadas</p>
                  </div>
                </div>
                <Button
                  onClick={openAIChat}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Abrir Chat IA
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Follow-up */}
          <form onSubmit={submitFollowup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Novo Status do Orçamento *</Label>
                <Select value={followupStatus} onValueChange={setFollowupStatus} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aguardando_analise">🔍 Aguardando Análise</SelectItem>
                    <SelectItem value="em_negociacao">💬 Em Negociação</SelectItem>
                    <SelectItem value="aguardando_aprovacao">⏳ Aguardando Aprovação</SelectItem>
                    <SelectItem value="pedido_fechado">✅ Pedido Fechado</SelectItem>
                    <SelectItem value="orcamento_perdido">❌ Orçamento Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="channel">Canal de Contato</Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">📱 WhatsApp</SelectItem>
                    <SelectItem value="email">📧 E-mail</SelectItem>
                    <SelectItem value="telefone">📞 Telefone</SelectItem>
                    <SelectItem value="reuniao">🤝 Reunião</SelectItem>
                    <SelectItem value="visita">🏢 Visita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações do Follow-up *</Label>
              <Textarea
                id="observacoes"
                placeholder="Descreva o que aconteceu no follow-up, próximos passos, feedback do cliente, etc..."
                value={followupObservacoes}
                onChange={(e) => setFollowupObservacoes(e.target.value)}
                rows={4}
                className="mt-1"
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!followupStatus || !followupObservacoes.trim() || isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Follow-up
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
