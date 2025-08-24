import { useState } from 'react'

interface GoogleSheetsConfig {
  apiKey: string
  spreadsheetId: string
  range: string
}

interface SheetData {
  values: any[][]
}

export function useGoogleSheets() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSheetData = async (config: GoogleSheetsConfig): Promise<any[]> => {
    setIsLoading(true)
    setError(null)

    try {
      const { apiKey, spreadsheetId, range } = config
      
      // Validar inputs
      if (!apiKey || !spreadsheetId || !range) {
        throw new Error('API Key, ID da planilha e intervalo são obrigatórios')
      }

      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`
      
      console.log('Fazendo requisição para:', url)
      
      const response = await fetch(url)
      
      if (!response.ok) {
        let errorMessage = 'Erro desconhecido'
        
        switch (response.status) {
          case 400:
            errorMessage = 'Requisição inválida. Verifique o ID da planilha e o intervalo de células.'
            break
          case 403:
            errorMessage = 'Acesso negado. Verifique se:\n• A API Key está correta\n• A API do Google Sheets está ativada\n• A planilha está pública ou compartilhada\n• A API Key tem permissão para acessar a API do Sheets'
            break
          case 404:
            errorMessage = 'Planilha não encontrada. Verifique se o ID da planilha está correto e se ela existe.'
            break
          case 429:
            errorMessage = 'Muitas requisições. Aguarde alguns minutos antes de tentar novamente.'
            break
          default:
            errorMessage = `Erro ${response.status}: ${response.statusText}`
        }
        
        throw new Error(errorMessage)
      }

      const data: SheetData = await response.json()
      
      console.log('Dados recebidos da API:', data)
      
      if (!data.values || data.values.length === 0) {
        throw new Error('Planilha vazia ou sem dados no intervalo especificado')
      }

      // Primeira linha são os cabeçalhos - processar corretamente
      const headerRow = data.values[0]
      console.log('Linha de cabeçalhos bruta:', headerRow)
      
      if (!headerRow || headerRow.length === 0) {
        throw new Error('Linha de cabeçalhos não encontrada')
      }

      // Processar cabeçalhos - garantir que todos sejam strings e limpar
      const headers = headerRow.map((header: any, index: number) => {
        const cleanHeader = String(header || `coluna_${index + 1}`).toLowerCase().trim()
        console.log(`Cabeçalho ${index}:`, header, '->', cleanHeader)
        return cleanHeader
      })
      
      console.log('Cabeçalhos processados:', headers)
      
      // Verificar se tem as colunas obrigatórias com busca mais flexível
      const requiredColumns = ['data', 'sequencia', 'cliente', 'valor']
      const foundColumns: string[] = []
      const missingColumns: string[] = []
      
      requiredColumns.forEach(requiredCol => {
        const found = headers.find(header => {
          // Busca mais flexível - remove acentos e caracteres especiais
          const normalizedHeader = header
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
          
          const normalizedRequired = requiredCol
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
          
          return normalizedHeader.includes(normalizedRequired) || 
                 normalizedRequired.includes(normalizedHeader) ||
                 header === requiredCol ||
                 header.includes(requiredCol)
        })
        
        if (found) {
          foundColumns.push(found)
        } else {
          missingColumns.push(requiredCol)
        }
      })
      
      console.log('Colunas encontradas:', foundColumns)
      console.log('Colunas faltando:', missingColumns)
      
      if (missingColumns.length > 0) {
        throw new Error(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}.\n\nColunas encontradas: ${headers.join(', ')}\n\nVerifique se os nomes das colunas estão corretos.`)
      }

      const rows = data.values.slice(1)
      console.log('Linhas de dados:', rows.length)

      // Converter para objetos
      const formattedData = rows
        .filter(row => row && row.length > 0 && row.some(cell => cell && String(cell).trim())) // Filtrar linhas vazias
        .map((row: any[], rowIndex: number) => {
          const obj: any = {}
          headers.forEach((header: string, index: number) => {
            const cellValue = row[index] || ''
            obj[header] = cellValue
            
            // Log para debug
            if (rowIndex === 0) {
              console.log(`${header} (${index}):`, cellValue)
            }
          })
          return obj
        })

      console.log('Dados formatados:', formattedData.length, 'registros')
      console.log('Primeiro registro:', formattedData[0])

      if (formattedData.length === 0) {
        throw new Error('Nenhum dado válido encontrado na planilha')
      }

      return formattedData
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro no useGoogleSheets:', err)
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return { fetchSheetData, isLoading, error }
}
