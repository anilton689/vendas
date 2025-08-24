// === APPS SCRIPT PARA PLANILHA DE ORÇAMENTOS ===
// ID da Planilha: 1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds
// Abas: Orçamentos, Historico, Vendedor

function doPost(e) {
  try {
    console.log("=== INICIANDO doPost ===")

    // ID da sua planilha
    const SHEET_ID = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"

    // Processar dados recebidos
    let data
    if (e.parameter && e.parameter.json_data) {
      // Form submission
      console.log("📋 Recebido via form submission")
      data = JSON.parse(e.parameter.json_data)
    } else if (e.postData && e.postData.contents) {
      // JSON direto
      console.log("📡 Recebido via JSON")
      data = JSON.parse(e.postData.contents)
    } else {
      throw new Error("Nenhum dado recebido")
    }

    console.log("📦 Dados recebidos:", Object.keys(data))

    // Abrir planilha
    const ss = SpreadsheetApp.openById(SHEET_ID)
    const historicoSheet = ss.getSheetByName("Historico")

    if (!historicoSheet) {
      const availableSheets = ss.getSheets().map((s) => s.getName())
      throw new Error(`Aba "Historico" não encontrada. Disponíveis: ${availableSheets.join(", ")}`)
    }

    // Preparar linha para inserir no histórico
    const newRow = [
      data.sequencia_orcamento || "", // A - Sequência Orçamento
      data.data_hora_followup || new Date().toISOString(), // B - Data/Hora Follow-up
      data.status || "aguardando_analise", // C - Status
      data.observacoes || "", // D - Observações
      data.codigo_vendedor || "", // E - Código Vendedor
      data.nome_vendedor || "", // F - Nome Vendedor
      data.tipo_acao || "followup", // G - Tipo Ação
      data.data_orcamento || "", // H - Data Orçamento
      data.dias_followup || "", // I - Dias Follow-up
      data.valor_orcamento || 0, // J - Valor Orçamento
    ]

    console.log("📝 Inserindo linha:", newRow)

    // Inserir linha
    historicoSheet.appendRow(newRow)

    console.log("✅ Follow-up salvo com sucesso!")

    // Resposta de sucesso
    const response = {
      success: true,
      message: "Follow-up registrado com sucesso!",
      timestamp: new Date().toISOString(),
      data: {
        sequencia: data.sequencia_orcamento,
        status: data.status,
        vendedor: data.nome_vendedor,
      },
    }

    // Para form submission, retornar HTML
    if (e.parameter && e.parameter.json_data) {
      return HtmlService.createHtmlOutput(`
        <html>
          <head>
            <title>Follow-up Salvo</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                text-align: center;
                background: #f0f9ff;
              }
              .success { 
                color: #059669; 
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
              .info { 
                background: #f8fafc; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 15px 0;
                border-left: 4px solid #059669;
              }
            </style>
          </head>
          <body>
            <div class="success">
              <h2>✅ Follow-up Salvo!</h2>
              <div class="info">
                <p><strong>Sequência:</strong> ${data.sequencia_orcamento}</p>
                <p><strong>Status:</strong> ${data.status}</p>
                <p><strong>Vendedor:</strong> ${data.nome_vendedor}</p>
                <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
              </div>
              <p><em>Janela será fechada em 3 segundos...</em></p>
            </div>
            <script>
              console.log('✅ Follow-up salvo:', ${JSON.stringify(response)});
              setTimeout(() => window.close(), 3000);
            </script>
          </body>
        </html>
      `)
    }

    // Para JSON, retornar JSON
    return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    console.error("❌ ERRO:", error.message)

    const errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    }

    // Para form submission, retornar HTML de erro
    if (e && e.parameter && e.parameter.json_data) {
      return HtmlService.createHtmlOutput(`
        <html>
          <head>
            <title>Erro no Follow-up</title>
            <meta charset="UTF-8">
            <style>
              body { 
                font-family: Arial, sans-serif; 
                padding: 20px; 
                text-align: center;
                background: #fef2f2;
              }
              .error { 
                color: #dc2626;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 400px;
                margin: 0 auto;
              }
            </style>
          </head>
          <body>
            <div class="error">
              <h2>❌ Erro ao Salvar</h2>
              <p><strong>Erro:</strong> ${error.message}</p>
              <p><strong>Data:</strong> ${new Date().toLocaleString("pt-BR")}</p>
              <p><em>Janela será fechada em 5 segundos...</em></p>
            </div>
            <script>
              console.error('❌ Erro:', ${JSON.stringify(errorResponse)});
              setTimeout(() => window.close(), 5000);
            </script>
          </body>
        </html>
      `)
    }

    return ContentService.createTextOutput(JSON.stringify(errorResponse)).setMimeType(ContentService.MimeType.JSON)
  }
}

// Função GET para testar se o script está funcionando
function doGet(e) {
  const response = {
    success: true,
    message: "Apps Script funcionando! ✅",
    timestamp: new Date().toISOString(),
    version: "v71-funcional",
    planilha_id: "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds",
    abas_esperadas: ["Orçamentos", "Historico", "Vendedor"],
  }

  return ContentService.createTextOutput(JSON.stringify(response, null, 2)).setMimeType(ContentService.MimeType.JSON)
}

// Função para testar manualmente a inserção
function testarInsercaoManual() {
  console.log("=== TESTE MANUAL DE INSERÇÃO ===")

  try {
    const SHEET_ID = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    const ss = SpreadsheetApp.openById(SHEET_ID)
    const historicoSheet = ss.getSheetByName("Historico")

    if (!historicoSheet) {
      const availableSheets = ss.getSheets().map((s) => s.getName())
      console.error(`❌ Aba "Historico" não encontrada. Disponíveis: ${availableSheets.join(", ")}`)
      return
    }

    // Dados de teste
    const testRow = [
      "TESTE-" + new Date().getTime(), // Sequência
      new Date().toISOString(), // Data/Hora
      "teste", // Status
      "Teste manual do Apps Script - pode excluir", // Observações
      "ADMIN", // Código Vendedor
      "Administrador", // Nome Vendedor
      "teste", // Tipo Ação
      new Date().toISOString().split("T")[0], // Data Orçamento
      "Teste", // Dias Follow-up
      1000, // Valor
    ]

    historicoSheet.appendRow(testRow)

    console.log("✅ TESTE CONCLUÍDO COM SUCESSO!")
    console.log("Verifique a aba 'Historico' da planilha")
    console.log("Linha inserida:", testRow)
  } catch (error) {
    console.error("❌ Erro no teste:", error.message)
  }
}

// Função para listar informações da planilha
function inspecionarPlanilha() {
  console.log("=== INSPEÇÃO DA PLANILHA ===")

  try {
    const SHEET_ID = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    const ss = SpreadsheetApp.openById(SHEET_ID)

    console.log("📊 Nome da planilha:", ss.getName())

    const sheets = ss.getSheets()
    console.log("📋 Abas encontradas:")

    sheets.forEach((sheet, index) => {
      const name = sheet.getName()
      const lastRow = sheet.getLastRow()
      const lastCol = sheet.getLastColumn()

      console.log(`  ${index + 1}. "${name}" - ${lastRow} linhas, ${lastCol} colunas`)

      // Se for uma das abas principais, mostrar cabeçalhos
      if (["Orçamentos", "Historico", "Vendedor"].includes(name) && lastRow > 0) {
        try {
          const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0]
          console.log(`     Cabeçalhos: ${headers.join(" | ")}`)
        } catch (e) {
          console.log(`     Erro ao ler cabeçalhos: ${e.message}`)
        }
      }
    })

    console.log("✅ Inspeção concluída!")
  } catch (error) {
    console.error("❌ Erro na inspeção:", error.message)
  }
}

// Função para testar leitura de dados
function testarLeituraDados() {
  console.log("=== TESTE DE LEITURA DE DADOS ===")

  try {
    const SHEET_ID = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds"
    const ss = SpreadsheetApp.openById(SHEET_ID)

    // Testar aba Orçamentos
    const orcamentosSheet = ss.getSheetByName("Orçamentos")
    if (orcamentosSheet) {
      const orcamentosData = orcamentosSheet.getDataRange().getValues()
      console.log("📊 Orçamentos - Total de linhas:", orcamentosData.length)
      if (orcamentosData.length > 0) {
        console.log("   Cabeçalhos:", orcamentosData[0])
        if (orcamentosData.length > 1) {
          console.log("   Primeira linha de dados:", orcamentosData[1])
        }
      }
    }

    // Testar aba Vendedor
    const vendedorSheet = ss.getSheetByName("Vendedor")
    if (vendedorSheet) {
      const vendedorData = vendedorSheet.getDataRange().getValues()
      console.log("👤 Vendedores - Total de linhas:", vendedorData.length)
      if (vendedorData.length > 0) {
        console.log("   Cabeçalhos:", vendedorData[0])
        if (vendedorData.length > 1) {
          console.log("   Primeiro vendedor:", vendedorData[1])
        }
      }
    }

    // Testar aba Historico
    const historicoSheet = ss.getSheetByName("Historico")
    if (historicoSheet) {
      const historicoData = historicoSheet.getDataRange().getValues()
      console.log("📈 Histórico - Total de linhas:", historicoData.length)
      if (historicoData.length > 0) {
        console.log("   Cabeçalhos:", historicoData[0])
      }
    }

    console.log("✅ Teste de leitura concluído!")
  } catch (error) {
    console.error("❌ Erro na leitura:", error.message)
  }
}
