// Execute este código no Google Apps Script para criar uma planilha modelo

function criarPlanilhaModelo() {
  try {
    console.log("=== CRIANDO PLANILHA MODELO ===")

    // Criar nova planilha
    var ss = SpreadsheetApp.create("Sistema de Orçamentos - Follow-up")
    var spreadsheetId = ss.getId()
    var url = ss.getUrl()

    console.log("✅ Planilha criada!")
    console.log("📋 ID:", spreadsheetId)
    console.log("🔗 URL:", url)

    // Remover aba padrão
    var defaultSheet = ss.getSheetByName("Sheet1")
    if (defaultSheet) {
      ss.deleteSheet(defaultSheet)
    }

    // 1. Criar aba "Vendedor"
    var vendedorSheet = ss.insertSheet("Vendedor")
    vendedorSheet.getRange("A1:C1").setValues([["codigo_vendedor", "nome_vendedor", "senha"]])
    vendedorSheet.getRange("A2:C3").setValues([
      ["1", "Admin", "admin123"],
      ["88", "João Silva", "senha123"],
    ])

    // 2. Criar aba "Orçamentos"
    var orcamentosSheet = ss.insertSheet("Orçamentos")
    orcamentosSheet
      .getRange("A1:F1")
      .setValues([["data", "sequencia", "cliente", "valor", "codigo_vendedor", "nome_vendedor"]])
    orcamentosSheet.getRange("A2:F4").setValues([
      ["2024-01-08", "ORC001", "Empresa ABC Ltda", 15000, "88", "João Silva"],
      ["2024-01-07", "ORC002", "Comércio XYZ", 8500, "88", "João Silva"],
      ["2024-01-06", "ORC003", "Indústria 123", 25000, "1", "Admin"],
    ])

    // 3. Criar aba "Historico"
    var historicoSheet = ss.insertSheet("Historico")
    historicoSheet
      .getRange("A1:J1")
      .setValues([
        [
          "sequencia_orcamento",
          "data_hora_followup",
          "status",
          "observacoes",
          "codigo_vendedor",
          "nome_vendedor",
          "tipo_acao",
          "data_orcamento",
          "dias_followup",
          "valor_orcamento",
        ],
      ])

    // Formatação básica
    var sheets = [vendedorSheet, orcamentosSheet, historicoSheet]
    sheets.forEach((sheet) => {
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight("bold")
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setBackground("#4285f4")
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontColor("white")
      sheet.autoResizeColumns(1, sheet.getLastColumn())
    })

    console.log("✅ Abas criadas e formatadas!")

    // Tornar a planilha pública
    var driveApp = DriveApp // Declare DriveApp variable
    driveApp.getFileById(spreadsheetId).setSharing(driveApp.Access.ANYONE_WITH_LINK, driveApp.Permission.VIEW)
    console.log("✅ Planilha configurada como pública!")

    console.log("=== PLANILHA MODELO CRIADA COM SUCESSO! ===")
    console.log("🎯 Use este ID no sistema:", spreadsheetId)
    console.log("🔗 URL da planilha:", url)

    return {
      id: spreadsheetId,
      url: url,
      success: true,
    }
  } catch (error) {
    console.error("❌ Erro ao criar planilha:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
