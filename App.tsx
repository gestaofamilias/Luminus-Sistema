
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import { Page, LeadStatus, FinanceTransaction, CRMItem, Project, Client } from './types';
import { supabase } from './services/supabaseClient';

const storage = {
  getUser: () => {
    try {
      const user = localStorage.getItem('luminus_user');
      return user ? JSON.parse(user) : null;
    } catch (e) { return null; }
  },
  setUser: (user: any) => {
    localStorage.setItem('luminus_user', JSON.stringify(user));
  }
};

const LuminusIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"/>
    <circle cx="50" cy="50" r="18" fill="currentColor"/>
    <path d="M50 32C40 32 32 40 32 50C32 60 40 68 50 68" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const App: React.FC = () => {
  const [session, setSession] = useState<any>(storage.getUser());
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);
  const [showAI, setShowAI] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // DADOS
  const [crmItems, setCrmItems] = useState<CRMItem[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // MODAIS
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinanceTransaction | null>(null);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // FETCH INICIAL DO SUPABASE
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [
          { data: leads },
          { data: trans },
          { data: projs },
          { data: clis }
        ] = await Promise.all([
          supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
          supabase.from('finance_transactions').select('*').order('date', { ascending: false }),
          supabase.from('projects').select('*').order('start_date', { ascending: false }),
          supabase.from('clients').select('*').order('company', { ascending: true })
        ]);

        // Mapeamento simples de snake_case para camelCase se necessário, ou uso direto
        if (leads) setCrmItems(leads.map(l => ({ ...l, expectedCloseDate: l.expected_close_date, createdAt: l.created_at })));
        if (trans) setTransactions(trans.map(t => ({ ...t, clientId: t.client_id })));
        if (projs) setProjects(projs.map(p => ({ ...p, startDate: p.start_date, dueDate: p.due_date, clientEmail: p.client_email, clientId: p.client_id })));
        if (clis) setClients(clis.map(c => ({ ...c, billingType: c.billing_type, totalInvested: c.total_invested, activeProjects: c.active_projects })));
      } catch (error) {
        console.error("Erro ao carregar dados do Supabase:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (session) loadData();
  }, [session]);

  // --- FUNÇÕES DE EXECUÇÃO COM SUPABASE ---

  const executeCreateClient = async (data: Partial<Client>) => {
    const payload = { 
      id: `cl-${Date.now()}`,
      name: data.name || 'Novo Responsável',
      company: data.company || 'Nova Empresa',
      email: data.email || '',
      phone: data.phone || '',
      billing_type: data.billingType || 'monthly',
      total_invested: 0,
      active_projects: 0,
      status: 'active'
    };

    const { error } = await supabase.from('clients').insert([payload]);
    if (!error) {
      const nc = { ...payload, billingType: payload.billing_type, totalInvested: 0, activeProjects: 0 } as Client;
      setClients(prev => [nc, ...prev]);
      return nc;
    }
    return null;
  };

  const executeCreateTransaction = async (data: Partial<FinanceTransaction>) => {
    const payload = {
      id: `tr-${Date.now()}`,
      description: data.description || 'Lançamento Manual',
      amount: data.amount || 0,
      type: data.type || 'income',
      date: data.date || new Date().toISOString().split('T')[0],
      status: 'paid',
      client_id: data.clientId
    };

    const { error } = await supabase.from('finance_transactions').insert([payload]);
    if (!error) {
      const nt = { ...payload, clientId: payload.client_id } as FinanceTransaction;
      setTransactions(prev => [nt, ...prev]);
      return nt;
    }
    return null;
  };

  const executeUpdateTransaction = async (id: string, data: Partial<FinanceTransaction>) => {
    const payload = {
      description: data.description,
      amount: data.amount,
      type: data.type,
      date: data.date,
      client_id: data.clientId
    };

    const { error } = await supabase.from('finance_transactions').update(payload).eq('id', id);
    if (!error) {
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
    }
  };

  const executeDeleteTransaction = async (id: string) => {
    if (window.confirm('Confirmar exclusão deste lançamento?')) {
      const { error } = await supabase.from('finance_transactions').delete().eq('id', id);
      if (!error) {
        setTransactions(prev => prev.filter(t => t.id !== id));
      }
    }
  };

  const executeCreateProject = async (data: Partial<Project>) => {
    const client = clients.find(c => c.id === data.clientId || c.company.toLowerCase() === data.client?.toLowerCase());
    
    const payload = {
      id: `pj-${Date.now()}`,
      name: data.name || 'Novo Workflow',
      client: client?.company || data.client || 'Geral',
      client_email: client?.email || '',
      progress: 0,
      status: 'active',
      start_date: new Date().toISOString().split('T')[0],
      due_date: data.dueDate || '',
      service_type: data.serviceType || 'Marketing',
      budget: data.budget || 0,
      priority: 'medium',
      tasks: [],
      client_id: client?.id || data.clientId
    };

    const { error } = await supabase.from('projects').insert([payload]);
    if (!error) {
      const np = { ...payload, startDate: payload.start_date, dueDate: payload.due_date, clientEmail: payload.client_email, clientId: payload.client_id, serviceType: payload.service_type } as unknown as Project;
      setProjects(prev => [np, ...prev]);
      
      executeCreateTransaction({
        description: `Início Projeto: ${np.name} (${np.client})`,
        amount: np.budget,
        type: 'income',
        clientId: np.clientId
      });

      if (np.clientId) {
        const currentActive = client?.activeProjects || 0;
        await supabase.from('clients').update({ active_projects: currentActive + 1 }).eq('id', np.clientId);
        setClients(prev => prev.map(c => c.id === np.clientId ? { ...c, activeProjects: c.activeProjects + 1 } : c));
      }
      return np;
    }
    return null;
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const nl = {
      id: `lead-${Date.now()}`,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      source: (formData.get('source') as any) || 'ads',
      service: formData.get('service') as string,
      status: LeadStatus.NEW,
      value: parseFloat(formData.get('value') as string) || 0,
      expected_close_date: formData.get('expectedCloseDate') as string,
      notes: formData.get('notes') as string
    };
    
    const { error } = await supabase.from('crm_leads').insert([nl]);
    if (!error) {
      setCrmItems(prev => [{ ...nl, expectedCloseDate: nl.expected_close_date, createdAt: new Date().toISOString() } as unknown as CRMItem, ...prev]);
      setIsLeadModalOpen(false);
    }
  };

  const updateLeadStatus = async (id: string, status: LeadStatus) => {
    const { error } = await supabase.from('crm_leads').update({ status }).eq('id', id);
    if (!error) {
      setCrmItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      if (status === LeadStatus.CLOSED) {
          const lead = crmItems.find(l => l.id === id);
          if (lead) executeCreateClient({ company: lead.company, name: lead.name, email: lead.email, phone: lead.phone });
      }
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = { user: 'admin', name: 'Admin Luminus' };
    setSession(u);
    storage.setUser(u);
  };

  // --- RENDERS E CALCULOS ---
  const financeSummary = useMemo(() => {
    const current = transactions.filter(t => t.date && t.date.startsWith(filterMonth));
    const inc = current.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = current.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions, filterMonth]);

  const crmSummary = useMemo(() => {
    const totalValue = crmItems.reduce((acc, item) => acc + item.value, 0);
    const closedCount = crmItems.filter(i => i.status === LeadStatus.CLOSED).length;
    return { totalValue, closedCount, leadsCount: crmItems.length };
  }, [crmItems]);

  if (!session) return (
    <div className="fixed inset-0 z-[99999] flex bg-dark-bg animate-fadeIn">
        <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-sidebar-dark border-r border-white/5">
          <img src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale" alt="Marketing" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-dark-bg/90"></div>
          <div className="relative z-10 flex flex-col justify-center px-24 space-y-10">
            <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl"><LuminusIcon className="w-14 h-14 text-white" /></div>
            <div className="space-y-4">
              <h2 className="text-7xl font-black text-white leading-tight tracking-tighter">Hub Luminus <br/><span className="text-primary-light">Marketing</span> Admin.</h2>
              <p className="text-zinc-400 text-xl font-medium max-w-lg">A plataforma inteligente para gestão de agências sincronizada via Supabase.</p>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-2/5 flex flex-col justify-center items-center px-8 lg:px-24 bg-dark-bg">
          <form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
            <h1 className="text-4xl font-black text-white mb-8">Login Corporativo</h1>
            <input required type="email" placeholder="email@luminus.com" className="w-full bg-white/[0.03] border border-white/10 p-6 rounded-[22px] text-white outline-none focus:border-primary" />
            <input required type="password" placeholder="••••••••" className="w-full bg-white/[0.03] border border-white/10 p-6 rounded-[22px] text-white outline-none focus:border-primary" />
            <button type="submit" className="w-full bg-primary py-7 rounded-[22px] font-black uppercase text-xs tracking-[4px] text-white shadow-2xl shadow-primary/30">Acessar Hub Cloud</button>
          </form>
        </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-bg text-slate-100 selection:bg-primary/40 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onSignOut={() => { setSession(null); storage.setUser(null); }} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-24 glass-panel border-b border-white/5 flex items-center justify-between px-12 z-[60] sticky top-0 shadow-2xl">
          <div className="flex items-center gap-5 cursor-pointer" onClick={() => setCurrentPage(Page.DASHBOARD)}>
            <div className="w-12 h-12 bg-primary/20 rounded-[18px] flex items-center justify-center text-primary border border-primary/20"><LuminusIcon className="w-7 h-7" /></div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[5px]">Luminus Cloud</h2>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[2px] mt-0.5">Base de Dados Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isLoading && <span className="text-[10px] font-black text-primary animate-pulse uppercase tracking-widest">Sincronizando...</span>}
            <button onClick={() => setShowAI(!showAI)} className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showAI ? 'bg-primary text-white' : 'bg-white/5 text-zinc-400'}`}>
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              {showAI ? 'Fechar IA' : 'Assistente IA'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 overflow-y-auto p-12 custom-scrollbar transition-all duration-500 ${showAI ? 'mr-0 lg:mr-[400px]' : ''}`}>
            <div className="max-w-7xl mx-auto pb-32">
              
              {currentPage === Page.DASHBOARD && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="relative h-72 rounded-[48px] overflow-hidden group border border-white/5 shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover grayscale-[30%]" alt="Hero" />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-center px-16 space-y-3">
                      <span className="text-primary-light font-black uppercase tracking-[6px] text-xs">Agência Luminus</span>
                      <h1 className="text-5xl font-black text-white tracking-tighter leading-[1.1]">Hub de Marketing <br/><span className="text-primary-light">Realtime Persistence</span></h1>
                      <p className="text-zinc-400 text-base max-w-lg font-medium leading-relaxed">Operando em nuvem com sincronização direta no banco de dados.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Partners Ativos', val: clients.length, icon: 'group', color: 'text-indigo-400' },
                      { label: 'Pipeline CRM', val: `R$ ${crmSummary.totalValue.toLocaleString('pt-BR')}`, icon: 'hub', color: 'text-rose-400' },
                      { label: 'LTV Revenue', val: `R$ ${transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toLocaleString('pt-BR')}`, icon: 'trending_up', color: 'text-emerald-400' },
                      { label: 'Saldo Hub', val: `R$ ${financeSummary.balance.toLocaleString('pt-BR')}`, icon: 'account_balance_wallet', color: 'text-white' },
                    ].map((stat, i) => (
                      <div key={i} className="glass-panel p-8 rounded-[40px] flex flex-col justify-between h-44">
                        <div className={`w-14 h-14 rounded-[22px] bg-white/5 flex items-center justify-center ${stat.color} mb-4 border border-white/5`}><span className="material-symbols-outlined text-3xl">{stat.icon}</span></div>
                        <div>
                          <p className="text-2xl lg:text-3xl font-black text-white leading-none mb-1">{stat.val}</p>
                          <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-[2px]">{stat.label}</h3>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPage === Page.CRM && (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <div><h1 className="text-4xl font-black text-white tracking-tighter">Oportunidades de Venda</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Gestão de leads via Supabase.</p></div>
                      <button onClick={() => setIsLeadModalOpen(true)} className="px-8 py-4.5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">add_reaction</span> Nova Oportunidade</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {Object.values(LeadStatus).map((status) => (
                        <div key={status} className="space-y-6">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">{status}</h3>
                          <div className="space-y-4 min-h-[400px] p-4 bg-white/[0.02] rounded-[32px] border border-white/5">
                            {crmItems.filter(i => i.status === status).map(lead => (
                              <div key={lead.id} className="glass-panel p-6 rounded-[24px] border-white/5">
                                 <h4 className="font-black text-white text-sm mb-4">{lead.company}</h4>
                                 <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                    <p className="text-[10px] text-emerald-400 font-black">R$ {lead.value.toLocaleString('pt-BR')}</p>
                                    <div className="flex gap-2">
                                       <button onClick={() => updateLeadStatus(lead.id, LeadStatus.CLOSED)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><span className="material-symbols-outlined text-sm">check</span></button>
                                       <button onClick={() => updateLeadStatus(lead.id, LeadStatus.LOST)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"><span className="material-symbols-outlined text-sm">close</span></button>
                                    </div>
                                 </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {currentPage === Page.FINANCE && (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <div><h1 className="text-4xl font-black text-white tracking-tighter">Finance Cloud</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Entradas sincronizadas no Supabase.</p></div>
                      <div className="flex gap-4">
                        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-white outline-none" />
                        <button onClick={() => { setEditingTransaction(null); setIsFinanceModalOpen(true); }} className="px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg">add_card</span> Novo Lançamento
                        </button>
                      </div>
                    </div>
                    <div className="glass-panel rounded-[48px] overflow-hidden border border-white/5">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-white/[0.02]">
                            <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descrição</th>
                            <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Valor</th>
                            <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {transactions.filter(t => t.date && t.date.startsWith(filterMonth)).map(t => (
                            <tr key={t.id} className="hover:bg-white/[0.01] group">
                              <td className="px-8 py-6">
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                  <span className={`material-symbols-outlined text-xs ${t.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {t.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
                                  </span>
                                  {t.description}
                                </p>
                                <p className="text-[10px] text-zinc-600 pl-6">{t.date}</p>
                              </td>
                              <td className={`px-8 py-6 text-right font-black text-sm ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingTransaction(t); setIsFinanceModalOpen(true); }} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                  </button>
                                  <button onClick={() => executeDeleteTransaction(t.id)} className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              )}

              {currentPage === Page.CLIENTS && (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <div><h1 className="text-4xl font-black text-white tracking-tighter">Partners Database</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Clientes cadastrados na nuvem.</p></div>
                      <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-4.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">person_add</span> Novo Parceiro</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {clients.map(c => (
                        <div key={c.id} className="glass-panel p-10 rounded-[48px] border border-white/5 flex flex-col justify-between h-[380px]">
                          <div className="space-y-6">
                            <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary-light font-black text-2xl border border-primary/20">{c.company.charAt(0)}</div>
                              <div>
                                <h3 className="font-black text-white text-xl leading-none">{c.company}</h3>
                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2 font-bold">{c.name}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                              <div><p className="text-[9px] text-zinc-600 font-bold uppercase">Projetos</p><p className="text-lg font-black text-white">{c.activeProjects}</p></div>
                              <div><p className="text-[9px] text-zinc-600 font-bold uppercase">LTV</p><p className="text-lg font-black text-emerald-400">R$ {c.totalInvested.toLocaleString('pt-BR')}</p></div>
                            </div>
                          </div>
                          <button onClick={() => setViewingClient(c)} className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Acessar Perfil Completo</button>
                        </div>
                      ))}
                    </div>
                 </div>
              )}

              {currentPage === Page.PROJECTS && (
                 <div className="space-y-10 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <div><h1 className="text-4xl font-black text-white tracking-tighter">Workflow Sync</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Projetos ativos com persistência em nuvem.</p></div>
                      <button onClick={() => setIsProjectModalOpen(true)} className="px-8 py-4.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">rocket_launch</span> Iniciar Workflow</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      {projects.map(p => (
                        <div key={p.id} className="glass-panel p-10 rounded-[48px] border border-white/5">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-2xl font-black text-white mb-2">{p.name}</h3>
                              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{p.client}</p>
                            </div>
                            <span className="px-4 py-2 bg-primary/10 text-primary-light text-[9px] font-black uppercase rounded-lg border border-primary/20">{p.serviceType}</span>
                          </div>
                          <div className="space-y-3">
                            <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                              <span>Progresso Digital</span>
                              <span>{p.progress}%</span>
                            </div>
                            <div className="h-3 w-full bg-white/5 rounded-full p-[2px] border border-white/5">
                              <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }}></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>

          {showAI && (
            <div className="hidden lg:block w-[400px] border-l border-white/5 bg-sidebar-dark z-[100] h-[calc(100vh-6rem)] fixed right-0 top-24">
              <AIAssistant onAction={{ cadastrar_cliente: executeCreateClient, abrir_projeto: executeCreateProject, registrar_financeiro: executeCreateTransaction }} />
            </div>
          )}
        </div>

        {/* MODAIS DE GERENCIAMENTO */}
        
        {/* Modal Financeiro (Unificado para criar/editar) */}
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-xl border border-white/10 shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">
                {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento Cloud'}
              </h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                const payload: Partial<FinanceTransaction> = {
                  description: formData.get('description') as string,
                  amount: parseFloat(formData.get('amount') as string),
                  type: formData.get('type') as any,
                  date: formData.get('date') as string,
                  clientId: formData.get('clientId') as string || undefined
                };

                if (editingTransaction) {
                  await executeUpdateTransaction(editingTransaction.id, payload);
                } else {
                  await executeCreateTransaction(payload);
                }
                
                setIsFinanceModalOpen(false);
                setEditingTransaction(null);
              }} className="space-y-6">
                <input required name="description" defaultValue={editingTransaction?.description || ''} placeholder="Descrição da Transação" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary transition-all" />
                <input required name="amount" type="number" step="0.01" defaultValue={editingTransaction?.amount || ''} placeholder="Valor R$" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary transition-all" />
                <input required name="date" type="date" defaultValue={editingTransaction?.date || new Date().toISOString().split('T')[0]} className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary transition-all" />
                <select name="type" defaultValue={editingTransaction?.type || 'income'} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary">
                  <option value="income" className="bg-dark-bg text-white">Entrada (+)</option>
                  <option value="expense" className="bg-dark-bg text-white">Saída (-)</option>
                </select>
                <select name="clientId" defaultValue={editingTransaction?.clientId || ''} className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary">
                  <option value="" className="bg-dark-bg text-white">Vincular a Partner (Opcional)</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-dark-bg text-white">{c.company}</option>)}
                </select>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsFinanceModalOpen(false); setEditingTransaction(null); }} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-5 rounded-2xl font-black uppercase text-xs text-white shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
                    {editingTransaction ? 'Atualizar Dados' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal CRM / Lead */}
        {isLeadModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-xl border border-white/10 shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">Nova Oportunidade Cloud</h2>
              <form onSubmit={handleCreateLead} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input required name="company" placeholder="Empresa" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-rose-500" />
                  <input required name="name" placeholder="Responsável" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-rose-500" />
                </div>
                <input required name="service" placeholder="Serviço Solicitado" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input required name="value" type="number" placeholder="Valor Estimado R$" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsLeadModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5">Fechar</button>
                  <button type="submit" className="flex-[2] bg-rose-500 py-5 rounded-2xl font-black uppercase text-xs text-white shadow-xl shadow-rose-500/20">Registrar Lead</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Cliente */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-xl border border-white/10 shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">Novo Partner Cloud</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                await executeCreateClient({
                  company: formData.get('company') as string,
                  name: formData.get('name') as string,
                  email: formData.get('email') as string,
                  phone: formData.get('phone') as string,
                  billingType: formData.get('billingType') as any
                });
                setIsClientModalOpen(false);
              }} className="space-y-4">
                <input required name="company" placeholder="Nome da Empresa / Marca" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input required name="name" placeholder="Pessoa de Contato" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input required name="email" type="email" placeholder="E-mail Corporativo" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <select name="billingType" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white">
                  <option value="monthly" className="bg-dark-bg">Recorrente Mensal</option>
                  <option value="one_time" className="bg-dark-bg">Projeto Único</option>
                </select>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-5 rounded-2xl font-black uppercase text-xs text-white">Cadastrar Partner</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Projeto */}
        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-xl border border-white/10 shadow-2xl animate-fadeIn">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">Novo Workflow Cloud</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget as HTMLFormElement);
                await executeCreateProject({
                  name: formData.get('name') as string,
                  clientId: formData.get('clientId') as string,
                  serviceType: formData.get('serviceType') as string,
                  budget: parseFloat(formData.get('budget') as string),
                  dueDate: formData.get('dueDate') as string
                });
                setIsProjectModalOpen(false);
              }} className="space-y-4">
                <input required name="name" placeholder="Nome do Projeto / Campanha" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <select required name="clientId" className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white">
                  <option value="" className="bg-dark-bg">Selecionar Cliente...</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-dark-bg">{c.company}</option>)}
                </select>
                <input required name="serviceType" placeholder="Tipo de Serviço (Ex: Ads, Social Media)" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input required name="budget" type="number" placeholder="Budget Alocado R$" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <input required name="dueDate" type="date" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-5 rounded-2xl font-black uppercase text-xs text-white">Iniciar Projeto</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
