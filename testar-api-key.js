// Execute este código para testar a API Key

function testarAPIKey() {
  var apiKey = "AIzaSyDto3POftQiQbAK2jGEv9uqB7rLyzWa8l8"
  var spreadsheetId = "1tGGBKudO5Th8m7E-AsWPiAqCFI9O6gRAI5lojIa8Zds" // ID atual

  console.log("=== TESTANDO API KEY ===")
  console.log("🔑 API Key:", apiKey.substring(0, 10) + "...")
  console.log("📋 Spreadsheet ID:", spreadsheetId)

  try {
    // Testar acesso básico à planilha
    var url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`

    var response = UrlFetchApp.fetch(url) // Declare google.script.run withSuccessHandler as UrlFetchApp.fetch

    var responseCode = response.getResponseCode()

    console.log("📡 Response Code:", responseCode)

    if (responseCode === 200) {
      var data = JSON.parse(response.getContentText())
      console.log("✅ API Key funcionando!")
      console.log("📊 Planilha encontrada:", data.properties.title)

      // Listar abas
      var sheets = data.sheets.map((sheet) => sheet.properties.title)
      console.log("📋 Abas disponíveis:", sheets.join(", "))

      return {
        success: true,
        title: data.properties.title,
        sheets: sheets,
      }
    } else {
      console.log("❌ Erro na API:", responseCode)
      console.log("📄 Response:", response.getContentText())
      return {
        success: false,
        error: `HTTP ${responseCode}: ${response.getContentText()}`,
      }
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
