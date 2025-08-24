"use client"

import { useState } from "react"
import type { Vendedor, Budget, HistoricoEntry, BudgetStatus } from "@/types/budget"

interface GoogleSheetsConfig {
  apiKey: string
  spreadsheetId: string
}

export function useGoogleSheetsAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Função auxiliar para fazer requisições à API do Google Sheets
  const fetchSheetData = async (config: GoogleSheetsConfig, range: string): Promise<any[]> => {
    const { apiKey, spreadsheetId } = config
    const encodedRange = encodeURIComponent(range)
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`

    console.log("🔍 Fazendo requisição para Google Sheets:")
    console.log("📊 Range:", range)
    console.log("🔑 API Key:", apiKey.substring(0, 10) + "...")
    console.log("📋 Spreadsheet ID:", spreadsheetId)
    console.log("🌐 URL completa:", url)

    const response = await fetch(url)

    console.log("📡 Status da resposta:", response.status, response.statusText)

    if (!response.ok) {
      let errorDetails: any = null
      try {
        errorDetails = await response.json()
        console.error("❌ Detalhes do erro:", errorDetails)
      } catch (parseError) {
        console.error("❌ Erro ao parsear resposta de erro:", parseError)
      }

      const errorMessage = errorDetails?.error?.message || response.statusText
      throw new Error(`Erro ${response.status}: ${errorMessage}`)
    }

    const data = await response.json()
    console.log("📊 Resposta completa:", data)

    if (!data.values || data.values.length === 0) {
      console.warn("⚠️ Nenhum dado encontrado no range:", range)
      return []
    }

    console.log("✅ Dados recebidos:", data.values.length, "linhas")
    console.log("📋 Primeiras linhas:", data.values.slice(0, 3))
    return data.values
  }

  // Autenticar usuário
  const authenticateUser = async (
    config: GoogleSheetsConfig,
    codigo: string,
    senha: string,
  ): Promise<Vendedor | null> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("🔐 Autenticando usuário:")
      console.log("👤 Código:", codigo)
      console.log("🔧 Configuração:", {
        apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : "não definida",
        spreadsheetId: config.spreadsheetId || "não definido",
      })

      // Validar configuração
      if (!config.apiKey || !config.spreadsheetId) {
        throw new Error("API Key e ID da planilha são obrigatórios")
      }

      // Buscar dados da aba Vendedor (colunas A até C = codigo, nome, senha)
      console.log("📋 Buscando dados da aba 'Vendedor'...")
      const vendedorData = await fetchSheetData(config, "Vendedor!A:C")

      if (vendedorData.length <= 1) {
        throw new Error(
          "Nenhum vendedor encontrado na aba 'Vendedor' da planilha. Verifique se a aba existe e tem dados.",
        )
      }

      console.log("👥 Dados da aba Vendedor:", vendedorData)

      // Primeira linha são os cabeçalhos, pular
      const vendedores = vendedorData
        .slice(1)
        .map((row, index) => {
          const vendedor = {
            codigo_vendedor: String(row[0] || "").trim(),
            nome_vendedor: String(row[1] || "").trim() || `Vendedor ${row[0]}`,
            senha: String(row[2] || "").trim(), // Coluna C (índice 2)
          }
          console.log(`Vendedor ${index + 1}:`, {
            codigo: vendedor.codigo_vendedor,
            nome: vendedor.nome_vendedor,
            senha: vendedor.senha ? "***" : "vazia",
          })
          return vendedor
        })
        .filter((v) => v.codigo_vendedor) // Filtrar linhas vazias

      console.log("👥 Vendedores processados:", vendedores.length)

      if (vendedores.length === 0) {
        throw new Error(
          "Nenhum vendedor válido encontrado na planilha. Verifique se há dados nas colunas A, B e C da aba 'Vendedor'.",
        )
      }

      // Procurar vendedor com código e senha correspondentes
      const vendedor = vendedores.find((v) => {
        const codigoMatch = v.codigo_vendedor === codigo.trim()
        const senhaMatch = v.senha === senha.trim()
        console.log(`Verificando vendedor ${v.codigo_vendedor}:`, {
          codigoMatch,
          senhaMatch,
          codigoVendedor: v.codigo_vendedor,
          codigoInput: codigo.trim(),
          senhaVendedor: v.senha ? "***" : "vazia",
          senhaInput: senha.trim() ? "***" : "vazia",
        })
        return codigoMatch && senhaMatch
      })

      if (vendedor) {
        console.log("✅ Vendedor autenticado com sucesso:", vendedor.nome_vendedor)
        return vendedor
      } else {
        console.log("❌ Credenciais inválidas - nenhum vendedor encontrado com esse código e senha")
        console.log(
          "Códigos disponíveis:",
          vendedores.map((v) => v.codigo_vendedor),
        )
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro na autenticação"
      console.error("❌ Erro na autenticação:", errorMessage)
      setError(errorMessage)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar orçamentos
  const fetchOrcamentos = async (config: GoogleSheetsConfig): Promise<Budget[]> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📊 Buscando orçamentos...")

      // Buscar dados da aba Orçamentos (colunas A até H)
      const orcamentosData = await fetchSheetData(config, "Orçamentos!A:H")

      if (orcamentosData.length <= 1) {
        console.warn("⚠️ Nenhum orçamento encontrado")
        return []
      }

      console.log("📋 Dados brutos dos orçamentos (Hook):", orcamentosData.slice(0, 3)) // Debug das primeiras linhas

      // Processar dados (pular cabeçalho)
      const orcamentos = orcamentosData
        .slice(1)
        .map((row, index) => {
          try {
            const dataOriginal = row[0]
            const dataConvertida = convertExcelDate(dataOriginal)

            console.log(
              `📅 Hook - Linha ${index + 2}: Data original="${dataOriginal}" -> Convertida="${dataConvertida}"`,
            )

            return {
              data: dataConvertida,
              sequencia: String(row[1] || "").trim(),
              cliente: String(row[2] || "").trim(),
              valor: convertValue(row[3]),
              codigo_vendedor: String(row[4] || "").trim(),
              nome_vendedor: String(row[5] || "").trim(),
              email_cliente: String(row[6] || "").trim(),
              telefone_cliente: String(row[7] || "").trim(),
            }
          } catch (error) {
            console.error(`Erro ao processar linha ${index + 2}:`, error, row)
            return null
          }
        })
        .filter(Boolean) as Budget[]

      console.log("✅ Orçamentos carregados:", orcamentos.length)
      return orcamentos
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar orçamentos"
      console.error("❌ Erro ao buscar orçamentos:", errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Buscar histórico
  const fetchHistorico = async (config: GoogleSheetsConfig): Promise<HistoricoEntry[]> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📈 Buscando histórico...")

      // Buscar dados da aba Historico (colunas A até J)
      const historicoData = await fetchSheetData(config, "Historico!A:J")

      if (historicoData.length <= 1) {
        console.warn("⚠️ Nenhum histórico encontrado")
        return []
      }

      // Processar dados (pular cabeçalho)
      const historico = historicoData
        .slice(1)
        .map((row, index) => {
          try {
            return {
              sequencia_orcamento: String(row[0] || "").trim(),
              data_hora_followup: String(row[1] || "").trim(),
              status: (row[2] || "aguardando_analise") as BudgetStatus,
              observacoes: String(row[3] || "").trim(),
              codigo_vendedor: String(row[4] || "").trim(),
              nome_vendedor: String(row[5] || "").trim(),
              tipo_acao: (row[6] || "followup") as "followup" | "criacao" | "importacao",
              data_orcamento: String(row[7] || "").trim(),
              dias_followup: String(row[8] || "").trim(),
              valor_orcamento: convertValue(row[9]),
            }
          } catch (error) {
            console.error(`Erro ao processar linha histórico ${index + 2}:`, error, row)
            return null
          }
        })
        .filter(Boolean) as HistoricoEntry[]

      console.log("✅ Histórico carregado:", historico.length)
      return historico
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao buscar histórico"
      console.error("❌ Erro ao buscar histórico:", errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar entrada no histórico
  const addHistoricoEntry = async (config: GoogleSheetsConfig, entry: HistoricoEntry): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      console.log("📝 Adicionando entrada no histórico:", entry)

      // Buscar endpoint de escrita salvo
      const writeEndpoint = localStorage.getItem("write-endpoint")
      if (!writeEndpoint) {
        throw new Error("URL do Apps Script não configurada. Configure em Sistema → Configurações.")
      }

      console.log("🚀 Enviando para Apps Script:", writeEndpoint)

      // Preparar dados do follow-up
      const followupData = {
        sequencia_orcamento: entry.sequencia_orcamento,
        data_hora_followup: entry.data_hora_followup,
        status: entry.status,
        observacoes: entry.observacoes,
        codigo_vendedor: entry.codigo_vendedor,
        nome_vendedor: entry.nome_vendedor,
        tipo_acao: entry.tipo_acao || "followup",
        data_orcamento: entry.data_orcamento || new Date().toISOString().split("T")[0],
        dias_followup: entry.dias_followup || "Manual",
        valor_orcamento: entry.valor_orcamento || 0,
      }

      console.log("📦 Dados preparados:", followupData)

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

      // Submeter form
      return new Promise((resolve) => {
        // Timeout para assumir sucesso
        const timeout = setTimeout(() => {
          cleanup()
          console.log("✅ Follow-up enviado (timeout)")
          resolve(true)
        }, 3000)

        // Cleanup function
        const cleanup = () => {
          clearTimeout(timeout)
          if (document.body.contains(form)) document.body.removeChild(form)
          if (document.body.contains(iframe)) document.body.removeChild(iframe)
        }

        // Listener para iframe load
        iframe.onload = () => {
          cleanup()
          console.log("✅ Follow-up enviado (iframe loaded)")
          resolve(true)
        }

        // Submeter
        form.submit()
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao adicionar entrada no histórico"
      console.error("❌ Erro ao adicionar entrada no histórico:", errorMessage)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Adicionar follow-up (usando form submission para contornar CORS)
  const addFollowup = async (sequencia: string, status: BudgetStatus, observacoes: string): Promise<boolean> => {
    const entry: HistoricoEntry = {
      sequencia_orcamento: sequencia,
      data_hora_followup: new Date().toISOString(),
      status: status,
      observacoes: observacoes,
      codigo_vendedor: localStorage.getItem("user-codigo") || "",
      nome_vendedor: localStorage.getItem("user-nome") || "",
      tipo_acao: "followup",
      data_orcamento: new Date().toISOString().split("T")[0],
      dias_followup: "Manual",
      valor_orcamento: 0,
    }

    const config = JSON.parse(localStorage.getItem("admin-sheets-config") || "{}")
    return await addHistoricoEntry(config, entry)
  }

  return {
    isLoading,
    error,
    authenticateUser,
    fetchOrcamentos,
    fetchHistorico,
    addHistoricoEntry,
    addFollowup,
    fetchSheetData,
  }
}

// Funções auxiliares
function convertExcelDate(excelDate: any): string {
  console.log("🔍 Hook - Convertendo data:", excelDate, "Tipo:", typeof excelDate)

  // Se for um número (data serial do Excel)
  if (typeof excelDate === "number") {
    console.log("📊 Hook - Convertendo data serial do Excel:", excelDate)
    // Fórmula correta para converter data serial do Excel
    const utcDate = new Date((excelDate - 25569) * 86400 * 1000)
    const year = utcDate.getUTCFullYear()
    const month = utcDate.getUTCMonth() + 1
    const day = utcDate.getUTCDate()
    const resultado = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    console.log("✅ Hook - Data serial convertida:", resultado)
    return resultado
  }

  // Se for string
  if (typeof excelDate === "string") {
    const cleanDate = excelDate.trim()
    console.log("📝 Hook - Processando string de data:", cleanDate)

    // Se já está no formato ISO (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      console.log("✅ Hook - Data já no formato ISO:", cleanDate)
      return cleanDate
    }

    // Tentar formato brasileiro dd/mm/yyyy
    const brFormat = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/
    const brMatch = cleanDate.match(brFormat)
    if (brMatch) {
      const day = Number.parseInt(brMatch[1])
      const month = Number.parseInt(brMatch[2])
      const year = Number.parseInt(brMatch[3])
      const resultado = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      console.log("✅ Hook - Data brasileira convertida:", resultado)
      return resultado
    }

    // Tentar formato americano mm/dd/yyyy
    const usFormat = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/
    const usMatch = cleanDate.match(usFormat)
    if (usMatch) {
      const month = Number.parseInt(usMatch[1])
      const day = Number.parseInt(usMatch[2])
      const year = Number.parseInt(usMatch[3])
      // Assumir formato brasileiro se dia > 12
      if (day > 12) {
        const resultado = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        console.log("✅ Hook - Data americana (invertida para BR) convertida:", resultado)
        return resultado
      } else {
        const resultado = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        console.log("✅ Hook - Data americana convertida:", resultado)
        return resultado
      }
    }

    // Tentar formato ISO com hora (YYYY-MM-DDTHH:mm:ss)
    if (cleanDate.includes("T")) {
      const isoDate = cleanDate.split("T")[0]
      if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        console.log("✅ Hook - Data ISO com hora convertida:", isoDate)
        return isoDate
      }
    }

    // Tentar parsear como Date
    try {
      const parsedDate = new Date(cleanDate)
      if (!isNaN(parsedDate.getTime())) {
        const year = parsedDate.getFullYear()
        const month = parsedDate.getMonth() + 1
        const day = parsedDate.getDate()
        const resultado = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
        console.log("✅ Hook - Data parseada:", resultado)
        return resultado
      }
    } catch (e) {
      console.warn("⚠️ Hook - Erro ao parsear data:", e)
    }
  }

  // Fallback: data atual
  const today = new Date()
  const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
  console.warn("⚠️ Hook - Usando data atual como fallback:", fallback)
  return fallback
}

function convertValue(value: any): number {
  if (typeof value === "number") {
    return value
  }
  if (typeof value === "string") {
    // Remover símbolos de moeda e converter
    const cleanValue = value
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
    const numValue = Number.parseFloat(cleanValue)
    return isNaN(numValue) ? 0 : numValue
  }
  return 0
}
