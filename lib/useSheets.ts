export const sendToSheets = async (payload: any) => {
  // SUBSTITUA pela sua URL do Google Apps Script (a que termina em /exec)
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwfGipj-bFv-KjPVbOVsC3Frqzh118JbH34rxMWy58tDFcGG8c_ijW267rbNsAYcUXV/exec"; 

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