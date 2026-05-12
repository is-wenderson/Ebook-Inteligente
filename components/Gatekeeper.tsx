"use client";
import { useState } from 'react';

interface GatekeeperProps {
  onAccessGranted: (data: { nome: string; cargo: string; condominio: string; whatsapp: string }) => void;
}

export default function Gatekeeper({ onAccessGranted }: GatekeeperProps) {
  const [etapa, setEtapa] = useState(1);
  const [form, setForm] = useState({ nome: '', cargo: '', condominio: '', whatsapp: '' });

  const totalEtapas = 4;

  const proximaEtapa = () => {
    if (etapa < totalEtapas) setEtapa(etapa + 1);
    else onAccessGranted(form);
  };

  const voltarEtapa = () => {
    if (etapa > 1) setEtapa(etapa - 1);
  };

  // Máscara para o WhatsApp: (00) 00000-0000
  const formatWhatsApp = (value: string) => {
    const numbers = value.replace(/\D/g, ''); // Remove tudo que não é número
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  // Impede o envio se o campo atual estiver vazio ou incorreto
  const podeProsseguir = () => {
    if (etapa === 1) return form.nome.length > 2;
    if (etapa === 2) return form.cargo !== '';
    if (etapa === 3) return form.condominio.length > 2;
    // Valida se tem exatamente 11 dígitos numéricos
    if (etapa === 4) return form.whatsapp.replace(/\D/g, '').length === 11;
    return false;
  };

  const progresso = Math.round((etapa / totalEtapas) * 100);

  return (
    <div className="fixed inset-0 bg-[#0a1128] z-50 flex flex-col items-center justify-center p-6 text-white font-sans">
      
      {/* Estilos da Animação Glow Pulse */}
      <style jsx>{`
        @keyframes glowPulse {
          0% { box-shadow: 0 0 5px rgba(0, 229, 229, 0.4); transform: scale(1); }
          50% { box-shadow: 0 0 20px rgba(0, 229, 229, 0.7); transform: scale(1.02); }
          100% { box-shadow: 0 0 5px rgba(0, 229, 229, 0.4); transform: scale(1); }
        }
        .animate-glow {
          animation: glowPulse 1.5s infinite ease-in-out;
        }
      `}</style>

      {/* BARRA DE PROGRESSO SUPERIOR */}
      <div className="w-full max-w-xl mb-12">
        <div className="flex justify-between text-[#00e5e5] text-xs font-bold mb-3 uppercase tracking-widest">
          <span>SEGCOMP - Identificação de Segurança</span>
          <span>Etapa {etapa} de {totalEtapas}</span>
        </div>
        <div className="w-full bg-[#1e293b] rounded-full h-1.5">
          <div 
            className="bg-[#00e5e5] h-1.5 rounded-full transition-all duration-500 shadow-[0_0_10px_#00e5e5]" 
            style={{ width: `${progresso}%` }}
          ></div>
        </div>
      </div>

      <div className="w-full max-w-xl bg-[#0f172a] rounded-[40px] p-8 md:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        
        {/* LUZ DE FUNDO DECORATIVA */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00e5e5] opacity-5 blur-[100px]"></div>

        {/* ETAPA 1: NOME */}
        {etapa === 1 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Seja bem-vindo!<br/> Como podemos<span className="text-[#00e5e5]"> te chamar?</span></h2>
            <p className="text-slate-400 mb-8 italic">Iniciando protocolo de acesso ao Guia de Elite...</p>
            <input 
              autoFocus
              type="text" 
              placeholder="Digite seu nome completo" 
              className="w-full bg-transparent border-b-2 border-slate-700 p-4 text-xl outline-none focus:border-[#00e5e5] transition-colors"
              value={form.nome}
              onChange={e => setForm({...form, nome: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && podeProsseguir() && proximaEtapa()}
            />
          </div>
        )}

        {/* ETAPA 2: CARGO (Estilo Botões de Opção) */}
        {etapa === 2 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl md:text-3xl font-black mb-8 leading-tight">Qual a sua <span className="text-[#00e5e5]">função hoje?</span></h2>
            <div className="grid grid-cols-1 gap-4">
              {['Síndico(a)', 'Subsindico (a)', 'Administrador(a)', 'Outros'].map((cargo) => (
                <button
                  key={cargo}
                  onClick={() => { setForm({...form, cargo}); setTimeout(proximaEtapa, 300); }}
                  className={`p-5 rounded-2xl border-2 text-left font-bold transition-all ${form.cargo === cargo ? 'border-[#00e5e5] bg-[#00e5e510] text-[#00e5e5]' : 'border-slate-800 bg-[#132338] hover:border-slate-600'}`}
                >
                  {cargo}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ETAPA 3: CONDOMÍNIO */}
        {etapa === 3 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Para qual <span className="text-[#00e5e5]">Condomínio</span><br/>é este Guia?</h2>
            <p className="text-slate-400 mb-8 italic">Personalizando estratégias para sua unidade...</p>
            <input 
              autoFocus
              type="text" 
              placeholder="Nome do Condomínio" 
              className="w-full bg-transparent border-b-2 border-slate-700 p-4 text-xl outline-none focus:border-[#00e5e5] transition-colors"
              value={form.condominio}
              onChange={e => setForm({...form, condominio: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && podeProsseguir() && proximaEtapa()}
            />
          </div>
        )}

        {/* ETAPA 4: WHATSAPP COM MÁSCARA */}
        {etapa === 4 && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <h2 className="text-2xl md:text-3xl font-black mb-2 leading-tight">Quase pronto! <br/><span className="text-[#00e5e5]">Qual seu WhatsApp?</span></h2>
            <p className="text-slate-400 mb-8 italic">O link oficial também será enviado por aqui.</p>
            <input 
              autoFocus
              type="tel" 
              maxLength={15}
              placeholder="(00) 00000-0000" 
              className="w-full bg-transparent border-b-2 border-slate-700 p-4 text-xl outline-none focus:border-[#00e5e5] transition-colors"
              value={form.whatsapp}
              onChange={e => setForm({...form, whatsapp: formatWhatsApp(e.target.value)})}
              onKeyDown={e => e.key === 'Enter' && podeProsseguir() && proximaEtapa()}
            />
          </div>
        )}

        {/* BOTÕES DE NAVEGAÇÃO */}
        <div className="flex items-center justify-between mt-12">
          {etapa > 1 ? (
            <button onClick={voltarEtapa} className="text-slate-500 hover:text-white font-bold transition-colors">
              ← Voltar
            </button>
          ) : <div></div>}

          {etapa !== 2 && (
            <button 
              disabled={!podeProsseguir()}
              onClick={proximaEtapa}
              className={`px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all duration-300 ${
                podeProsseguir() 
                ? 'bg-[#00e5e5] text-[#0a1128] shadow-lg shadow-[#00e5e530] hover:scale-105 animate-glow' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {etapa === totalEtapas ? 'Liberar Guia Agora' : 'Próximo →'}
            </button>
          )}
        </div>
      </div>

      <p className="mt-8 text-slate-500 text-[10px] uppercase tracking-[4px]">
        <span className="text-[#00e5e5] font-bold">SEGCOMP:</span> Segurança • Inteligência • Tecnologia
      </p>
    </div>
  );
}