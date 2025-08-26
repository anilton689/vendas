import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("📥 Recebido na API:", body)

    // Suporte a múltiplos formatos de entrada
    let messages = []
    let model = "gpt-4o-mini"
    let temperature = 0.7
    let max_tokens = 1000

    // Formato novo (preferido)
    if (body.messages) {
      messages = body.messages
      model = body.model || model
      temperature = body.temperature || temperature
      max_tokens = body.maxTokens || body.max_tokens || max_tokens
    }
    // Formato antigo (compatibilidade)
    else if (body.message) {
      const config = body.config || {}
      messages = [
        {
          role: "system",
          content: config.systemPrompt || "Você é um assistente especializado em vendas e follow-up de orçamentos.",
        },
        {
          role: "user",
          content: body.message,
        },
      ]
      model = config.model || model
      temperature = config.temperature || temperature
      max_tokens = config.maxTokens || max_tokens
    } else {
      return NextResponse.json({ error: "Formato de mensagem inválido" }, { status: 400 })
    }

    console.log("🤖 Enviando para OpenAI:", {
      model,
      temperature,
      max_tokens,
      messagesCount: messages.length,
    })

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
    })

    const response = completion.choices[0]?.message?.content || "Sem resposta"

    console.log("✅ Resposta da OpenAI recebida:", response.substring(0, 100) + "...")

    // Retornar em múltiplos formatos para compatibilidade
    return NextResponse.json({
      content: response,
      response: response, // compatibilidade
      usage: completion.usage,
    })
  } catch (error: any) {
    console.error("❌ Erro na API:", error)

    if (error.code === "insufficient_quota") {
      return NextResponse.json({ error: "Cota da API OpenAI esgotada. Verifique seu plano." }, { status: 402 })
    }

    if (error.code === "invalid_api_key") {
      return NextResponse.json({ error: "API Key inválida. Verifique a configuração no Vercel." }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Erro interno do servidor" }, { status: 500 })
  }
}
