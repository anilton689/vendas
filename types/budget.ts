export interface Budget {
  data: string
  sequencia: string
  cliente: string
  valor: number
  codigo_vendedor: string
  nome_vendedor: string
  email_cliente: string
  telefone_cliente: string
  status_atual?: string
  dias_followup?: string
  ultimo_followup?: string
  observacoes_atuais?: string
  historico?: HistoricoItem[]
}

export interface HistoricoItem {
  sequencia_orcamento: string
  data_hora_followup: string
  status: string
  observacoes: string
  codigo_vendedor: string
  nome_vendedor: string
}

export interface AIConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  systemPrompt: string
  followupPrompt: string
  analysisPrompt: string
}

export interface AIAnalysis {
  probabilidade: number
  motivos: string[]
  estrategias: string[]
  proximosPassos: string[]
}
