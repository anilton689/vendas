function doPost(e) {
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    // --- FIM DA SUBSTITUIÇÃO ---

    var sheetName = "Historico"

    console.log("=== INICIANDO doPost ===")
    console.log("Sheet ID:", sheetId)
    console.log("Request method:", e ? e.parameter : "undefined")

    // Verificar se há dados no POST
    if (!e || !e.postData || !e.postData.contents) {
      console.log("❌ Nenhum dado POST recebido")
      throw new Error("Nenhum dado recebido no POST request")
    }

    console.log("✅ Dados POST recebidos, tamanho:", e.postData.contents.length)

    // Parse dos dados JSON
    var data
    try {
      data = JSON.parse(e.postData.contents)
      console.log("✅ JSON parseado com sucesso:", Object.keys(data))
    } catch (parseError) {
      console.log("❌ Erro no parse JSON:", parseError.message)
      throw new Error("Erro ao fazer parse dos dados JSON: " + parseError.message)
    }

    // Abrir a planilha
    var ss
    try {
      ss = SpreadsheetApp.openById(sheetId)
      console.log("✅ Planilha aberta com sucesso")
    } catch (openError) {
      console.log("❌ Erro ao abrir planilha:", openError.message)
      throw new Error("Erro ao abrir a planilha: " + openError.message)
    }

    // Encontrar a aba
    var sheet = ss.getSheetByName(sheetName)
    if (!sheet) {
      var availableSheets = ss.getSheets().map((s) => s.getName())
      console.log("❌ Aba não encontrada. Disponíveis:", availableSheets)
      throw new Error('Aba "' + sheetName + '" não encontrada. Abas disponíveis: ' + availableSheets.join(", "))
    }

    console.log("✅ Aba encontrada:", sheetName)

    // Preparar dados com valores padrão
    var newRow = [
      data.sequencia_orcamento || "",
      data.data_hora_followup || new Date().toISOString(),
      data.status || "desconhecido",
      data.observacoes || "",
      data.codigo_vendedor || "",
      data.nome_vendedor || "",
      data.tipo_acao || "followup",
      data.data_orcamento || "",
      data.dias_followup || "",
      data.valor_orcamento || 0,
    ]

    console.log("📝 Adicionando linha:", newRow)

    // Adicionar linha à planilha
    try {
      sheet.appendRow(newRow)
      console.log("✅ Linha adicionada com sucesso!")
    } catch (appendError) {
      console.log("❌ Erro ao adicionar linha:", appendError.message)
      throw new Error("Erro ao adicionar linha: " + appendError.message)
    }

    // Resposta de sucesso
    var response = {
      success: true,
      message: "Follow-up salvo com sucesso!",
      timestamp: new Date().toISOString(),
      data: {
        sequencia: data.sequencia_orcamento,
        status: data.status,
        vendedor: data.nome_vendedor,
      },
    }

    console.log("✅ Resposta de sucesso:", response)

    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    console.error("❌ ERRO GERAL:", error.message)
    console.error("Stack trace:", error.stack)

    // Resposta de erro detalhada
    var errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        hasPostData: !!(e && e.postData && e.postData.contents),
        postDataLength: e && e.postData && e.postData.contents ? e.postData.contents.length : 0,
        sheetId: "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds",
      },
    }

    console.log("❌ Resposta de erro:", errorResponse)

    return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON)
  }
}

// Função para testar manualmente (EXECUTE ESTA FUNÇÃO PARA TESTAR)
function testarManualmente() {
  console.log("=== INICIANDO TESTE MANUAL ===")

  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    // --- FIM DA SUBSTITUIÇÃO ---

    var sheetName = "Historico"
    var ss = SpreadsheetApp.openById(sheetId)
    var sheet = ss.getSheetByName(sheetName)

    if (!sheet) {
      var availableSheets = ss.getSheets().map((s) => s.getName())
      console.error('❌ Aba "' + sheetName + '" não encontrada')
      console.log("Abas disponíveis:", availableSheets)
      return
    }

    var testRow = [
      "TESTE-MANUAL-" + new Date().getTime(),
      new Date().toISOString(),
      "aguardando",
      "Teste manual - FUNCIONANDO - pode excluir",
      "1",
      "Admin",
      "teste",
      new Date().toISOString().slice(0, 10),
      "A agendar",
      0,
    ]

    sheet.appendRow(testRow)
    console.log("✅ TESTE MANUAL CONCLUÍDO COM SUCESSO!")
    console.log('Verifique a aba "Historico" da sua planilha.')
  } catch (error) {
    console.error("❌ Erro no teste manual:", error.message)
  }
}

// Função GET para debug (permite testar no navegador)
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: "Apps Script está funcionando! ✅",
      timestamp: new Date().toISOString(),
      info: "Este script está configurado para receber dados via POST. Use o sistema para enviar follow-ups.",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

// Declare SpreadsheetApp and ContentService before using them
var SpreadsheetApp
var ContentService
