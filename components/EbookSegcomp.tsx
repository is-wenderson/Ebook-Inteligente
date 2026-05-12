"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { sendToSheets } from "@/lib/useSheets";

// Agora temos 13 páginas (11 de conteúdo + 1 de Diagnóstico + 1 Institucional Final)
const TOTAL_PAGES = 14;

const perguntasAuditoria = [
  {
    pergunta: "Se houver uma invasão noturna hoje, suas câmeras identificam o rosto com nitidez?",
    opcoes: [
      { texto: "A) Sim, imagem 100% clara com infravermelho de alta definição.", valor: 10 },
      { texto: "B) Talvez, a imagem fica granulada ou escura à noite.", valor: 5 },
      { texto: "C) Difícil, temos pontos cegos ou câmeras muito antigas.", valor: 0 }
    ]
  },
  {
    pergunta: "Em caso de apagão ou queda de energia na sua rua, o que acontece com a segurança?",
    opcoes: [
      { texto: "A) Tudo funciona normalmente com Nobreaks de longa duração.", valor: 10 },
      { texto: "B) Câmeras param, mas os portões ainda funcionam um pouco.", valor: 5 },
      { texto: "C) O sistema desliga e os portões ficam destravados ou manuais.", valor: 0 }
    ]
  },
  {
    pergunta: "Como é feito o acesso de pedestres (moradores e visitantes) no portão principal?",
    opcoes: [
      { texto: "A) Eclusa (duplo portão) com abertura via biometria/facial.", valor: 10 },
      { texto: "B) Portão único, mas com liberação apenas pelo porteiro.", valor: 5 },
      { texto: "C) Uso de chaves comuns ou TAGs que podem ser clonadas/perdidas.", valor: 0 }
    ]
  },
  {
    pergunta: "Como o condomínio gerencia as entregas de aplicativos (iFood, Correios)?",
    opcoes: [
      { texto: "A) Recebimento em passa-volume ou clausura, sem contato físico.", valor: 10 },
      { texto: "B) Entregador entra na recepção, mas não sobe aos andares.", valor: 5 },
      { texto: "C) Entregadores têm acesso livre aos blocos ou unidades.", valor: 0 }
    ]
  },
  {
    pergunta: "Qual é o nível de treinamento e preparo atual da sua equipe de portaria?",
    opcoes: [
      { texto: "A) Treinamento periódico rigoroso contra golpes e engenharia social.", valor: 10 },
      { texto: "B) Foram instruídos, mas confiam na intuição (conhecem o morador).", valor: 5 },
      { texto: "C) Não há protocolo claro; liberam acesso sob pressão ou pressa.", valor: 0 }
    ]
  },
  {
    pergunta: "Onde e como as imagens do seu circuito de câmeras são armazenadas?",
    opcoes: [
      { texto: "A) Backup em nuvem imediato; se roubarem o DVR, as imagens estão salvas.", valor: 10 },
      { texto: "B) Apenas no DVR local, guardadas por cerca de 30 dias.", valor: 5 },
      { texto: "C) Não sei / Gravamos por menos de 10 dias / Equipamento falha muito.", valor: 0 }
    ]
  },
  {
    pergunta: "Existe um alarme de intrusão perimetral nos muros do condomínio?",
    opcoes: [
      { texto: "A) Sim, cerca elétrica ativa integrada a sensores e monitoramento 24h.", valor: 10 },
      { texto: "B) Temos cerca ou ouriço, mas não é monitorada ativamente.", valor: 5 },
      { texto: "C) Não possuímos proteção eletrônica perimetral efetiva.", valor: 0 }
    ]
  },
  {
    pergunta: "Como funciona a manutenção dos seus equipamentos de segurança?",
    opcoes: [
      { texto: "A) Preventiva mensal com SLA rigoroso em contrato (até 4h).", valor: 10 },
      { texto: "B) Chamamos um técnico apenas quando algo quebra (Corretiva).", valor: 5 },
      { texto: "C) Vários equipamentos estão inoperantes há meses.", valor: 0 }
    ]
  },
  {
    pergunta: "Existe um protocolo de pânico silencioso para a portaria acionar em emergências?",
    opcoes: [
      { texto: "A) Sim, botão de pânico oculto com comunicação direta à central.", valor: 10 },
      { texto: "B) O porteiro precisa ligar do próprio celular ou rádio.", valor: 5 },
      { texto: "C) Não há nenhum procedimento rápido definido para coação.", valor: 0 }
    ]
  },
  {
    pergunta: "Qual o rigor na entrada de prestadores de serviço (TV a cabo, reformas)?",
    opcoes: [
      { texto: "A) Conferência de documento com foto, pré-cadastro e crachá obrigatório.", valor: 10 },
      { texto: "B) Anotação do nome num caderno, mas sem retenção de documento.", valor: 5 },
      { texto: "C) Morador avisa pelo interfone e a entrada é liberada diretamente.", valor: 0 }
    ]
  }
];

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
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lastTrackedPercent = useRef(1);

  // Estados da Auditoria
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostasDiag, setRespostasDiag] = useState<number[]>([]);
  const [diagnosticoFinalizado, setDiagnosticoFinalizado] = useState(false);

  const sendTrack = useCallback((opts: { progressoCustom?: string; detalhesExtra?: string; scoreCalc?: number }) => {
    const tempo = Math.round((Date.now() - tempoInicio) / 1000);
    const progressoFinal = opts.progressoCustom || `${calcPercentual(paginaMaxima)}%`;
    
    sendToSheets({
      lead: lead,
      progresso: progressoFinal,
      score: opts.scoreCalc || 0,
      detalhes: `Tempo: ${tempo}s | ${opts.detalhesExtra || "Leitura"}`
    });
  }, [paginaMaxima, tempoInicio, lead]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
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
    }, { threshold: 0.5 });
    
    pageRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, []);

  // Tracking Dinâmico (Rastreia cada página nova alcançada)
  useEffect(() => {
    if (paginaMaxima > lastTrackedPercent.current) {
      lastTrackedPercent.current = paginaMaxima; 
      
      const pAtual = calcPercentual(paginaMaxima);
      let detalhe = `Lendo Pág. ${paginaMaxima}`;
      
      if (paginaMaxima === 1) detalhe = "Iniciou a Leitura";
      if (paginaMaxima === 6) detalhe = "Metade da Leitura";
      if (paginaMaxima === 12) detalhe = "Iniciou a Auditoria";
      if (paginaMaxima === 13) detalhe = "Chegou no Final (Contatos)";

      sendTrack({ 
        progressoCustom: `${pAtual}%`,
        detalhesExtra: detalhe 
      });
    }
  }, [paginaMaxima, sendTrack]);

  const responderDiagnostico = (valor: number) => {
    const novasRespostas = [...respostasDiag, valor];
    setRespostasDiag(novasRespostas);

    if (perguntaAtual < perguntasAuditoria.length - 1) {
      setPerguntaAtual(prev => prev + 1);
    } else {
      setDiagnosticoFinalizado(true);
      const pontuacaoTotal = novasRespostas.reduce((a, b) => a + b, 0);
      const scoreFinal = Math.round((pontuacaoTotal / (perguntasAuditoria.length * 10)) * 100);
      
      // Essa mágica traduz a pontuação para a letra que ele escolheu (A, B ou C)
      const relatorioLetras = novasRespostas.map((resp, index) => {
        const letra = resp === 10 ? 'A' : resp === 5 ? 'B' : 'C';
        return `P${index + 1}: ${letra}`;
      }).join(" | ");
      
      sendTrack({
        progressoCustom: "100% (Auditoria Concluída)",
        scoreCalc: scoreFinal,
        detalhesExtra: `Auditoria Finalizada com Score de ${scoreFinal}%\nRespostas: [ ${relatorioLetras} ]`
      });
    }
  };

  const percentualEbook = calcPercentual(paginaMaxima);
  const pontuacaoTotalAtual = respostasDiag.reduce((a, b) => a + b, 0);
  const scoreCalculado = Math.round((pontuacaoTotalAtual / (perguntasAuditoria.length * 10)) * 100);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#0a1128", minHeight: "100vh" }}>
      {/* BARRA DE PROGRESSO FIXA */}
      <div style={navStyle}>
        <div style={{ color: "#00e5e5", fontWeight: 900, fontSize: 14 }}>SEGCOMP</div>
        <div style={progressContainerStyle}>
          <div style={{ ...progressBarStyle, width: `${percentualEbook}%` }} />
        </div>
        <div style={{ color: "#00e5e5", fontSize: 12, fontWeight: 700 }}>{percentualEbook}% lido</div>
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

        {/* PÁGINA 2: INTRO */}
        <div ref={el => { pageRefs.current[1] = el; }} style={pageStyle()}>
          <PageHeader num="02" />
          <div style={bodyStyle}>
            <div>
              <div style={tagStyle}>Introdução</div>
              <h2 style={titleStyle}>Por que este <span style={{ color: "#00e5e5" }}>guia existe?</span></h2>
            </div>
            <p style={introStyle}>Ser síndico é uma responsabilidade enorme. Você cuida do patrimônio e da segurança de dezenas — às vezes centenas — de famílias.</p>
            <p style={textStyle}>Você vai aprender o essencial sobre segurança condominial em linguagem simples.</p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              <StatBox num="73%" label="dos crimes ocorrem na entrada" />
              <StatBox num="60%" label="possuem câmeras mal posicionadas" />
              <StatBox num="3x" label="mais seguro com controle de acesso" />
            </div>
          </div>
          <PageFooter />
        </div>

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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
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

        
        {/* ===== PÁGINA 12: RESPONSABILIDADE LEGAL ===== */}
        <div ref={el => { pageRefs.current[11] = el; }} style={pageStyle()}>
          <PageHeader num="12" />
          <div style={bodyStyle}>
            <div>
              <div style={tagStyle}>Capítulo 6</div>
              <h2 style={titleStyle}>A responsabilidade <span style={{ color: "#00e5e5" }}>legal do síndico</span></h2>
            </div>
            <p style={introStyle}>O síndico não é apenas um gestor de obras e contas. Ele também responde legalmente pela segurança do condomínio.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { n: "⚖️", title: "Código Civil (Art. 1.348)", desc: "O síndico tem o dever de 'diligenciar a conservação e a guarda das partes comuns'. Isso inclui a segurança das áreas comuns." },
                { n: "📋", title: "Responsabilidade civil", desc: "Se um morador ou visitante sofrer dano por negligência na segurança, o síndico pode ser responsabilizado pessoalmente." },
                { n: "🏛️", title: "LGPD e câmeras", desc: "As gravações de câmeras são dados pessoais. O condomínio deve ter política de privacidade e controlar quem acessa as imagens." },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <div style={{ ...dotStyle, background: "#1A3050", fontSize: 16 }}>{item.n}</div>
                  <div>
                    <strong style={{ display: "block", color: "#fff", fontSize: 14, marginBottom: 3 }}>{item.title}</strong>
                    <span style={{ fontSize: 13, color: "#B0C4D8", lineHeight: 1.5 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <TipBox icon="🛡️" text={<>Documente todas as decisões de segurança em ata de assembleia. Isso demonstra que você agiu com diligência e protege você de responsabilizações futuras.</>} />
            <WarnBox icon="📌" text={<>Consulte sempre um advogado condominial para revisar contratos e decisões importantes. A prevenção jurídica é tão importante quanto a segurança física.</>} />
          </div>
          <PageFooter />
        </div>

        {/* ===== PÁGINA 13: A AUDITORIA TÉCNICA ===== */}
        <div ref={el => { pageRefs.current[12] = el; }} style={pageStyle()}>
          <PageHeader num="13" />
          <div style={{ ...bodyStyle, display: "flex", flexDirection: "column" }}>
            
            {/* CABEÇALHO ADICIONADO AQUI (Fica fixo no topo do corpo) */}
            <div style={{ marginBottom: 10 }}>
              <div style={tagStyle}>Auditoria Especializada</div>
              <h2 style={titleStyle}>Descubra o seu nível real de <span style={{ color: "#00e5e5" }}>proteção</span></h2>
              <p style={textStyle}>Responda com sinceridade para o sistema calcular a eficiência técnica do seu condomínio:</p>
            </div>
            
            {/* CONTAINER FLEX PARA CENTRALIZAR O CARD NA VERTICAL E HORIZONTAL */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", width: "100%" }}>
              
              {!diagnosticoFinalizado ? (
                // CARD DA PERGUNTA
                <div style={{
                  background: "#0f172a", border: "1px solid #1e293b", borderRadius: "24px", 
                  padding: "30px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)", 
                  width: "100%", maxWidth: "600px"
                }}>
                  <div style={{ color: "#00e5e5", fontSize: 14, fontWeight: 900, marginBottom: 20, letterSpacing: 1, textTransform: "uppercase" }}>
                    PERGUNTA {String(perguntaAtual + 1).padStart(2, '0')}/{perguntasAuditoria.length}
                  </div>
                  
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", fontStyle: "italic", marginBottom: 20, lineHeight: 1.4 }}>
                    {perguntasAuditoria[perguntaAtual].pergunta}
                  </h2>

                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {perguntasAuditoria[perguntaAtual].opcoes.map((opcao, idx) => (
                      <button 
                        key={idx}
                        onClick={() => responderDiagnostico(opcao.valor)} 
                        style={{
                          background: "#132338", color: "#fff", padding: "16px 20px", borderRadius: "16px", 
                          border: "1px solid #1e293b", fontSize: "14px", fontWeight: 700, fontStyle: "italic", cursor: "pointer", 
                          transition: "all 0.2s ease", textAlign: "left", display: "flex", alignItems: "center"
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = "#00e5e5";
                          e.currentTarget.style.background = "rgba(0, 229, 229, 0.05)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = "#1e293b";
                          e.currentTarget.style.background = "#132338";
                        }}
                      >
                        {opcao.texto}
                      </button>
                    ))}
                  </div>
                </div>

              ) : (
                // TELA DO RESULTADO FINAL (CARD NEON)
                <div style={{
                  width: "100%", maxWidth: "500px", padding: 40, borderRadius: 24, textAlign: "center",
                  background: "#0f172a", border: `2px solid ${scoreCalculado < 50 ? "#e11d48" : scoreCalculado < 80 ? "#f59e0b" : "#00e5e5"}`,
                  boxShadow: `0 0 40px ${scoreCalculado < 50 ? "rgba(225, 29, 72, 0.2)" : scoreCalculado < 80 ? "rgba(245, 158, 11, 0.2)" : "rgba(0, 229, 229, 0.2)"}`
                }}>
                  <div style={{ fontSize: 11, color: "#7A9BB5", fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 15 }}>
                    Resultado da Auditoria
                  </div>
                  
                  <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1, color: scoreCalculado < 50 ? "#e11d48" : scoreCalculado < 80 ? "#f59e0b" : "#00e5e5", letterSpacing: -2 }}>
                    {scoreCalculado}%
                  </div>
                  
                  <div style={{ fontSize: 20, fontWeight: 900, color: "#fff", fontStyle: "italic", textTransform: "uppercase", marginTop: 5, marginBottom: 10 }}>
                    Eficiência Técnica
                  </div>
                  
                  <div style={{ fontSize: 12, fontWeight: 800, color: scoreCalculado < 50 ? "#e11d48" : scoreCalculado < 80 ? "#f59e0b" : "#00e5e5", textTransform: "uppercase", letterSpacing: 1, marginBottom: 30 }}>
                    {scoreCalculado < 50 ? "⚠️ Atenção: Risco Crítico Detectado" : scoreCalculado < 80 ? "⚠️ Aviso: Vulnerabilidades Abertas" : "✅ Status: Condomínio Seguro"}
                  </div>

                  <button 
                    onClick={() => window.open(`https://wa.me/5584981878563?text=Olá, acabei de ler o Guia e minha auditoria deu ${scoreCalculado}%. Gostaria de agendar uma consultoria.`)}
                    style={{ 
                      background: scoreCalculado < 80 ? "#e11d48" : "#00e5e5", 
                      color: scoreCalculado < 80 ? "#fff" : "#0a1128", 
                      width: "100%", padding: "18px", borderRadius: "12px", border: "none",
                      fontSize: 15, fontWeight: 900, textTransform: "uppercase", cursor: "pointer",
                      boxShadow: scoreCalculado < 80 ? "0 10px 25px rgba(225, 29, 72, 0.4)" : "0 10px 25px rgba(0, 229, 229, 0.3)"
                    }}>
                    Solicitar Auditoria de Urgência
                  </button>
                </div>
              )}
              
            </div>
          </div>
          <PageFooter />
        </div>
        
        {/* ===== PÁGINA 14: CONTATOS ===== */}
        <div ref={el => { pageRefs.current[13] = el; }} style={pageStyle("capa")}>
           <div style={{ textAlign: "center", padding: "clamp(20px, 5vw, 40px)", display: "flex", flexDirection: "column", alignItems: "center" }}>
             <div style={{ fontSize: 60, marginBottom: 20 }}>🛡️</div>
             <h2 style={{ 
                fontSize: "clamp(28px, 7vw, 42px)", // Ajusta entre 28px e 42px conforme a tela
                fontWeight: 900, 
                lineHeight: 1.1, 
                margin: "16px 0",
                wordBreak: "break-word", // Força a quebra se a palavra for gigante
                maxWidth: "100%" 
              }}>
                Segurança é <br/><span style={{ color: "#00e5e5" }}>Responsabilidade.</span>
              </h2>
             <p style={{ color: "#B0C4D8", marginTop: 20, fontSize: "clamp(14px, 4vw, 16px)", maxWidth: "400px" }}>
               Proteja seu patrimônio com a tecnologia de quem é líder no RN.
             </p>
             <button 
               onClick={() => { sendTrack({ detalhesExtra: "Clicou Contato Final" }); window.open("https://wa.me/5584981878563"); }}
               style={{ ...ctaButtonStyle, width: "100%", maxWidth: "350px", padding: "16px 20px" }}>
               Falar com Consultor SEGCOMP
             </button>
             
             <div style={{ marginTop: 60, fontSize: 13, color: "#7A9BB5", lineHeight: 1.8 }}>
               <strong>SEGCOMP - Grupo ECOMP</strong><br/>
               www.grupoecomp.com.br<br/>
               (84) 98187-8563<br/>
               Natal / RN
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}

// === COMPONENTES E ESTILOS AUXILIARES ===

function PageHeader({ num }: { num: string }) {
  return (
    <div style={{ padding: "20px 50px", borderBottom: "3px solid #00e5e5", display: "flex", justifyContent: "space-between", background: "#0f172a" }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: "#00e5e5", letterSpacing: 2 }}>SEGCOMP</span>
      <span style={{ fontSize: 12, color: "#7A9BB5", fontWeight: 600 }}>PÁG. {num} / 13</span>
    </div>
  );
}

function PageFooter() {
  return <div style={{ padding: "15px 50px", borderTop: "1px solid #1e293b", fontSize: 11, color: "#475569" }}>www.grupoecomp.com.br</div>;
}

function StatBox({ num, label }: { num: string; label: string }) {
  return (
    <div style={{ background: "#132338", borderRadius: 12, padding: 20, textAlign: "center", borderBottom: "3px solid #00e5e5" }}>
      <div style={{ fontSize: 42, fontWeight: 900, color: "#00e5e5", lineHeight: 1 }}>{num}</div>
      <div style={{ fontSize: 11, color: "#B0C4D8", textTransform: "uppercase", letterSpacing: 1, marginTop: 6 }}>{label}</div>
    </div>
  );
}

function TipBox({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(0,229,229,0.1)", border: "1px solid rgba(0,229,229,0.3)", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 14, marginTop: 15 }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <p style={{ fontSize: 14, color: "#b8e8e0", lineHeight: 1.6 }}>{text}</p>
    </div>
  );
}

function WarnBox({ icon, text }: { icon: string; text: React.ReactNode }) {
  return (
    <div style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.3)", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 14, marginTop: 15 }}>
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

const navStyle: React.CSSProperties = { position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, background: "#0f172a", padding: "10px 20px", display: "flex", alignItems: "center", gap: 16, borderBottom: "1px solid #1e293b" };
const progressContainerStyle: React.CSSProperties = { flex: 1, background: "#1e293b", borderRadius: 10, height: 6, overflow: "hidden" };
const progressBarStyle: React.CSSProperties = { height: "100%", background: "#00e5e5", transition: "width 0.5s ease" };
const pageStyle = (type?: string): React.CSSProperties => ({ width: "100%", maxWidth: 794, minHeight: 1123, background: "#0f172a", color: "#fff", display: "flex", flexDirection: "column", position: "relative", borderBottom: "4px solid #0a1128", justifyContent: type === "capa" ? "center" : "flex-start" });
const bodyStyle: React.CSSProperties = { 
  flex: 1, 
  padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 50px)", // Se adapta à tela
  display: "flex", 
  flexDirection: "column", 
  gap: 20 
};
const titleStyle: React.CSSProperties = { 
  fontSize: "clamp(24px, 6vw, 32px)", // Isso faz a fonte diminuir no celular
  fontWeight: 900, 
  lineHeight: 1.1 
};
const introStyle: React.CSSProperties = { fontSize: 16, color: "#B0C4D8", lineHeight: 1.7, borderLeft: "3px solid #00e5e5", paddingLeft: 18 };
const textStyle: React.CSSProperties = { fontSize: 15, color: "#cbd5e1", lineHeight: 1.6 };
const tagStyle: React.CSSProperties = { display: "inline-block", color: "#00e5e5", fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 };
const badgeStyle: React.CSSProperties = { display: "inline-block", background: "#00e5e5", color: "#0f172a", fontSize: 11, fontWeight: 800, padding: "6px 16px", borderRadius: 20, marginBottom: 15 };
const ctaButtonStyle: React.CSSProperties = { background: "#00e5e5", color: "#0f172a", border: "none", borderRadius: 12, padding: "18px 40px", fontSize: 16, fontWeight: 800, cursor: "pointer", marginTop: 30, boxShadow: "0 10px 20px #00e5e533" };
const capaImgStyle: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: "100%", height: "65%", objectFit: "cover" };
const capaOverlayStyle: React.CSSProperties = { position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, #0f172a 50%, transparent)" };
const capaContentStyle: React.CSSProperties = { position: "relative", zIndex: 2, textAlign: "center", padding: 60, marginTop: "auto" };
const capaTitleStyle: React.CSSProperties = { 
  fontSize: "clamp(36px, 8vw, 52px)", // Fonte diminui no celular
  fontWeight: 900, 
  lineHeight: 1.1, 
  margin: "16px 0" 
};
const dotStyle: React.CSSProperties = {
  width: 28, height: 28, background: "#00e5e5", borderRadius: "50%", display: "flex",
  alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#0a1128", flexShrink: 0, marginTop: 2
};