export const sendToSheets = async (payload: any) => {
  // SUBSTITUA pela sua URL do Google Apps Script (a que termina em /exec)
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbw4qkCgq02R6X03fLCDyd5NAmpHsCSucqc0Ad0LNsn7Zxyjnj51hw-sr471n3y4vlWN/exec"; 

  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    console.log("Dados enviados para a planilha.");
  } catch (error) {
    console.error("Erro ao conectar com o Sheets:", error);
  }
};