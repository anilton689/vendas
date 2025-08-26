import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages, model, temperature, maxTokens, message, budget, config } = body

    console.log("🤖 AI Chat API chamada:", {
      hasMessages: !!messages,
      hasMessage: !!message,
      hasBudget: !!budget,
      hasConfig: !!config,
      model: model || config?.model || "gpt-4o-mini",
    })

    // Usar API Key do ambiente do Vercel (server-side)
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY não configurada no Vercel")
      return NextResponse.json(
        {
          error:
            "API Key da OpenAI não configurada no servidor. Configure OPENAI_API_KEY nas variáveis de ambiente do Vercel.",
        },
        { status: 500 },
      )
    }

    console.log("✅ API Key encontrada no ambiente do servidor")

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

    const finalModel = model || config?.model || "gpt-4o-mini"
    const finalTemperature = temperature || config?.temperature || 0.7
    const finalMaxTokens = maxTokens || config?.maxTokens || 1000

    console.log("📤 Enviando para OpenAI:", {
      model: finalModel,
      temperature: finalTemperature,
      max_tokens: finalMaxTokens,
      messagesCount: finalMessages.length,
    })

    // Fazer a chamada para a OpenAI usando a API Key do servidor
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: finalModel,
        messages: finalMessages,
        temperature: finalTemperature,
        max_tokens: finalMaxTokens,
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
