import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Trash2, Download, Upload, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

interface Budget {
  id: string
  data: string
  sequencia: string
  cliente: string
  valor: number
  status: "aguardando" | "fechado" | "perdido" | "negociando" | "nao_atendeu"
  observacoes: string
  followUpDay: number
  lastFollowUp?: string
  createdAt?: string
  updatedAt?: string
}

interface DataManagementProps {
  budgets: Budget[]
  historicalData: Budget[]
  setBudgets: (budgets: Budget[]) => void
  setHistoricalData: (data: Budget[]) => void
}

export function DataManagement({ budgets, historicalData, setBudgets, setHistoricalData }: DataManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleClearAllData = () => {
    setBudgets([])
    setHistoricalData([])
    localStorage.removeItem('budgets')
    localStorage.removeItem('historical-budgets')
    alert('✅ Todos os dados foram limpos com sucesso!')
    setIsDialogOpen(false)
    window.location.reload()
  }

  const handleExportData = () => {
    const dataToExport = {
      budgets,
      historicalData,
      exportDate: new Date().toISOString(),
      totalRecords: historicalData.length,
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `backup-orcamentos-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    alert('✅ Backup criado com sucesso!')
  }

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string)
        
        if (importedData.budgets && importedData.historicalData) {
          if (confirm('⚠️ Importar dados irá SUBSTITUIR todos os dados atuais.\n\nDeseja continuar?')) {
            setBudgets(importedData.budgets)
            setHistoricalData(importedData.historicalData)
            alert(`✅ Dados importados com sucesso!\n\n📊 ${importedData.budgets.length} orçamentos ativos\n📈 ${importedData.historicalData.length} registros históricos`)
            window.location.reload()
          }
        } else {
          alert('❌ Arquivo de backup inválido')
        }
      } catch (error) {
        console.error('Erro ao importar backup:', error)
        alert('❌ Erro ao importar arquivo. Verifique se é um backup válido.')
      }
    }
    
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleResetToSample = () => {
    const sampleData: Budget[] = [
      {
        id: "sample-1",
        data: "2024-01-08",
        sequencia: "ORC001",
        cliente: "Empresa ABC Ltda",
        valor: 15000,
        status: "aguardando",
        observacoes: "",
        followUpDay: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "sample-2",
        data: "2024-01-07",
        sequencia: "ORC002",
        cliente: "Comércio XYZ",
        valor: 8500,
        status: "negociando",
        observacoes: "Cliente interessado, aguardando aprovação da diretoria",
        followUpDay: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "sample-3",
        data: "2024-01-06",
        sequencia: "ORC003",
        cliente: "Indústria 123",
        valor: 25000,
        status: "fechado",
        observacoes: "Contrato assinado",
        followUpDay: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    setBudgets(sampleData.filter(b => b.status !== "fechado" && b.status !== "perdido"))
    setHistoricalData(sampleData)
    alert('✅ Dados de exemplo carregados com sucesso!')
    window.location.reload()
  }

  const stats = {
    totalBudgets: budgets.length,
    totalHistorical: historicalData.length,
    totalValue: budgets.reduce((sum, b) => sum + b.valor, 0),
    closedBudgets: historicalData.filter(b => b.status === "fechado").length
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Gerenciamento de Dados
        </CardTitle>
        <CardDescription>
          Gerencie, faça backup ou limpe seus dados de orçamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Atuais */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalBudgets}</p>
            <p className="text-sm text-gray-600">Orçamentos Ativos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.totalHistorical}</p>
            <p className="text-sm text-gray-600">Total Histórico</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">R$ {stats.totalValue.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Valor Pipeline</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.closedBudgets}</p>
            <p className="text-sm text-gray-600">Fechados</p>
          </div>
        </div>

        {/* Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Backup e Restauração */}
          <div className="space-y-2">
            <h4 className="font-medium">Backup e Restauração</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportData}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Backup
              </Button>
              <div className="flex-1">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                  id="import-backup"
                />
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('import-backup')?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Backup
                </Button>
              </div>
            </div>
          </div>

          {/* Reset e Limpeza */}
          <div className="space-y-2">
            <h4 className="font-medium">Reset e Limpeza</h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleResetToSample}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Dados Exemplo
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      Confirmar Limpeza de Dados
                    </DialogTitle>
                    <DialogDescription>
                      Esta ação irá remover permanentemente todos os dados:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>⚠️ ATENÇÃO: Esta ação não pode ser desfeita!</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>{stats.totalBudgets} orçamentos ativos serão removidos</li>
                          <li>{stats.totalHistorical} registros históricos serão perdidos</li>
                          <li>Todas as estatísticas serão zeradas</li>
                          <li>R$ {stats.totalValue.toLocaleString()} em pipeline será limpo</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearAllData}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Confirmar Limpeza
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Dicas */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>💡 Dicas:</strong>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li><strong>Backup:</strong> Sempre faça backup antes de limpar os dados</li>
              <li><strong>Dados Exemplo:</strong> Use para testar funcionalidades</li>
              <li><strong>Importar:</strong> Restaure backups anteriores quando necessário</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
