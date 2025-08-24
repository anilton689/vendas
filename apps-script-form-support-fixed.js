function doPost(e) {
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    // --- FIM DA SUBSTITUIÇÃO ---

    var sheetName = "Historico"

    console.log("=== INICIANDO doPost ===")
    console.log("Sheet ID:", sheetId)
    console.log("Request method:", e ? e.parameter : "undefined") // Log para debug

    var data

    // Priorizar e.parameter.json_data para form submissions
    if (e.parameter && e.parameter.json_data) {
      console.log("📋 Recebido via form submission (e.parameter.json_data)")
      console.log("📦 Campo json_data:", e.parameter.json_data)
      try {
        data = JSON.parse(e.parameter.json_data)
        console.log("✅ Form data parseado:", Object.keys(data))
      } catch (parseError) {
        console.log("❌ Erro no parse de e.parameter.json_data:", parseError.message)
        throw new Error("Erro ao fazer parse dos dados do form (e.parameter): " + parseError.message)
      }
    } else if (e.postData && e.postData.contents) {
      // Se não for e.parameter.json_data, verificar o tipo de conteúdo do postData
      if (e.postData.type === "application/json") {
        console.log("📡 Recebido via JSON direto (Content-Type: application/json)")
        try {
          data = JSON.parse(e.postData.contents)
          console.log("✅ JSON parseado:", Object.keys(data))
        } catch (parseError) {
          console.log("❌ Erro no parse JSON direto:", parseError.message)
          throw new Error("Erro ao fazer parse dos dados JSON: " + parseError.message)
        }
      } else if (e.postData.type === "application/x-www-form-urlencoded") {
        console.log("📋 Recebido via form submission (Content-Type: application/x-www-form-urlencoded)")
        console.log("📦 Raw postData.contents:", e.postData.contents)

        // Tentar parsear manualmente o 'json_data' do raw postData.contents
        const params = e.postData.contents.split("&")
        let jsonDataString = null
        for (const param of params) {
          const [key, value] = param.split("=")
          if (decodeURIComponent(key) === "json_data") {
            jsonDataString = decodeURIComponent(value)
            break
          }
        }
        if (jsonDataString) {
          try {
            data = JSON.parse(jsonDataString)
            console.log("✅ Dados parseados manualmente de postData.contents:", Object.keys(data))
          } catch (parseError) {
            console.log("❌ Erro no parse manual de postData.contents:", parseError.message)
            throw new Error("Erro ao fazer parse dos dados do form (manual): " + parseError.message)
          }
        } else {
          console.log("❌ Campo 'json_data' não encontrado em postData.contents.")
          throw new Error("Nenhum dado 'json_data' encontrado no POST request.")
        }
      } else {
        console.log("❌ Content-Type desconhecido:", e.postData.type)
        throw new Error("Nenhum dado POST válido recebido ou Content-Type não suportado.")
      }
    } else {
      console.log("❌ Nenhum dado recebido no POST request.")
      console.log("📊 Debug - e.parameter:", e.parameter)
      console.log("📊 Debug - e.postData:", e.postData)
      throw new Error("Nenhum dado recebido no POST request.")
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
      method: e.parameter && e.parameter.json_data ? "form" : "json",
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
          <head>
            <title>Follow-up Salvo</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .success { color: #28a745; }
              .info { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }
            </style>
          </head>
          <body>
            <h2 class="success">✅ Follow-up Salvo com Sucesso!</h2>
            <div class="info">
              <p><strong>Sequência:</strong> ${data.sequencia_orcamento}</p>
              <p><strong>Status:</strong> ${data.status}</p>
              <p><strong>Vendedor:</strong> ${data.nome_vendedor}</p>
              <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            </div>
            <hr>
            <p><em>Esta janela será fechada automaticamente em 3 segundos.</em></p>
            <script>
              console.log('✅ Follow-up salvo:', ${JSON.stringify(response)});
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
      debug: {
        hasParameter: !!(e && e.parameter),
        hasPostData: !!(e && e.postData),
        parameterKeys: e && e.parameter ? Object.keys(e.parameter) : [],
        postDataLength: e && e.postData && e.postData.contents ? e.postData.contents.length : 0,
        postDataType: e && e.postData ? e.postData.type : "N/A",
      },
    }

    console.log("❌ Resposta de erro:", errorResponse)

    // Para form submission, retornar HTML de erro
    if (e && e.parameter && e.parameter.json_data) {
      return HtmlService.createHtmlOutput(`
        <html>
          <head>
            <title>Erro no Follow-up</title>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
              .error { color: #dc3545; }
              .debug { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; text-align: left; }
            </style>
          </head>
          <body>
            <h2 class="error">❌ Erro ao Salvar Follow-up</h2>
            <p><strong>Erro:</strong> ${error.message}</p>
            <p><strong>Data/Hora:</strong> ${new Date().toLocaleString("pt-BR")}</p>
            <div class="debug">
              <strong>Debug Info:</strong><br>
              <pre>${JSON.stringify(errorResponse.debug, null, 2)}</pre>
            </div>
            <hr>
            <p><em>Esta janela será fechada em 10 segundos. Tente novamente.</em></p>
            <script>
              console.error('❌ Erro no follow-up:', ${JSON.stringify(errorResponse)});
              setTimeout(function() {
                window.close();
              }, 10000);
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
      "Teste manual - CORRIGIDO - pode excluir",
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
      message: "Apps Script está funcionando! ✅ (VERSÃO CORRIGIDA)",
      timestamp: new Date().toISOString(),
      info: "Este script suporta form submission com melhor tratamento de erros.",
      version: "2.0-fixed",
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

// Declare the variables before using them
var SpreadsheetApp
var HtmlService
var ContentService
