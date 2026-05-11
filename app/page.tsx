"use client";
import { useState, useEffect } from "react";
import Gatekeeper from "@/components/Gatekeeper";
import EbookSegcomp from "@/components/EbookSegcomp";
import { sendToSheets } from "@/lib/useSheets";

export default function Home() {
  const [lead, setLead] = useState<any>(null);
  const [accessGranted, setAccessGranted] = useState(false);

  const handleAccess = async (leadData: any) => {
    setLead(leadData);
    setAccessGranted(true);
    
    // Envia o lead inicial para a planilha
    await sendToSheets({
      lead: leadData,
      progresso: "0% (Acesso Iniciado)",
      score: 0,
      detalhes: "Entrou no Ebook"
    });
  };

  // Proteção contra Cópia, Botão Direito e Impressão (Anti-Download)
  useEffect(() => {
    if (!accessGranted) return;

    const preventActions = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 'p' || e.key === 's' || e.key === 'u' || e.key === 'c')) {
        e.preventDefault();
        alert("🔒 Conteúdo Protegido Segcomp.");
      }
    };

    const disableRightClick = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("contextmenu", disableRightClick);
    document.addEventListener("keydown", preventActions);

    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
      document.removeEventListener("keydown", preventActions);
    };
  }, [accessGranted]);

  return (
    <main className="min-h-screen bg-[#0a1128] text-white">
      {!accessGranted ? (
        <Gatekeeper onAccessGranted={handleAccess} />
      ) : (
        <EbookSegcomp lead={lead} />
      )}
    </main>
  );
}