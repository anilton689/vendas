function doPost(e) {
  // Configurar headers CORS para evitar problemas de conectividade
  var output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = '1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds';
    // --- FIM DA SUBSTITUIÇÃO ---
    
    var sheetName = 'Historico';
    
    // Log para debug
    console.log('Iniciando processamento do POST request');
    console.log('Sheet ID:', sheetId);
    
    // Verificar se há dados no POST (só quando chamado via HTTP)
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('Nenhum dado recebido no POST request. Este script deve ser chamado via HTTP POST, não executado manualmente.');
    }
    
    // Parse dos dados JSON
    var data;
    try {
      data = JSON.parse(e.postData.contents);
      console.log('Dados recebidos:', data);
    } catch (parseError) {
      throw new Error('Erro ao fazer parse dos dados JSON: ' + parseError.message);
    }
    
    // Abrir a planilha
    var ss;
    try {
      ss = SpreadsheetApp.openById(sheetId);
      console.log('Planilha aberta com sucesso');
    } catch (openError) {
      throw new Error('Erro ao abrir a planilha (ID: ' + sheetId + '): ' + openError.message);
    }
    
    // Encontrar a aba
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      // Listar abas disponíveis para debug
      var availableSheets = ss.getSheets().map(function(s) { return s.getName(); });
      throw new Error('Aba "' + sheetName + '" não encontrada. Abas disponíveis: ' + availableSheets.join(', '));
    }
    
    console.log('Aba "' + sheetName + '" encontrada');
    
    // Preparar dados com valores padrão
    var sequencia_orcamento = data.sequencia_orcamento || '';
    var data_hora_followup = data.data_hora_followup || new Date().toISOString();
    var status = data.status || 'desconhecido';
    var observacoes = data.observacoes || '';
    var codigo_vendedor = data.codigo_vendedor || '';
    var nome_vendedor = data.nome_vendedor || '';
    var tipo_acao = data.tipo_acao || 'followup';
    var data_orcamento = data.data_orcamento || '';
    var dias_followup = data.dias_followup || '';
    var valor_orcamento = data.valor_orcamento || 0;
    
    // Adicionar linha à planilha
    var newRow = [
      sequencia_orcamento,
      data_hora_followup,
      status,
      observacoes,
      codigo_vendedor,
      nome_vendedor,
      tipo_acao,
      data_orcamento,
      dias_followup,
      valor_orcamento
    ];
    
    console.log('Adicionando linha:', newRow);
    sheet.appendRow(newRow);
    console.log('Linha adicionada com sucesso');
    
    // Resposta de sucesso
    var response = {
      success: true,
      message: 'Dados gravados com sucesso na aba ' + sheetName,
      timestamp: new Date().toISOString(),
      data: {
        sequencia: sequencia_orcamento,
        status: status,
        vendedor: nome_vendedor
      }
    };
    
    output.setContent(JSON.stringify(response));
    return output;
    
  } catch (error) {
    console.error('Erro no doPost:', error);
    
    // Resposta de erro detalhada
    var errorResponse = {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        hasPostData: !!(e && e.postData && e.postData.contents),
        postDataLength: e && e.postData ? e.postData.contents.length : 0
      }
    };
    
    output.setContent(JSON.stringify(errorResponse));
    return output;
  }
}

// Função para testar manualmente (EXECUTE ESTA FUNÇÃO PARA TESTAR)
function testarManualmente() {
  console.log('=== INICIANDO TESTE MANUAL ===');
  
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA (mesmo ID da função doPost) ---
    var sheetId = '1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds';
    // --- FIM DA SUBSTITUIÇÃO ---
    
    var sheetName = 'Historico';
    
    console.log('Testando acesso à planilha...');
    console.log('Sheet ID:', sheetId);
    
    // Tentar abrir a planilha
    var ss = SpreadsheetApp.openById(sheetId);
    console.log('✅ Planilha aberta com sucesso');
    
    // Verificar se a aba existe
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      var availableSheets = ss.getSheets().map(function(s) { return s.getName(); });
      console.error('❌ Aba "' + sheetName + '" não encontrada');
      console.log('Abas disponíveis:', availableSheets);
      return;
    }
    
    console.log('✅ Aba "' + sheetName + '" encontrada');
    
    // Adicionar linha de teste
    var testRow = [
      'TESTE-MANUAL-' + new Date().getTime(),
      new Date().toISOString(),
      'aguardando',
      'Teste manual do Google Apps Script - pode excluir esta linha',
      '1',
      'Admin',
      'teste',
      new Date().toISOString().slice(0, 10),
      'A agendar',
      0
    ];
    
    console.log('Adicionando linha de teste:', testRow);
    sheet.appendRow(testRow);
    console.log('✅ Linha de teste adicionada com sucesso!');
    
    console.log('=== TESTE MANUAL CONCLUÍDO COM SUCESSO ===');
    console.log('Verifique a aba "Historico" da sua planilha para ver a linha de teste.');
    
  } catch (error) {
    console.error('❌ Erro no teste manual:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Função para listar todas as abas (útil para debug)
function listarAbas() {
  try {
    // --- SUBSTITUA PELO ID DA SUA PLANILHA ---
    var sheetId = '1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds';
    // --- FIM DA SUBSTITUIÇÃO ---
    
    var ss = SpreadsheetApp.openById(sheetId);
    var sheets = ss.getSheets();
    
    console.log('=== ABAS DISPONÍVEIS NA PLANILHA ===');
    sheets.forEach(function(sheet, index) {
      console.log((index + 1) + '. "' + sheet.getName() + '"');
    });
    
  } catch (error) {
    console.error('Erro ao listar abas:', error.message);
  }
}
