import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, apiKey, model, temperature, maxTokens, message, budget, config } = body

    console.log("🤖 AI Chat API chamada:", {
      hasMessages: !!messages,
      hasMessage: !!message,
      hasBudget: !!budget,
      hasConfig: !!config,
      hasApiKey: !!(apiKey || config?.apiKey),
      apiKeyStart: apiKey || config?.apiKey ? (apiKey || config?.apiKey).substring(0, 7) + "..." : "não fornecida",
    })

    // Verificar se a API Key foi fornecida (pode vir diretamente ou dentro de config)
    const finalApiKey = apiKey || config?.apiKey
    if (!finalApiKey) {
      console.error("❌ API Key não fornecida")
      return NextResponse.json({ error: "API Key não fornecida" }, { status: 400 })
    }

    // Verificar se a API Key tem o formato correto
    if (!finalApiKey.startsWith("sk-")) {
      console.error("❌ API Key inválida - deve começar com sk-")
      return NextResponse.json({ error: "API Key inválida - deve começar com sk-" }, { status: 400 })
    }

    // Preparar mensagens para a API
    let finalMessages = []

    if (messages && Array.isArray(messages)) {
      // Formato novo (array de mensagens)
      finalMessages = messages
    } else if (message) {
      // Formato antigo (mensagem única)
      let contextMessage = message
      if (budget) {
        contextMessage = `
Orçamento para análise:
- Cliente: ${budget.cliente}
- Valor: R$ ${budget.valor?.toLocaleString("pt-BR")}
- Vendedor: ${budget.nome_vendedor}
- Data: ${budget.data}
- Status: ${budget.status_atual || "Em aberto"}
- Dias em follow-up: ${budget.dias_followup || "N/A"}
- Último follow-up: ${budget.ultimo_followup || "Nunca"}
- Observações: ${budget.observacoes_atuais || "Nenhuma"}

Pergunta do usuário: ${message}
`
      }

      finalMessages = [
        {
          role: "system",
          content: config?.systemPrompt || "Você é um assistente especializado em vendas e follow-up de orçamentos.",
        },
        {
          role: "user",
          content: contextMessage,
        },
      ]
    }

    console.log("📤 Enviando para OpenAI:", {
      model: model || config?.model || "gpt-4o-mini",
      temperature: temperature || config?.temperature || 0.7,
      max_tokens: maxTokens || config?.maxTokens || 1000,
      messagesCount: finalMessages.length,
    })

    // Fazer a chamada para a OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${finalApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || config?.model || "gpt-4o-mini",
        messages: finalMessages,
        temperature: temperature || config?.temperature || 0.7,
        max_tokens: maxTokens || config?.maxTokens || 1000,
      }),
    })

    console.log("📥 Resposta da OpenAI:", response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("❌ Erro da OpenAI:", errorData)

      let errorMessage = "Erro na API da OpenAI"
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      } else if (response.status === 401) {
        errorMessage = "API Key inválida ou sem permissão"
      } else if (response.status === 429) {
        errorMessage = "Limite de uso excedido"
      }

      return NextResponse.json({ error: errorMessage }, { status: response.status })
    }

    const data = await response.json()
    const aiResponse = data.choices[0]?.message?.content

    if (!aiResponse) {
      console.error("❌ Resposta vazia da OpenAI")
      return NextResponse.json({ error: "Resposta vazia da IA" }, { status: 500 })
    }

    console.log("✅ Resposta da IA gerada com sucesso:", aiResponse.substring(0, 100) + "...")

    // Retornar no formato esperado pelos diferentes componentes
    return NextResponse.json({
      content: aiResponse,
      response: aiResponse, // Para compatibilidade com código antigo
      usage: data.usage,
    })
  } catch (error: any) {
    console.error("❌ Erro interno na API:", error)
    return NextResponse.json({ error: `Erro interno: ${error.message}` }, { status: 500 })
  }
}
