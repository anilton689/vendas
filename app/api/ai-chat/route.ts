import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { message, budget, config } = await request.json()

    // Verificar se a API Key está configurada no Vercel
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error("❌ OPENAI_API_KEY não configurada no Vercel")
      return NextResponse.json({ error: "API Key da OpenAI não configurada no servidor" }, { status: 500 })
    }

    console.log("🤖 [AI-API] Processando requisição:", {
      hasMessage: !!message,
      messageLength: message?.length || 0,
      hasBudget: !!budget,
      hasConfig: !!config,
      model: config?.model || "não especificado",
      systemPromptLength: config?.systemPrompt?.length || 0,
      systemPromptValue: config?.systemPrompt ? "presente" : "ausente",
    })

    // Validar se a mensagem não está vazia
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      console.error("❌ [AI-API] Mensagem inválida:", { message, type: typeof message })
      return NextResponse.json({ error: "Mensagem é obrigatória e deve ser uma string válida" }, { status: 400 })
    }

    // Preparar contexto baseado no orçamento (se fornecido)
    let contextualMessage = message.trim()
    if (budget) {
      const budgetContext = `
DADOS DO ORÇAMENTO PARA ANÁLISE:
- Sequência: ${budget.sequencia_orcamento || "N/A"}
- Cliente: ${budget.nome_cliente || "N/A"}
- Vendedor: ${budget.nome_vendedor || "N/A"}
- Valor: R$ ${budget.valor_orcamento?.toLocaleString("pt-BR") || "N/A"}
- Data: ${budget.data_orcamento || "N/A"}
- Status: ${budget.status || "N/A"}
- Dias desde criação: ${budget.dias_desde_criacao || "N/A"}
- Observações: ${budget.observacoes || "Nenhuma"}

PERGUNTA DO USUÁRIO: ${message.trim()}
`
      contextualMessage = budgetContext
    }

    // Usar o systemPrompt da configuração com fallback seguro
    let systemPrompt =
      "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil."

    if (config?.systemPrompt && typeof config.systemPrompt === "string" && config.systemPrompt.trim().length > 0) {
      systemPrompt = config.systemPrompt.trim()
      console.log("✅ [AI-API] Usando systemPrompt personalizado:", systemPrompt.substring(0, 100) + "...")
    } else {
      console.log("⚠️ [AI-API] Usando systemPrompt padrão (config inválido):", {
        hasConfig: !!config,
        hasSystemPrompt: !!config?.systemPrompt,
        systemPromptType: typeof config?.systemPrompt,
        systemPromptLength: config?.systemPrompt?.length || 0,
      })
    }

    // Validar que o systemPrompt não é null/undefined
    if (!systemPrompt || typeof systemPrompt !== "string") {
      console.error("❌ [AI-API] SystemPrompt inválido:", { systemPrompt, type: typeof systemPrompt })
      systemPrompt =
        "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil."
    }

    // Validar que a mensagem contextual não é null/undefined
    if (!contextualMessage || typeof contextualMessage !== "string") {
      console.error("❌ [AI-API] Mensagem contextual inválida:", { contextualMessage, type: typeof contextualMessage })
      contextualMessage = message.trim() || "Como posso ajudar?"
    }

    console.log("📝 [AI-API] Dados finais para OpenAI:", {
      systemPromptLength: systemPrompt.length,
      messageLength: contextualMessage.length,
      model: config?.model || "gpt-4o-mini",
      temperature: config?.temperature || 0.7,
      maxTokens: config?.maxTokens || 1000,
    })

    // Fazer requisição para OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config?.model || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: systemPrompt, // Garantido que é string válida
          },
          {
            role: "user",
            content: contextualMessage, // Garantido que é string válida
          },
        ],
        temperature: config?.temperature || 0.7,
        max_tokens: config?.maxTokens || 1000,
      }),
    })

    console.log("📡 [AI-API] Status da resposta OpenAI:", openaiResponse.status)

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json()
      console.error("❌ [AI-API] Erro da OpenAI:", errorData)
      return NextResponse.json(
        { error: errorData.error?.message || "Erro na API da OpenAI" },
        { status: openaiResponse.status },
      )
    }

    const data = await openaiResponse.json()
    const aiResponse = data.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta."

    console.log("✅ [AI-API] Resposta gerada com sucesso:", {
      responseLength: aiResponse.length,
      usage: data.usage,
    })

    return NextResponse.json({
      response: aiResponse,
      model: config?.model || "gpt-4o-mini",
      usage: data.usage,
    })
  } catch (error: any) {
    console.error("❌ [AI-API] Erro no processamento:", error)
    return NextResponse.json({ error: `Erro interno: ${error.message}` }, { status: 500 })
  }
}
