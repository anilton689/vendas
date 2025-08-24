import { useState } from 'react'
import { HistoricoEntry } from '@/types/budget'

interface GoogleSheetsConfig {
  apiKey: string
  spreadsheetId: string
}

export function useGoogleSheetsWrite() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const writeToHistorico = async (config: GoogleSheetsConfig, entry: HistoricoEntry): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { apiKey, spreadsheetId } = config
      
      // Preparar os dados na ordem correta das colunas
      const values = [[
        entry.sequencia_orcamento,
        entry.data_hora_followup,
        entry.status,
        entry.observacoes,
        entry.codigo_vendedor,
        entry.nome_vendedor,
        entry.tipo_acao,
        entry.data_orcamento,
        entry.dias_followup,
        entry.valor_orcamento
      ]]

      // URL da API para adicionar dados
      const range = 'Historico!A:J'
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&key=${apiKey}`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: values
        })
      })

      if (!response.ok) {
        let errorMessage = 'Erro desconhecido'
        
        try {
          const errorData = await response.json()
          const apiError = errorData?.error?.message || ''
          
          switch (response.status) {
            case 400:
              if (/API key not valid/i.test(apiError)) {
                errorMessage = 'API Key inválida. Verifique a chave no Google Cloud Console.'
              } else if (/Unable to parse range/i.test(apiError)) {
                errorMessage = 'Não foi possível encontrar a aba "Historico". Verifique se ela existe na planilha.'
              } else {
                errorMessage = `Requisição inválida (400). ${apiError}`
              }
              break
            case 403:
              if (/write access/i.test(apiError) || /edit/i.test(apiError)) {
                errorMessage = 'Sem permissão de escrita. A API Key do Google não permite escrita em planilhas. Use o método do Google Apps Script ou configure uma Service Account.'
              } else {
                errorMessage = `Acesso negado (403). ${apiError}`
              }
              break
            case 404:
              errorMessage = 'Planilha não encontrada. Verifique o ID da planilha.'
              break
            default:
              errorMessage = `Erro ${response.status}: ${apiError || response.statusText}`
          }
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Dados escritos com sucesso:', result)
      return true

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao escrever na planilha'
      console.error('Erro ao escrever na planilha:', err)
      setError(errorMessage)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const testWrite = async (config: GoogleSheetsConfig): Promise<boolean> => {
    const testEntry: HistoricoEntry = {
      sequencia_orcamento: 'TESTE-WRITE',
      data_hora_followup: new Date().toISOString(),
      status: 'aguardando',
      observacoes: 'Teste de escrita direta na API - pode excluir esta linha',
      codigo_vendedor: '1',
      nome_vendedor: 'Admin',
      tipo_acao: 'teste',
      data_orcamento: new Date().toISOString().slice(0, 10),
      dias_followup: 'A agendar',
      valor_orcamento: 0
    }

    return await writeToHistorico(config, testEntry)
  }

  return {
    writeToHistorico,
    testWrite,
    isLoading,
    error
  }
}
