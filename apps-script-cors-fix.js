function doPost(e) {
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = '1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds';
    // --- FIM DA SUBSTITUIÇÃO ---
    
    var sheetName = 'Historico';
    
    console.log('Iniciando processamento do POST request');
    
    // Verificar se há dados no POST
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Nenhum dado recebido no POST request');
    }
    
    // Parse dos dados JSON
    var data = JSON.parse(e.postData.contents);
    console.log('Dados recebidos:', data);
    
    // Abrir a planilha
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      var availableSheets = ss.getSheets().map(function(s) { return s.getName(); });
      throw new Error('Aba "' + sheetName + '" não encontrada. Abas disponíveis: ' + availableSheets.join(', '));
    }
    
    // Preparar dados
    var newRow = [
      data.sequencia_orcamento || '',
      data.data_hora_followup || new Date().toISOString(),
      data.status || 'desconhecido',
      data.observacoes || '',
      data.codigo_vendedor || '',
      data.nome_vendedor || '',
      data.tipo_acao || 'followup',
      data.data_orcamento || '',
      data.dias_followup || '',
      data.valor_orcamento || 0
    ];
    
    console.log('Adicionando linha:', newRow);
    sheet.appendRow(newRow);
    console.log('Linha adicionada com sucesso');
    
    // Resposta de sucesso com headers CORS
    var response = {
      success: true,
      message: 'Dados gravados com sucesso',
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Erro no doPost:', error);
    
    var errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Função para testar manualmente
function testarManualmente() {
  console.log('=== INICIANDO TESTE MANUAL ===');
  
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = '1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds';
    // --- FIM DA SUBSTITUIÇÃO ---
    
    var sheetName = 'Historico';
    var ss = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) {
      var availableSheets = ss.getSheets().map(function(s) { return s.getName(); });
      console.error('❌ Aba "' + sheetName + '" não encontrada');
      console.log('Abas disponíveis:', availableSheets);
      return;
    }
    
    var testRow = [
      'TESTE-MANUAL-' + new Date().getTime(),
      new Date().toISOString(),
      'aguardando',
      'Teste manual - pode excluir',
      '1',
      'Admin',
      'teste',
      new Date().toISOString().slice(0, 10),
      'A agendar',
      0
    ];
    
    sheet.appendRow(testRow);
    console.log('✅ Teste manual concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro no teste manual:', error.message);
  }
}

// Função para testar via HTTP (simula uma chamada real)
function testarViaHTTP() {
  console.log('=== TESTE VIA HTTP SIMULADO ===');
  
  var mockEvent = {
    postData: {
      contents: JSON.stringify({
        sequencia_orcamento: 'TESTE-HTTP-' + new Date().getTime(),
        data_hora_followup: new Date().toISOString(),
        status: 'aguardando',
        observacoes: 'Teste via HTTP simulado - pode excluir',
        codigo_vendedor: '1',
        nome_vendedor: 'Admin',
        tipo_acao: 'teste',
        data_orcamento: new Date().toISOString().slice(0, 10),
        dias_followup: 'A agendar',
        valor_orcamento: 0
      })
    }
  };
  
  try {
    var result = doPost(mockEvent);
    var content = result.getContent();
    var response = JSON.parse(content);
    
    if (response.success) {
      console.log('✅ Teste HTTP simulado bem-sucedido!');
      console.log('Resposta:', response);
    } else {
      console.error('❌ Teste HTTP simulado falhou:', response.error);
    }
    
  } catch (error) {
    console.error('❌ Erro no teste HTTP:', error.message);
  }
}
