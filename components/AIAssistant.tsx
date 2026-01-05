
import React, { useState, useRef, useEffect } from 'react';
import { chatWithAssistant } from '../services/geminiService';

interface AIAssistantProps {
  onAction: {
    cadastrar_cliente: (data: any) => any;
    abrir_projeto: (data: any) => any;
    registrar_financeiro: (data: any) => any;
  };
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onAction }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: 'Hub Luminus Ativo. Como posso ajudar com sua agência hoje? Você pode me contar sobre novos contratos ou pedir para abrir projetos.' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const result = await chatWithAssistant(userMsg, history);
      
      // Fix: Acessando .text e .functionCalls diretamente conforme as novas diretrizes do SDK
      const functionCalls = result.functionCalls;
      let finalResponseText = result.text || '';

      if (functionCalls && functionCalls.length > 0) {
        for (const fc of functionCalls) {
          console.log("Executando ação do sistema:", fc.name, fc.args);
          
          // @ts-ignore
          if (onAction[fc.name]) {
            // @ts-ignore
            onAction[fc.name](fc.args);
            finalResponseText += `\n\n✅ Ação Executada: ${fc.name.replace('_', ' ')}.`;
          }
        }
      }

      setMessages(prev => [...prev, { role: 'model', text: finalResponseText || 'Comando processado com sucesso.' }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: 'Houve um erro técnico ao processar seu pedido.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar-dark overflow-hidden relative border-l border-white/5">
      <div className="p-8 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="material-symbols-outlined text-white text-xl">smart_toy</span>
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest leading-none mb-1">Assistente Cognitivo</h3>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Integrado ao Hub</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-black/20">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] p-5 rounded-[28px] text-sm leading-relaxed whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-primary text-white shadow-xl shadow-primary/10 rounded-tr-none' 
                : 'bg-white/5 text-zinc-300 border border-white/10 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-4 rounded-[20px] rounded-tl-none animate-pulse text-zinc-500 text-[9px] font-black uppercase tracking-widest border border-white/5">
              Sincronizando Módulos...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-8 bg-black/40 border-t border-white/5">
        <div className="flex gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ex: 'Fechei Ads de R$3k com Nike...'"
            className="flex-1 bg-white/[0.03] border border-white/10 rounded-[22px] px-6 py-4 text-sm text-white focus:outline-none focus:border-primary transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className="w-14 h-14 bg-primary rounded-[22px] flex items-center justify-center text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <span className="material-symbols-outlined font-bold">send</span>
          </button>
        </div>
        <p className="text-[8px] text-zinc-600 text-center mt-4 font-bold uppercase tracking-widest">IA pode executar ações reais no sistema.</p>
      </div>
    </div>
  );
};

export default AIAssistant;
