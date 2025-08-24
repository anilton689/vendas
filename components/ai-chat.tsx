"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Brain, Send, Loader2, User, Bot, AlertCircle } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError("")

    try {
      // Buscar configuração da IA do localStorage
      const aiConfig = JSON.parse(localStorage.getItem("ai-config") || "{}")

      console.log("🤖 Configuração da IA encontrada:", {
        hasApiKey: !!aiConfig.apiKey,
        apiKeyStart: aiConfig.apiKey ? aiConfig.apiKey.substring(0, 7) + "..." : "não encontrada",
        model: aiConfig.model || "não definido",
      })

      if (!aiConfig.apiKey) {
        throw new Error("API Key da IA não configurada. Configure primeiro em Sistema → Configurar IA.")
      }

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          budget: null, // Chat livre, sem contexto de orçamento
          config: {
            apiKey: aiConfig.apiKey,
            model: aiConfig.model || "gpt-4o-mini",
            temperature: aiConfig.temperature || 0.7,
            maxTokens: aiConfig.maxTokens || 1000,
            systemPrompt:
              aiConfig.systemPrompt ||
              "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil.",
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro na comunicação com a IA")
      }

      const data = await response.json()

      const aiMessage: Message = {
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error: any) {
      console.error("❌ Erro no chat:", error)
      setError(error.message || "Erro ao comunicar com a IA. Verifique se a API Key está configurada.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const suggestedQuestions = [
    "Como melhorar minha taxa de fechamento?",
    "Qual a melhor estratégia para follow-up?",
    "Como lidar com objeções de preço?",
    "Dicas para acelerar o processo de vendas",
  ]

  return (
    <div className="space-y-4">
      {/* Chat Messages */}
      <div className="border rounded-lg p-4 h-96 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-4">Olá! Sou sua IA de vendas. Como posso ajudar?</p>
            <div className="space-y-2">
              {suggestedQuestions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setInput(question)}
                  className="block mx-auto"
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user" ? "bg-blue-500 text-white" : "bg-white border shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-2 mb-2">
                    {message.role === "user" ? (
                      <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.role === "user" ? "text-blue-100" : "text-gray-500"}`}>
                        {message.timestamp.toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border shadow-sm p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4" />
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Pensando...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          placeholder="Digite sua pergunta sobre vendas, estratégias, follow-ups..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          rows={2}
          className="flex-1 resize-none"
          disabled={isLoading}
        />
        <Button onClick={sendMessage} disabled={isLoading || !input.trim()} className="self-end">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>

      <div className="text-xs text-gray-500 text-center">
        💡 Dica: Pressione Enter para enviar, Shift+Enter para nova linha
      </div>
    </div>
  )
}
