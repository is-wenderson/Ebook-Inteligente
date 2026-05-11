"use client";
import { useState } from 'react';

interface GatekeeperProps {
  onAccessGranted: (data: { nome: string; cargo: string; condominio: string; whatsapp: string }) => void;
}

export default function Gatekeeper({ onAccessGranted }: GatekeeperProps) {
  const [form, setForm] = useState({ nome: '', cargo: '', condominio: '', whatsapp: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.whatsapp.length < 10) {
      alert("⚠️ Por favor, insira um WhatsApp válido com DDD.");
      return;
    }
    onAccessGranted(form);
  };

  return (
    <div className="fixed inset-0 bg-[#0a1128] z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#0f172a] rounded-3xl p-8 border border-slate-800 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-[#00e5e5] font-black italic text-xl uppercase tracking-widest">Acesso Exclusivo</h2>
          <p className="text-slate-400 text-sm mt-2 italic">Identifique-se para liberar o Guia de Estratégias de Elite.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input required type="text" placeholder="Seu nome" className="w-full p-4 rounded-xl bg-[#0a1128] border border-slate-700 text-white focus:border-[#00e5e5] outline-none" 
            onChange={e => setForm({...form, nome: e.target.value})} />
          
          <select required className="w-full p-4 rounded-xl bg-[#0a1128] border border-slate-700 text-slate-400 focus:border-[#00e5e5] outline-none"
            onChange={e => setForm({...form, cargo: e.target.value})}>
            <option value="" disabled selected>Seu cargo</option>
            <option value="Síndico">Síndico(a)</option>
            <option value="Zelador">Zelador / Gerente</option>
            <option value="Conselheiro">Conselheiro</option>
          </select>

          <input required type="text" placeholder="Nome do Condomínio" className="w-full p-4 rounded-xl bg-[#0a1128] border border-slate-700 text-white focus:border-[#00e5e5] outline-none"
            onChange={e => setForm({...form, condominio: e.target.value})} />

          <input required type="tel" placeholder="WhatsApp (DDD + Número)" className="w-full p-4 rounded-xl bg-[#0a1128] border border-slate-700 text-white focus:border-[#00e5e5] outline-none"
            onInput={(e: any) => e.target.value = e.target.value.replace(/\D/g, '')}
            onChange={(e: any) => setForm({...form, whatsapp: e.target.value})} />

          <button type="submit" className="w-full bg-[#00e5e5] text-[#0a1128] font-black py-4 rounded-2xl uppercase hover:scale-[1.02] transition-transform shadow-lg">
            Liberar Acesso ao Guia
          </button>
        </form>
      </div>
    </div>
  );
}