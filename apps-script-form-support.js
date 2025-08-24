function doPost(e) {
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    // --- FIM DA SUBSTITUIÇÃO ---

    var sheetName = "Historico"

    console.log("=== INICIANDO doPost ===")
    console.log("Sheet ID:", sheetId)

    var data

    // Suporte para AMBOS os métodos: JSON direto E form submission
    if (e.postData && e.postData.contents) {
      // Método 1: JSON direto (fetch)
      console.log("📡 Recebido via JSON direto")
      try {
        data = JSON.parse(e.postData.contents)
        console.log("✅ JSON parseado:", Object.keys(data))
      } catch (parseError) {
        console.log("❌ Erro no parse JSON:", parseError.message)
        throw new Error("Erro ao fazer parse dos dados JSON: " + parseError.message)
      }
    } else if (e.parameter && e.parameter.json_data) {
      // Método 2: Form submission com JSON no campo hidden
      console.log("📋 Recebido via form submission")
      try {
        data = JSON.parse(e.parameter.json_data)
        console.log("✅ Form data parseado:", Object.keys(data))
      } catch (parseError) {
        console.log("❌ Erro no parse form JSON:", parseError.message)
        throw new Error("Erro ao fazer parse dos dados do form: " + parseError.message)
      }
    } else {
      console.log("❌ Nenhum dado recebido")
      throw new Error("Nenhum dado recebido no POST request")
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
      method: e.postData ? "json" : "form",
      data: {
        sequencia: data.sequencia_orcamento,
        status: data.status,
        vendedor: data.nome_vendedor,
      },
    }

    console.log("✅ Resposta de sucesso:", response)

    // Para form submission, retornar HTML simples
    if (e.parameter && e.parameter.json_data) {
      return HtmlService.createHtmlOutput(`
        <html>
          <head><title>Follow-up Salvo</title></head>
          <body>
            <h2>✅ Follow-up Salvo com Sucesso!</h2>
            <p><strong>Sequência:</strong> ${data.sequencia_orcamento}</p>
            <p><strong>Status:</strong> ${data.status}</p>
            <p><strong>Vendedor:</strong> ${data.nome_vendedor}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            <hr>
            <p><em>Esta janela pode ser fechada.</em></p>
            <script>
              // Fechar automaticamente após 3 segundos
              setTimeout(function() {
                window.close();
              }, 3000);
            </script>
          </body>
        </html>
      `)
    }

    // Para JSON, retornar JSON
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    console.error("❌ ERRO GERAL:", error.message)
    console.error("Stack trace:", error.stack)

    // Resposta de erro
    var errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }

    console.log("❌ Resposta de erro:", errorResponse)

    // Para form submission, retornar HTML de erro
    if (e.parameter && e.parameter.json_data) {
      return HtmlService.createHtmlOutput(`
        <html>
          <head><title>Erro no Follow-up</title></head>
          <body>
            <h2>❌ Erro ao Salvar Follow-up</h2>
            <p><strong>Erro:</strong> ${error.message}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            <hr>
            <p><em>Esta janela pode ser fechada. Tente novamente.</em></p>
            <script>
              setTimeout(function() {
                window.close();
              }, 5000);
            </script>
          </body>
        </html>
      `)
    }

    return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON)
  }
}

// Função para testar manualmente
function testarManualmente() {
  console.log("=== INICIANDO TESTE MANUAL ===")

  try {
    var sheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
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
      "Teste manual - FORM SUPPORT - pode excluir",
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

// Função GET para debug
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      success: true,
      message: "Apps Script está funcionando! ✅ (com suporte a form submission)",
      timestamp: new Date().toISOString(),
      info: "Este script suporta tanto JSON direto quanto form submission para contornar problemas de CORS.",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}
