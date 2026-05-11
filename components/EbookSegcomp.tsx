"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sendToSheets } from "@/lib/useSheets";
import { toast } from "sonner";

const TOTAL_PAGES = 15;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "ebook_segcomp_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

function calcPercentual(pagina: number): number {
  return Math.round((pagina / TOTAL_PAGES) * 100);
}

export default function EbookSegcomp({ lead }: { lead: any }) {
  const sessionId = useRef(getSessionId());
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [paginaMaxima, setPaginaMaxima] = useState(1);
  const [tempoInicio] = useState(Date.now());
  const lastTrackedPercent = useRef(-1);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- ESTADOS DO CHECKLIST INTERATIVO ---
  const [respostas, setRespostas] = useState<Record<number, boolean>>({});
  
  const checklistItens = [
    "Câmeras funcionando e sem pontos cegos",
    "Gravações armazenadas por 30+ dias",
    "Portão de pedestres separado de veículos",
    "Porteiro treinado e com protocolo claro",
    "Registro de todos os visitantes",
    "Iluminação adequada em todas as áreas",
    "Controle de acesso com biometria ou app",
    "Senhas trocadas nos últimos 6 meses",
    "Câmeras com visão noturna ou infra",
    "Alarme perimetral instalado",
    "Plano de emergência comunicado",
    "Manutenção preventiva em dia",
    "Contrato de segurança com SLA",
    "Crachás para prestadores",
    "Entregadores apenas na portaria",
    "Reunião de segurança anual"
  ];

  const itensMarcados = Object.values(respostas).filter(v => v).length;
  const scoreSeguranca = Math.round((itensMarcados / checklistItens.length) * 100);

  const toggleCheck = (id: number) => {
    setRespostas(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // --- FUNÇÃO DE RASTREIO (ENVIAR PARA SHEETS) ---
  const sendTrack = useCallback((opts: { pagina?: number; detalhesExtra?: string }) => {
    const pMax = opts.pagina ?? paginaMaxima;
    const tempo = Math.round((Date.now() - tempoInicio) / 1000);
    
    sendToSheets({
      lead: lead,
      progresso: `${calcPercentual(pMax)}%`,
      score: scoreSeguranca,
      detalhes: `Pág: ${pMax} | Tempo: ${tempo}s | Checklist: ${itensMarcados}/${checklistItens.length} | ${opts.detalhesExtra || ""}`
    });
  }, [paginaMaxima, tempoInicio, lead, scoreSeguranca, itensMarcados, checklistItens.length]);

  // Observer para detectar página atual e máxima
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = pageRefs.current.findIndex(r => r === entry.target);
            if (idx >= 0) {
              const pg = idx + 1;
              setPaginaAtual(pg);
              setPaginaMaxima(prev => Math.max(prev, pg));
            }
          }
        });
      },
      { threshold: 0.5 }
    );
    pageRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  // Lógica inteligente para evitar duplicação no Sheets
  useEffect(() => {
    const percentualAtual = calcPercentual(paginaMaxima);
    
    // Só dispara se o progresso subiu 20% OU se chegou ao fim OU se é o primeiro envio
    if (percentualAtual > lastTrackedPercent.current && (percentualAtual % 20 === 0 || percentualAtual === 100)) {
      lastTrackedPercent.current = percentualAtual;
      sendTrack({ pagina: paginaMaxima });
    }
  }, [paginaMaxima, sendTrack]);

  const percentualVisual = calcPercentual(paginaMaxima);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a1128", minHeight: "100vh" }}>
      {/* BARRA DE PROGRESSO FIXA */}
      <div style={navStyle}>
        <div style={{ color: "#00e5e5", fontWeight: 900, fontSize: 14 }}>SEGCOMP</div>
        <div style={progressContainerStyle}>
          <div style={{ ...progressBarStyle, width: `${percentualVisual}%` }} />
        </div>
        <div style={{ color: "#00e5e5", fontSize: 12, fontWeight: 700 }}>{percentualVisual}% lido</div>
      </div>

      <div style={{ paddingTop: 60, display: "flex", flexDirection: "column", alignItems: "center" }}>
        
        {/* PÁGINA 1: CAPA */}
        <div ref={el => { pageRefs.current[0] = el; }} style={pageStyle("capa")}>
          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029798090/YYVnAgDirJBaehnwAR7pmf/capa-MXwq5AqAnrhBFM6GeDeyUk.png" alt="Capa" style={capaImgStyle} />
          <div style={capaOverlayStyle} />
          <div style={capaContentStyle}>
            <div style={badgeStyle}>Guia Estratégico</div>
            <h1 style={capaTitleStyle}>O Guia do<br /><span style={{ color: "#00e5e5" }}>Síndico Seguro</span></h1>
            <p style={{ color: "#B0C4D8", fontSize: 18 }}>Estratégias de elite para proteção condominial.</p>
          </div>
        </div>

        {/* PÁGINAS 2 ATÉ 11 (Conteúdo de Leitura) */}
        {/* Aqui você repetiria as páginas que já temos, focando agora na 12 e 13 interativas */}
                 {/* ===== PÁGINA 2: POR QUE ESTE GUIA? ===== */}



        <div ref={el => { pageRefs.current[1] = el; }} style={pageStyle()}>



          <PageHeader num="02" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Introdução</div>



              <h2 style={titleStyle}>Por que este <span style={{ color: "#00C9B1" }}>guia existe?</span></h2>



            </div>



            <p style={introStyle}>



              Ser síndico é uma responsabilidade enorme. Você cuida do patrimônio e da segurança de dezenas — às vezes centenas — de famílias. Mas ninguém te ensinou isso na escola.



            </p>



            <p style={textStyle}>



              Este guia foi criado para ser <strong>direto ao ponto</strong>: sem jargão técnico, sem enrolação. Você vai aprender o essencial sobre segurança condominial em linguagem simples, com exemplos práticos e um checklist para usar no seu dia a dia.



            </p>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>



              {[



                { num: "73%", label: "dos crimes em cond. ocorrem na entrada" },



                { num: "60%", label: "dos condomínios têm câmeras mal posicionadas" },



                { num: "3x", label: "mais seguro com controle de acesso ativo" },



              ].map((s, i) => (



                <div key={i} style={statBoxStyle}>



                  <div style={{ fontSize: 42, fontWeight: 900, color: "#00C9B1", lineHeight: 1 }}>{s.num}</div>



                  <div style={{ fontSize: 11, color: "#B0C4D8", textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{s.label}</div>



                </div>



              ))}



            </div>



            <TipBox icon="💡" text={<>Leia este guia com calma e use o checklist das páginas 12 e 13 para avaliar o seu condomínio hoje mesmo.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 3: AVALIAÇÃO DE RISCOS ===== */}



        <div ref={el => { pageRefs.current[2] = el; }} style={pageStyle()}>



          <PageHeader num="03" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 1</div>



              <h2 style={titleStyle}>Como avaliar os <span style={{ color: "#00C9B1" }}>riscos do seu condomínio</span></h2>



            </div>



            <p style={textStyle}>Antes de instalar qualquer equipamento, você precisa entender <strong>onde estão as vulnerabilidades</strong>. Faça um diagnóstico simples percorrendo o condomínio com estas perguntas:</p>



            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>



              {[



                { n: "1", title: "Pontos de entrada e saída", desc: "Quantas entradas existem? Todas são monitoradas? Há portão de pedestres separado do de veículos?" },



                { n: "2", title: "Iluminação", desc: "Garagem, corredores e área externa têm boa iluminação à noite? Câmeras sem luz não funcionam bem." },



                { n: "3", title: "Pontos cegos", desc: "Existem áreas sem visibilidade de câmeras ou da portaria? Esses são os locais preferidos de invasores." },



                { n: "4", title: "Fluxo de pessoas", desc: "Prestadores de serviço, entregadores e visitantes — como eles entram? Há registro e controle?" },



                { n: "5", title: "Histórico de ocorrências", desc: "Já houve furtos, invasões ou incidentes? Onde aconteceram? O histórico revela padrões." },



              ].map((item, i) => (



                <div key={i} style={{ display: "flex", gap: 14 }}>



                  <div style={dotStyle}>{item.n}</div>



                  <div>



                    <strong style={{ display: "block", color: "#fff", fontSize: 14, marginBottom: 3 }}>{item.title}</strong>



                    <span style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.5 }}>{item.desc}</span>



                  </div>



                </div>



              ))}



            </div>



            <TipBox icon="📋" text={<>Faça essa ronda com um caderno ou celular. Registre tudo. Esse diagnóstico é o ponto de partida para qualquer projeto de segurança sério.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 4: CÂMERAS PARTE 1 ===== */}



        <div ref={el => { pageRefs.current[3] = el; }} style={pageStyle()}>



          <PageHeader num="04" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 2</div>



              <h2 style={titleStyle}>Câmeras de segurança: <span style={{ color: "#00C9B1" }}>onde instalar?</span></h2>



            </div>



            <div style={{ borderRadius: 12, overflow: "hidden" }}>



              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029798090/YYVnAgDirJBaehnwAR7pmf/cameras-MR2ACq7jbRu6oPmgLpB7Mq.png" alt="Mapa câmeras" style={{ width: "100%", display: "block" }} />



            </div>



            <p style={textStyle}>O posicionamento correto das câmeras faz toda a diferença. Não adianta ter muitas câmeras se elas não cobrem os pontos certos.</p>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>



              <CardItem icon="🚪" title="Entrada principal" desc="Câmera de alta resolução focada no rosto de quem entra. Deve cobrir pedestres e veículos." />



              <CardItem icon="🅿️" title="Garagem" desc="Câmeras nas rampas de acesso, corredores e vagas. Iluminação adequada é obrigatória." />



            </div>



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 5: CÂMERAS PARTE 2 ===== */}



        <div ref={el => { pageRefs.current[4] = el; }} style={pageStyle()}>



          <PageHeader num="05" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 2 — continuação</div>



              <h2 style={titleStyle}>O que observar <span style={{ color: "#00C9B1" }}>ao instalar câmeras</span></h2>



            </div>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>



              <CardItem icon="🛗" title="Elevadores" desc="Câmera interna no elevador e no hall de cada andar. Registra movimentação suspeita." />



              <CardItem icon="🌿" title="Área de lazer" desc="Piscina, churrasqueira e playground devem ter cobertura. Evita conflitos e registra incidentes." />



              <CardItem icon="🏠" title="Área de serviço" desc="Entrada de prestadores, lixeiras e depósitos. Pontos frequentes de furtos internos." />



              <CardItem icon="🌙" title="Visão noturna" desc="Câmeras com infravermelho ou coloridas noturnas. Sem isso, a câmera é inútil à noite." />



            </div>



            <WarnBox icon="⚠️" text={<><strong style={{ color: "#FF6B35" }}>Atenção legal:</strong> Câmeras em áreas comuns são permitidas. Nunca instale câmeras em banheiros, vestiários ou dentro das unidades. Isso é crime.</>} />



            <TipBox icon="💾" text={<>Guarde as gravações por pelo menos <strong>30 dias</strong>. Em caso de ocorrência, o síndico pode ser responsabilizado se não houver registro.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 6: CONTROLE DE ACESSO PARTE 1 ===== */}



        <div ref={el => { pageRefs.current[5] = el; }} style={pageStyle()}>



          <PageHeader num="06" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 3</div>



              <h2 style={titleStyle}>Controle de acesso: <span style={{ color: "#00C9B1" }}>quem entra no seu cond.?</span></h2>



            </div>



            <div style={{ borderRadius: 12, overflow: "hidden" }}>



              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029798090/YYVnAgDirJBaehnwAR7pmf/acesso-CxBE3vcrXYRvhUKjwEkXi2.png" alt="Controle de acesso" style={{ width: "100%", display: "block" }} />



            </div>



            <p style={textStyle}>Controlar quem entra e sai é a base de qualquer sistema de segurança eficiente. Existem diferentes tecnologias — e a escolha certa depende do perfil do seu condomínio.</p>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>



              <CardItem icon="🖐️" title="Biometria" desc="Impressão digital ou reconhecimento facial. Mais seguro, elimina chaves e cartões perdidos." />



              <CardItem icon="📱" title="Interfone com app" desc="Síndico e moradores autorizam visitas pelo celular, mesmo à distância. Prático e rastreável." />



            </div>



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 7: CONTROLE DE ACESSO PARTE 2 ===== */}



        <div ref={el => { pageRefs.current[6] = el; }} style={pageStyle()}>



          <PageHeader num="07" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 3 — continuação</div>



              <h2 style={titleStyle}>Portaria e <span style={{ color: "#00C9B1" }}>visitantes: boas práticas</span></h2>



            </div>



            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>



              {[



                { title: "Registre todo visitante", desc: "Nome, documento, unidade visitada e horário de entrada e saída. Isso é obrigatório e protege o condomínio." },



                { title: "Crachá para prestadores", desc: "Funcionários de empresas terceirizadas devem usar identificação visível durante toda a permanência." },



                { title: "Nunca abra sem identificação", desc: "Treine o porteiro: nenhuma pessoa entra sem ser identificada, mesmo que diga ser morador." },



                { title: "Entregadores na portaria", desc: "Encomendas devem ser recebidas na portaria, nunca diretamente nas unidades por pessoas desconhecidas." },



              ].map((item, i) => (



                <div key={i} style={{ display: "flex", gap: 14 }}>



                  <div style={{ ...dotStyle, background: "#00C9B1", color: "#0D1B2A" }}>✓</div>



                  <div>



                    <strong style={{ display: "block", color: "#fff", fontSize: 14, marginBottom: 3 }}>{item.title}</strong>



                    <span style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.5 }}>{item.desc}</span>



                  </div>



                </div>



              ))}



            </div>



            <TipBox icon="🔐" text={<><strong>Portaria remota:</strong> Uma opção moderna e econômica. Monitoramento 24h por empresa especializada, com câmeras e interfone. Pode substituir ou complementar o porteiro presencial.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 8: COMO ESCOLHER EMPRESA ===== */}



        <div ref={el => { pageRefs.current[7] = el; }} style={pageStyle()}>



          <PageHeader num="08" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 4</div>



              <h2 style={titleStyle}>Como escolher uma <span style={{ color: "#00C9B1" }}>empresa de segurança?</span></h2>



            </div>



            <p style={textStyle}>Contratar a empresa errada pode ser pior do que não ter segurança nenhuma. Veja o que avaliar antes de assinar qualquer contrato:</p>



            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>



              {[



                { n: "1", title: "Registro na PSPN / CREA", desc: "Empresas de segurança eletrônica devem ser registradas nos órgãos competentes. Peça o número de registro." },



                { n: "2", title: "Referências de outros condomínios", desc: "Peça contatos de clientes atuais. Ligue e pergunte sobre o atendimento, tempo de resposta e qualidade." },



                { n: "3", title: "Suporte técnico pós-venda", desc: "Quem resolve quando uma câmera para de funcionar? Qual o prazo de atendimento? Isso está no contrato?" },



                { n: "4", title: "Garantia dos equipamentos", desc: "Equipamentos de qualidade têm garantia mínima de 12 meses. Desconfie de preços muito abaixo do mercado." },



              ].map((item, i) => (



                <div key={i} style={{ display: "flex", gap: 14 }}>



                  <div style={dotStyle}>{item.n}</div>



                  <div>



                    <strong style={{ display: "block", color: "#fff", fontSize: 14, marginBottom: 3 }}>{item.title}</strong>



                    <span style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.5 }}>{item.desc}</span>



                  </div>



                </div>



              ))}



            </div>



            <WarnBox icon="🚩" text={<><strong style={{ color: "#FF6B35" }}>Sinal de alerta:</strong> Empresa que não tem CNPJ ativo, não apresenta contrato detalhado ou pressiona para fechar na hora — fuja.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 9: CONTRATO ===== */}



        <div ref={el => { pageRefs.current[8] = el; }} style={pageStyle()}>



          <PageHeader num="09" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 4 — continuação</div>



              <h2 style={titleStyle}>O que um bom <span style={{ color: "#00C9B1" }}>contrato deve ter</span></h2>



            </div>



            <p style={textStyle}>Um contrato bem feito protege o condomínio. Antes de assinar, verifique se estes itens estão presentes:</p>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>



              <CardItem icon="📄" title="Escopo detalhado" desc="Quais equipamentos, quantos pontos, quais áreas serão cobertas. Tudo descrito item por item." />



              <CardItem icon="⏱️" title="SLA de atendimento" desc="Prazo máximo para resposta em caso de falha. O ideal é até 4h para problemas críticos." />



              <CardItem icon="🔧" title="Manutenção preventiva" desc="Visitas periódicas para verificar funcionamento dos equipamentos. Mínimo: 2x por ano." />



              <CardItem icon="📤" title="Cláusula de saída" desc="Como encerrar o contrato? Qual o prazo de aviso? Quem fica com os equipamentos?" />



            </div>



            <TipBox icon="⚖️" text={<>Leve o contrato para um advogado ou administradora antes de assinar. Contratos de segurança costumam ter multas altas por rescisão antecipada.</>} />



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 10: ERROS COMUNS ===== */}



        <div ref={el => { pageRefs.current[9] = el; }} style={pageStyle()}>



          <PageHeader num="10" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 5</div>



              <h2 style={titleStyle}>Erros comuns que <span style={{ color: "#00C9B1" }}>síndicos cometem</span></h2>



            </div>



            <div style={{ borderRadius: 12, overflow: "hidden" }}>



              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310419663029798090/YYVnAgDirJBaehnwAR7pmf/erros-jfidzy9vmGJ3BE4Xrz8GXN.png" alt="Erros comuns" style={{ width: "100%", display: "block" }} />



            </div>



            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>



              <CardItem icon="❌" title="Câmeras sem manutenção" desc="Câmera com lente suja, fora de foco ou com defeito não serve para nada. Teste regularmente." accentColor="#FF6B35" />



              <CardItem icon="❌" title="Portão sempre aberto" desc="Portão de garagem ou pedestres que fica aberto 'para facilitar' é convite para invasores." accentColor="#FF6B35" />



            </div>



          </div>



          <PageFooter />



        </div>







        {/* ===== PÁGINA 11: MAIS ERROS ===== */}



        <div ref={el => { pageRefs.current[10] = el; }} style={pageStyle()}>



          <PageHeader num="11" />



          <div style={bodyStyle}>



            <div>



              <div style={tagStyle}>Capítulo 5 — continuação</div>



              <h2 style={titleStyle}>Mais erros que <span style={{ color: "#00C9B1" }}>precisam ser evitados</span></h2>



            </div>



            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>



              {[



                { title: "Não treinar o porteiro", desc: "O porteiro é a primeira linha de defesa. Sem treinamento, ele pode ser facilmente enganado por técnicas de engenharia social." },



                { title: "Ignorar a iluminação", desc: "Áreas escuras são pontos cegos mesmo com câmeras. Iluminação é parte do sistema de segurança." },



                { title: "Não ter plano de emergência", desc: "O que fazer em caso de invasão, incêndio ou acidente? Todo condomínio precisa de um protocolo claro e comunicado aos moradores." },



                { title: "Compartilhar senhas com muita gente", desc: "Senha de portão ou sistema que todo mundo sabe não é segurança. Troque periodicamente e limite o acesso." },



              ].map((item, i) => (



                <div key={i} style={{ display: "flex", gap: 14 }}>



                  <div style={{ ...dotStyle, background: "#FF6B35", color: "#fff" }}>✗</div>



                  <div>



                    <strong style={{ display: "block", color: "#fff", fontSize: 14, marginBottom: 3 }}>{item.title}</strong>



                    <span style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.5 }}>{item.desc}</span>



                  </div>



                </div>



              ))}



            </div>



            <TipBox icon="🎯" text={<>Segurança não é um produto que você compra uma vez. É um <strong>processo contínuo</strong> de avaliação, manutenção e melhoria.</>} />



          </div>



          <PageFooter />



        </div>
        {/* PÁGINA 12-13: O DIAGNÓSTICO INTERATIVO */}
        <div ref={el => { pageRefs.current[11] = el; }} style={pageStyle()}>
          <PageHeader num="12-13" />
          <div style={bodyStyle}>
            <div>
              <div style={tagStyle}>Diagnóstico Segcomp</div>
              <h2 style={titleStyle}>Checklist de <span style={{ color: "#00e5e5" }}>Segurança Real</span></h2>
              <p style={textStyle}>Marque os itens que seu condomínio possui hoje para calcular seu score:</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {checklistItens.map((item, i) => (
                <div 
                  key={i} 
                  onClick={() => toggleCheck(i)}
                  style={{ 
                    display: "flex", gap: 10, background: respostas[i] ? "#00e5e515" : "#132338", 
                    borderRadius: 8, padding: "12px 14px", alignItems: "flex-start", 
                    cursor: "pointer", border: respostas[i] ? "1px solid #00e5e5" : "1px solid transparent",
                    transition: "0.2s"
                  }}
                >
                  <div style={{ 
                    width: 18, height: 18, border: "2px solid #00e5e5", borderRadius: 4, 
                    background: respostas[i] ? "#00e5e5" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#0D1B2A", fontSize: 12, flexShrink: 0
                  }}>
                    {respostas[i] && "✓"}
                  </div>
                  <span style={{ fontSize: 12, color: respostas[i] ? "#fff" : "#c8d8e8", lineHeight: 1.3 }}>{item}</span>
                </div>
              ))}
            </div>

            {/* PLACAR DE SCORE */}
            <div style={scoreBoxStyle}>
              <div style={{ fontSize: 14, color: "#B0C4D8" }}>Seu Nível de Proteção:</div>
              <div style={{ fontSize: 48, fontWeight: 900, color: scoreSeguranca < 50 ? "#FF6B35" : "#00e5e5" }}>
                {scoreSeguranca}%
              </div>
              <p style={{ fontSize: 13, color: "#7A9BB5", marginTop: 10 }}>
                {scoreSeguranca < 50 ? "⚠️ ALTO RISCO: Sua gestão precisa de reforço imediato." : 
                 scoreSeguranca < 80 ? "🛡️ RISCO MÉDIO: Existem vulnerabilidades perigosas." : 
                 "✅ SEGURO: Protocolos de excelência detectados."}
              </p>
            </div>
          </div>
          <PageFooter />
        </div>

        {/* PÁGINA 15: ENCERRAMENTO E CTA */}
        <div ref={el => { pageRefs.current[14] = el; }} style={pageStyle("capa")}>
           <div style={{ textAlign: "center", padding: 40 }}>
             <h2 style={titleStyle}>Quer elevar seu <br/><span style={{ color: "#00e5e5" }}>Score para 100%?</span></h2>
             <p style={{ color: "#B0C4D8", marginTop: 20 }}>Fale com nosso especialista em segurança condominial.</p>
             <button 
               onClick={() => { sendTrack({ detalhesExtra: "Clicou no Botão Final" }); window.open("https://wa.me/5584981878563"); }}
               style={ctaButtonStyle}>
               Solicitar Consultoria Grátis
             </button>
           </div>
        </div>

      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES E ESTILOS ---

function PageHeader({ num }: { num: string }) {
  return (
    <div style={{ padding: "20px 50px", borderBottom: "3px solid #00e5e5", display: "flex", justifyContent: "space-between", background: "#0f172a" }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: "#00e5e5", letterSpacing: 2 }}>SEGCOMP</span>
      <span style={{ fontSize: 12, color: "#7A9BB5" }}>PÁG. {num}</span>
    </div>
  );
}

function PageFooter() {
  return <div style={{ padding: "15px 50px", borderTop: "1px solid #1e293b", fontSize: 11, color: "#475569" }}>© SEGCOMP - Inteligência em Segurança Condominial</div>;
}

const navStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "#0f172a", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #1e293b" };
const progressContainerStyle: React.CSSProperties = { flex: 1, background: "#1e293b", borderRadius: 10, height: 6, overflow: "hidden" };
const progressBarStyle: React.CSSProperties = { height: "100%", background: "#00e5e5", transition: "width 0.5s ease" };
const pageStyle = (type?: string): React.CSSProperties => ({ width: "100%", maxWidth: 794, minHeight: 1123, background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", position: "relative", borderBottom: "4px solid #0a1128", justifyContent: type === "capa" ? "center" : "flex-start" });
const bodyStyle: React.CSSProperties = { flex: 1, padding: "40px 50px", display: "flex", flexDirection: "column", gap: 20 };
const titleStyle: React.CSSProperties = { fontSize: 32, fontWeight: 900, lineHeight: 1.1 };
const textStyle: React.CSSProperties = { fontSize: 15, color: "#cbd5e1", lineHeight: 1.6 };
const tagStyle: React.CSSProperties = { display: "inline-block", color: "#00e5e5", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 };
const scoreBoxStyle: React.CSSProperties = { marginTop: 10, padding: 25, borderRadius: 15, background: "#132338", border: "1px solid #00e5e533", textAlign: "center" };
const ctaButtonStyle: React.CSSProperties = { background: "#00e5e5", color: "#0f172a", border: "none", borderRadius: 12, padding: "18px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 30, boxShadow: "0 10px 20px #00e5e533" };
const badgeStyle: React.CSSProperties = { display: "inline-block", background: "#00e5e5", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "6px 16px", borderRadius: 20, marginBottom: 15 };
const capaImgStyle: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: "65%", objectFit: "cover" };
const capaOverlayStyle: React.CSSProperties = { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #0f172a 50%, transparent)" };
const capaContentStyle: React.CSSProperties = { position: "relative", zIndex: 2, textAlign: "center", padding: 60, marginTop: "auto" };
const capaTitleStyle: React.CSSProperties = { fontSize: 52, fontWeight: 900, lineHeight: 1.1, margin: "16px 0" };
function TipBox({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={{ 
      background: "rgba(0,229,229,0.1)", 
      border: "1px solid rgba(0,229,229,0.3)", 
      borderRadius: 10, padding: "16px 20px", 
      display: "flex", gap: 14, marginTop: 15 
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: 14, color: "#b8e8e0", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function WarnBox({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={{ 
      background: "rgba(255,107,53,0.1)", 
      border: "1px solid rgba(255,107,53,0.3)", 
      borderRadius: 10, padding: "16px 20px", 
      display: "flex", gap: 14, marginTop: 15 
    }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: 14, color: "#f0c8b8", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function CardItem({ icon, title, desc, accentColor = "#00e5e5" }: { icon: string; title: string; desc: string; accentColor?: string }) {
  return (
    <div style={{ background: "#132338", borderRadius: 12, padding: 20, borderTop: `3px solid ${accentColor}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, background: `${accentColor}22`, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>{icon}</div>
        <strong style={{ fontSize: 14, color: "#fff" }}>{title}</strong>
      </div>
      <p style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

// Estilos extras para evitar erros de "undefined"
const statBoxStyle: React.CSSProperties = {
  background: "#132338",
  borderRadius: 12,
  padding: 20,
  textAlign: "center",
  borderBottom: "3px solid #00e5e5",
};

const introStyle: React.CSSProperties = {
  fontSize: 16,
  color: "#B0C4D8",
  lineHeight: 1.7,
  borderLeft: "3px solid #00e5e5",
  paddingLeft: 18,
};
const dotStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  background: "#00e5e5",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 13,
  fontWeight: 700,
  color: "#0a1128",
  flexShrink: 0,
  marginTop: 2,
};