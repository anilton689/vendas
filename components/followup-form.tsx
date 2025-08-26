"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Plus, MessageSquare, Loader2 } from "lucide-react"
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

    let writeEndpoint = localStorage.getItem("write-endpoint") || localStorage.getItem("apps-script-url")

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

      const form = document.createElement("form")
      form.method = "POST"
      form.action = writeEndpoint
      form.style.display = "none"

      const iframe = document.createElement("iframe")
      iframe.name = `followup-iframe-${Date.now()}`
      iframe.style.display = "none"
      form.target = iframe.name

      const input = document.createElement("input")
      input.type = "hidden"
      input.name = "json_data"
      input.value = JSON.stringify(followupData)
      form.appendChild(input)

      document.body.appendChild(iframe)
      document.body.appendChild(form)

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

      // Limpar campos após sucesso
      setFollowupStatus("")
      setFollowupObservacoes("")
      setSelectedChannel("whatsapp")

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Follow-up: {budget?.cliente}
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2 mt-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline">{budget?.sequencia}</Badge>
                <Badge variant="secondary">R$ {budget?.valor?.toLocaleString("pt-BR")}</Badge>
                <Badge variant="outline">{calculateDaysOpen(budget?.data || "")} dias em aberto</Badge>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          <form onSubmit={submitFollowup} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium">
                  Novo Status do Orçamento *
                </Label>
                <Select value={followupStatus} onValueChange={setFollowupStatus} required>
                  <SelectTrigger className="w-full">
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

              <div className="space-y-2">
                <Label htmlFor="channel" className="text-sm font-medium">
                  Canal de Contato
                </Label>
                <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                  <SelectTrigger className="w-full">
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

            <div className="space-y-2">
              <Label htmlFor="observacoes" className="text-sm font-medium">
                Observações do Follow-up *
              </Label>
              <Textarea
                id="observacoes"
                placeholder="Descreva o que aconteceu no follow-up, próximos passos, feedback do cliente, etc..."
                value={followupObservacoes}
                onChange={(e) => setFollowupObservacoes(e.target.value)}
                rows={5}
                className="w-full resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                Seja específico sobre o contato realizado e próximos passos
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={!followupStatus || !followupObservacoes.trim() || isSubmitting}
                className="flex-1 h-11"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Registrando Follow-up...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Follow-up
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-11 bg-transparent"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
