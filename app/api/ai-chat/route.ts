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
      hasBudget: !!budget,
      hasConfig: !!config,
      model: config?.model || "não especificado",
      systemPromptLength: config?.systemPrompt?.length || 0,
    })

    // Preparar contexto baseado no orçamento (se fornecido)
    let contextualMessage = message
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

PERGUNTA DO USUÁRIO: ${message}
`
      contextualMessage = budgetContext
    }

    // Usar o systemPrompt da configuração (que vem da planilha)
    const systemPrompt =
      config?.systemPrompt ||
      "Você é um assistente especializado em vendas e follow-up de orçamentos. Seja profissional, objetivo e útil."

    console.log("📝 [AI-API] Usando systemPrompt:", systemPrompt.substring(0, 100) + "...")

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
            content: systemPrompt, // Usar o prompt personalizado da planilha
          },
          {
            role: "user",
            content: contextualMessage,
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

    console.log("✅ [AI-API] Resposta gerada:", aiResponse.substring(0, 100) + "...")

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
