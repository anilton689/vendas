import * as XLSX from 'xlsx'

// Dados de exemplo para a planilha
const sampleData = [
  {
    data: '2024-01-08',
    sequencia: 'ORC001',
    cliente: 'Empresa ABC Ltda',
    valor: 15000
  },
  {
    data: '2024-01-07',
    sequencia: 'ORC002',
    cliente: 'Comércio XYZ',
    valor: 8500
  },
  {
    data: '2024-01-06',
    sequencia: 'ORC003',
    cliente: 'Indústria 123 S.A.',
    valor: 25000
  },
  {
    data: '2024-01-05',
    sequencia: 'ORC004',
    cliente: 'Serviços DEF',
    valor: 12000
  },
  {
    data: '2024-01-04',
    sequencia: 'ORC005',
    cliente: 'Tecnologia GHI',
    valor: 18500
  },
  {
    data: '2024-01-03',
    sequencia: 'ORC006',
    cliente: 'Consultoria JKL',
    valor: 9800
  },
  {
    data: '2024-01-02',
    sequencia: 'ORC007',
    cliente: 'Distribuidora MNO',
    valor: 22000
  },
  {
    data: '2024-01-01',
    sequencia: 'ORC008',
    cliente: 'Atacado PQR',
    valor: 16500
  }
]

// Criar workbook e worksheet
const wb = XLSX.utils.book_new()
const ws = XLSX.utils.json_to_sheet(sampleData)

// Adicionar worksheet ao workbook
XLSX.utils.book_append_sheet(wb, ws, 'Orçamentos')

// Gerar arquivo Excel
const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

console.log('✅ Planilha de exemplo gerada com sucesso!')
console.log('📊 Dados incluídos:')
sampleData.forEach((item, index) => {
  console.log(`${index + 1}. ${item.cliente} - R$ ${item.valor.toLocaleString()} (${item.sequencia})`)
})

// Salvar arquivo (em um ambiente real, isso seria feito no servidor)
// const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
// const url = URL.createObjectURL(blob)
// const link = document.createElement('a')
// link.href = url
// link.download = 'modelo-orcamentos.xlsx'
// link.click()
