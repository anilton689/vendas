function doPost(e) {
  try {
    console.log("📥 Apps Script - Recebendo dados:", e.postData.contents)

    const data = JSON.parse(e.postData.contents)
    const jsonData = JSON.parse(data.json_data)

    console.log("📋 Dados parseados:", jsonData)

    // Verificar se é uma atualização de configuração da IA
    if (jsonData.action === "updateConfigIA") {
      return updateConfigIA(jsonData.data)
    }

    // Caso contrário, processar como follow-up normal
    return processFollowup(jsonData)
  } catch (error) {
    console.error("❌ Erro no Apps Script:", error)
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function updateConfigIA(configData) {
  try {
    console.log("🔧 Atualizando configuração da IA:", configData)

    const ss = SpreadsheetApp.getActiveSpreadsheet()
    let configSheet = ss.getSheetByName("ConfigIA")

    // Criar aba ConfigIA se não existir
    if (!configSheet) {
      console.log("📊 Criando aba ConfigIA...")
      configSheet = ss.insertSheet("ConfigIA")

      // Adicionar cabeçalhos
      configSheet.getRange("A1").setValue("Tipo")
      configSheet.getRange("B1").setValue("Valor")

      // Adicionar configurações padrão
      const defaultConfig = [
        ["systemPrompt", "Você é um assistente especializado em vendas e follow-up de orçamentos."],
        ["followupPrompt", "Analise este orçamento e forneça sugestões específicas..."],
        ["analysisPrompt", "Analise este orçamento e forneça: 1) Probabilidade..."],
        ["model", "gpt-4o-mini"],
        ["temperature", "0.7"],
        ["maxTokens", "1000"],
      ]

      for (let i = 0; i < defaultConfig.length; i++) {
        configSheet.getRange(i + 2, 1).setValue(defaultConfig[i][0])
        configSheet.getRange(i + 2, 2).setValue(defaultConfig[i][1])
      }
    }

    // Atualizar configurações
    const configTypes = ["systemPrompt", "followupPrompt", "analysisPrompt", "model", "temperature", "maxTokens"]

    for (const configType of configTypes) {
      if (configData[configType] !== undefined) {
        updateConfigValue(configSheet, configType, configData[configType])
      }
    }

    console.log("✅ Configuração da IA atualizada com sucesso")

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Configuração da IA atualizada com sucesso",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    console.error("❌ Erro ao atualizar configuração da IA:", error)
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function updateConfigValue(sheet, configType, value) {
  try {
    const data = sheet.getDataRange().getValues()

    // Procurar linha existente
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === configType) {
        sheet.getRange(i + 1, 2).setValue(value)
        console.log(`✅ Atualizado ${configType}: ${value.substring(0, 50)}...`)
        return
      }
    }

    // Se não encontrou, adicionar nova linha
    const newRow = data.length + 1
    sheet.getRange(newRow, 1).setValue(configType)
    sheet.getRange(newRow, 2).setValue(value)
    console.log(`➕ Adicionado ${configType}: ${value.substring(0, 50)}...`)
  } catch (error) {
    console.error(`❌ Erro ao atualizar ${configType}:`, error)
  }
}

function processFollowup(data) {
  // Função existente para processar follow-ups
  // (manter código existente do Apps Script)
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet()
    const historicoSheet = ss.getSheetByName("Historico")

    if (!historicoSheet) {
      throw new Error("Aba Historico não encontrada")
    }

    // Adicionar dados do follow-up
    const novaLinha = [
      data.sequencia_orcamento || "",
      data.data_hora_followup || new Date().toISOString(),
      data.status || "aguardando_analise",
      data.observacoes || "",
      data.codigo_vendedor || "",
      data.nome_vendedor || "",
      data.tipo_acao || "followup",
      data.data_orcamento || "",
      data.dias_followup || "",
      data.valor_orcamento || 0,
    ]

    historicoSheet.appendRow(novaLinha)

    console.log("✅ Follow-up adicionado com sucesso")

    return ContentService.createTextOutput(
      JSON.stringify({
        success: true,
        message: "Follow-up adicionado com sucesso",
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  } catch (error) {
    console.error("❌ Erro ao processar follow-up:", error)
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON)
  }
}

function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({
      status: "OK",
      message: "Apps Script funcionando - suporte a ConfigIA ativo",
      timestamp: new Date().toISOString(),
    }),
  ).setMimeType(ContentService.MimeType.JSON)
}

// Declare variables before using them
var ContentService = google.script.runtime.ContentService
var SpreadsheetApp = google.script.runtime.SpreadsheetApp
var google = window.google // Declare the google variable
