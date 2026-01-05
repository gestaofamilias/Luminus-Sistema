
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AIAssistant from './components/AIAssistant';
import { Page, LeadStatus, FinanceTransaction, CRMItem, Project, Client } from './types';

// Helper de persistência Local
const storage = {
  get: (key: string) => JSON.parse(localStorage.getItem(`luminus_${key}`) || '[]'),
  set: (key: string, data: any) => localStorage.setItem(`luminus_${key}`, JSON.stringify(data)),
  getUser: () => JSON.parse(localStorage.getItem('luminus_user') || 'null'),
  setUser: (user: any) => localStorage.setItem('luminus_user', JSON.stringify(user))
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

  // DADOS
  const [crmItems, setCrmItems] = useState<CRMItem[]>(storage.get('crm'));
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(storage.get('finance'));
  const [projects, setProjects] = useState<Project[]>(storage.get('projects'));
  const [clients, setClients] = useState<Client[]>(storage.get('clients'));

  // ESTADO DE DRAG AND DROP
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  // MODAIS
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  // PERSISTÊNCIA
  useEffect(() => { storage.set('crm', crmItems); }, [crmItems]);
  useEffect(() => { storage.set('finance', transactions); }, [transactions]);
  useEffect(() => { storage.set('projects', projects); }, [projects]);
  useEffect(() => { storage.set('clients', clients); }, [clients]);

  // --- FUNÇÕES DE EXECUÇÃO ---

  const executeCreateClient = (data: Partial<Client>) => {
    const nc: Client = { 
      id: `cl-${Date.now()}`,
      name: data.name || 'Novo Responsável',
      company: data.company || 'Nova Empresa',
      email: data.email || '',
      phone: data.phone || '',
      phone2: data.phone2 || '',
      cnpj: data.cnpj || '',
      cpf: data.cpf || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      website: data.website || '',
      instagram: data.instagram || '',
      billingType: data.billingType || 'monthly',
      totalInvested: 0,
      activeProjects: 0,
      status: 'active'
    };
    setClients(prev => [nc, ...prev]);
    return nc;
  };

  const executeCreateTransaction = (data: Partial<FinanceTransaction>) => {
    const nt: FinanceTransaction = {
      id: `tr-${Date.now()}`,
      description: data.description || 'Lançamento IA',
      amount: data.amount || 0,
      type: data.type || 'income',
      date: data.date || new Date().toISOString().split('T')[0],
      status: 'paid',
      clientId: data.clientId
    };
    setTransactions(prev => [nt, ...prev]);
    return nt;
  };

  const executeCreateProject = (data: Partial<Project>) => {
    const client = clients.find(c => c.id === data.clientId || c.company.toLowerCase() === data.client?.toLowerCase());
    
    const np: Project = {
      id: `pj-${Date.now()}`,
      name: data.name || 'Novo Workflow',
      client: client?.company || data.client || 'Geral',
      clientEmail: client?.email || '',
      progress: 0,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || '',
      serviceType: data.serviceType || 'Marketing',
      budget: data.budget || 0,
      priority: 'medium',
      tasks: [],
      clientId: client?.id || data.clientId
    };

    setProjects(prev => [np, ...prev]);

    executeCreateTransaction({
      description: `Início Projeto: ${np.name} (${np.client})`,
      amount: np.budget,
      type: 'income',
      clientId: np.clientId
    });

    if (np.clientId) {
      setClients(prev => prev.map(c => c.id === np.clientId ? { ...c, activeProjects: c.activeProjects + 1 } : c));
    }
    return np;
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    executeCreateClient({
      company: formData.get('company') as string,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      phone2: formData.get('phone2') as string,
      cnpj: formData.get('cnpj') as string,
      cpf: formData.get('cpf') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      website: formData.get('website') as string,
      instagram: formData.get('instagram') as string,
      billingType: formData.get('billingType') as any
    });
    setIsClientModalOpen(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    executeCreateProject({
      name: formData.get('name') as string,
      clientId: formData.get('clientId') as string || undefined,
      client: formData.get('newClientName') as string || undefined,
      budget: parseFloat(formData.get('budget') as string) || 0,
      dueDate: formData.get('dueDate') as string,
      serviceType: formData.get('serviceType') as string
    });
    setIsProjectModalOpen(false);
  };

  const handleCreateFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    executeCreateTransaction({
      description: formData.get('description') as string,
      amount: parseFloat(formData.get('amount') as string),
      type: formData.get('type') as any,
      date: formData.get('date') as string,
      clientId: formData.get('clientId') as string || undefined,
    });
    setIsFinanceModalOpen(false);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const nl: CRMItem = {
      id: `lead-${Date.now()}`,
      name: formData.get('name') as string,
      company: formData.get('company') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      source: formData.get('source') as any,
      service: formData.get('service') as string,
      status: LeadStatus.NEW,
      value: parseFloat(formData.get('value') as string),
      expectedCloseDate: formData.get('expectedCloseDate') as string,
      createdAt: new Date().toISOString(),
      notes: formData.get('notes') as string
    };
    setCrmItems(prev => [nl, ...prev]);
    setIsLeadModalOpen(false);
  };

  const updateLeadStatus = (id: string, status: LeadStatus) => {
    setCrmItems(prev => prev.map(item => item.id === id ? { ...item, status } : item));
    
    // Se fechar o lead, sugere virar cliente
    if (status === LeadStatus.CLOSED) {
        const lead = crmItems.find(l => l.id === id);
        if (lead) {
            executeCreateClient({
                company: lead.company,
                name: lead.name,
                email: lead.email,
                phone: lead.phone
            });
        }
    }
  };

  // HANDLERS DRAG AND DROP
  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setIsDraggingOver(status);
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    setIsDraggingOver(null);
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      updateLeadStatus(leadId, status);
    }
  };

  const financeSummary = useMemo(() => {
    const current = transactions.filter(t => t.date.startsWith(filterMonth));
    const inc = current.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const exp = current.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions, filterMonth]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = { user: 'admin', name: 'Admin Luminus' };
    setSession(u);
    storage.setUser(u);
  };

  const crmSummary = useMemo(() => {
    const totalValue = crmItems.reduce((acc, item) => acc + item.value, 0);
    const closedCount = crmItems.filter(i => i.status === LeadStatus.CLOSED).length;
    return { totalValue, closedCount, leadsCount: crmItems.length };
  }, [crmItems]);

  return (
    <div className="flex h-screen bg-dark-bg text-slate-100 selection:bg-primary/40 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onSignOut={() => { setSession(null); storage.setUser(null); }} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-24 glass-panel border-b border-white/5 flex items-center justify-between px-12 z-[60] sticky top-0 shadow-2xl">
          <div className="flex items-center gap-5 group cursor-pointer" onClick={() => setCurrentPage(Page.DASHBOARD)}>
            <div className="w-12 h-12 bg-primary/20 rounded-[18px] flex items-center justify-center text-primary transition-all group-hover:bg-primary group-hover:text-white group-hover:scale-110 shadow-lg border border-primary/20"><LuminusIcon className="w-7 h-7" /></div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-[5px]">Luminus Marketing</h2>
              <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[2px] mt-0.5">Gestão Integrada com IA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowAI(!showAI)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${showAI ? 'bg-primary text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              <span className="material-symbols-outlined text-lg">smart_toy</span>
              {showAI ? 'Fechar Assistente' : 'Assistente IA'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className={`flex-1 overflow-y-auto p-12 custom-scrollbar transition-all duration-500 ${showAI ? 'mr-0 lg:mr-[400px]' : ''}`}>
            <div className="max-w-7xl mx-auto pb-32">
              {currentPage === Page.DASHBOARD && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="relative h-72 rounded-[48px] overflow-hidden group border border-white/5 shadow-2xl">
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover grayscale-[30%] group-hover:scale-105 transition-transform duration-[15s]" alt="Hero" />
                    <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-transparent"></div>
                    <div className="absolute inset-0 flex flex-col justify-center px-16 space-y-3">
                      <span className="text-primary-light font-black uppercase tracking-[6px] text-xs">Agência Luminus</span>
                      <h1 className="text-5xl font-black text-white tracking-tighter leading-[1.1]">Hub de Marketing <br/><span className="text-primary-light">Performance & Branding</span></h1>
                      <p className="text-zinc-400 text-base max-w-lg font-medium leading-relaxed">Sua agência operando com inteligência artificial e processos integrados.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { label: 'Partners Ativos', val: clients.length, icon: 'group', color: 'text-indigo-400' },
                      { label: 'Pipeline CRM', val: `R$ ${crmSummary.totalValue.toLocaleString('pt-BR')}`, icon: 'hub', color: 'text-rose-400' },
                      { label: 'LTV Revenue', val: `R$ ${transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toLocaleString('pt-BR')}`, icon: 'trending_up', color: 'text-emerald-400' },
                      { label: 'Saldo Hub', val: `R$ ${financeSummary.balance.toLocaleString('pt-BR')}`, icon: 'account_balance_wallet', color: 'text-white' },
                    ].map((stat, i) => (
                      <div key={i} className="glass-panel p-8 rounded-[40px] inner-glow flex flex-col justify-between h-44">
                        <div className={`w-14 h-14 rounded-[22px] bg-white/5 flex items-center justify-center ${stat.color} mb-4 border border-white/5 shadow-inner`}><span className="material-symbols-outlined text-3xl">{stat.icon}</span></div>
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
                    <div>
                      <h1 className="text-4xl font-black text-white tracking-tighter">Oportunidades de Venda</h1>
                      <p className="text-zinc-500 mt-1 font-medium text-sm">Gestão de leads e pipeline de fechamento.</p>
                    </div>
                    <button onClick={() => setIsLeadModalOpen(true)} className="px-8 py-4.5 bg-rose-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all hover:bg-rose-600"><span className="material-symbols-outlined text-lg">add_reaction</span> Nova Oportunidade</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-8 rounded-[40px] border-rose-500/20 bg-rose-500/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Valor em Negociação</p>
                      <p className="text-3xl font-black text-rose-400">R$ {crmSummary.totalValue.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] border-indigo-500/20 bg-indigo-500/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Total de Leads</p>
                      <p className="text-3xl font-black text-indigo-400">{crmSummary.leadsCount} Leads</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Conversões</p>
                      <p className="text-3xl font-black text-emerald-400">{crmSummary.closedCount} Fechados</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {Object.values(LeadStatus).map((status) => (
                      <div key={status} className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{status}</h3>
                          <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-black text-zinc-400">{crmItems.filter(i => i.status === status).length}</span>
                        </div>
                        <div 
                          onDragOver={(e) => handleDragOver(e, status)}
                          onDrop={(e) => handleDrop(e, status)}
                          onDragLeave={() => setIsDraggingOver(null)}
                          className={`space-y-4 min-h-[400px] p-4 bg-white/[0.02] rounded-[32px] border transition-all duration-300 ${isDraggingOver === status ? 'border-primary/50 bg-primary/5 shadow-inner' : 'border-white/5'}`}
                        >
                          {crmItems.filter(i => i.status === status).map(lead => (
                            <div 
                              key={lead.id} 
                              draggable="true"
                              onDragStart={(e) => handleDragStart(e, lead.id)}
                              className="glass-panel p-6 rounded-[24px] border-white/5 hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-xl"
                            >
                               <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-black text-white text-sm leading-tight">{lead.company}</h4>
                                  <span className="text-[10px] font-black text-emerald-400 tracking-tighter">R$ {lead.value.toLocaleString('pt-BR')}</span>
                               </div>
                               <p className="text-[10px] text-zinc-500 font-bold uppercase mb-4">{lead.service}</p>
                               <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                  <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{lead.name}</p>
                                  <div className="flex gap-2">
                                     <button onClick={() => updateLeadStatus(lead.id, LeadStatus.LOST)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all"><span className="material-symbols-outlined text-sm">close</span></button>
                                     <button onClick={() => updateLeadStatus(lead.id, LeadStatus.CLOSED)} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-all"><span className="material-symbols-outlined text-sm">check</span></button>
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

              {currentPage === Page.CLIENTS && (
                <div className="space-y-10 animate-fadeIn">
                   <div className="flex justify-between items-center">
                    <div><h1 className="text-4xl font-black text-white tracking-tighter">Market Share</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Empresas parceiras sob gestão integrada.</p></div>
                    <button onClick={() => setIsClientModalOpen(true)} className="px-8 py-4.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">person_add</span> Novo Parceiro</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {clients.map(c => (
                      <div key={c.id} className="glass-panel p-10 rounded-[48px] border border-white/5 hover:border-primary/40 transition-all group flex flex-col justify-between h-[400px]">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary-light font-black text-2xl border border-primary/20">{c.company.charAt(0)}</div>
                          <div>
                            <h3 className="font-black text-white text-xl leading-none mb-1">{c.company}</h3>
                            <p className="text-xs text-zinc-500 font-bold uppercase">{c.name}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                          <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px] mb-2">Billing</p><p className="text-emerald-400 font-black text-sm uppercase">{c.billingType === 'monthly' ? 'Recorrente' : 'Job Único'}</p></div>
                          <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-[2px] mb-2">Projetos</p><p className="text-white font-black text-sm">{c.activeProjects} Ativos</p></div>
                        </div>
                        <button onClick={() => setViewingClient(c)} className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-all">Acessar Perfil</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPage === Page.PROJECTS && (
                <div className="space-y-10 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div><h1 className="text-4xl font-black text-white tracking-tighter">Workflow Sync</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Operação conectada ao financeiro.</p></div>
                    <button onClick={() => setIsProjectModalOpen(true)} className="px-8 py-4.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">rocket_launch</span> Iniciar Workflow</button>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {projects.map(p => (
                      <div key={p.id} className="glass-panel p-10 rounded-[48px] border border-white/5 group inner-glow">
                        <div className="flex justify-between items-start mb-10">
                          <div>
                            <h3 className="text-2xl font-black text-white mb-2 leading-none">{p.name}</h3>
                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[2px]">{p.client}</p>
                          </div>
                          <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg uppercase tracking-widest">R$ {p.budget.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="space-y-6">
                           <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden p-[2px] border border-white/5">
                            <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${p.progress}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] font-black text-zinc-500 uppercase">
                            <span>{p.serviceType}</span>
                            <span>Prazo: {p.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentPage === Page.FINANCE && (
                 <div className="space-y-10 animate-fadeIn">
                  <div className="flex justify-between items-center">
                    <div><h1 className="text-4xl font-black text-white tracking-tighter">Finance Hub</h1><p className="text-zinc-500 mt-1 font-medium text-sm">Entradas automáticas de projetos e recorrentes.</p></div>
                    <div className="flex items-center gap-4">
                      <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-xs font-black text-white outline-none" />
                      <button onClick={() => setIsFinanceModalOpen(true)} className="px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3"><span className="material-symbols-outlined text-lg">add_card</span> Novo Lançamento</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="glass-panel p-8 rounded-[40px] border-emerald-500/20 bg-emerald-500/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Inflow (Mês)</p>
                      <p className="text-3xl font-black text-emerald-400">R$ {financeSummary.income.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] border-rose-500/20 bg-rose-500/5">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Outflow (Mês)</p>
                      <p className="text-3xl font-black text-rose-400">R$ {financeSummary.expense.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="glass-panel p-8 rounded-[40px] border-white/10">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[3px] mb-2">Net Profit</p>
                      <p className="text-3xl font-black text-white">R$ {financeSummary.balance.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="glass-panel rounded-[48px] overflow-hidden border border-white/5 mt-8">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Descrição</th>
                          <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tipo</th>
                          <th className="px-8 py-6 text-[10px] font-black text-zinc-500 uppercase tracking-widest text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.filter(t => t.date.startsWith(filterMonth)).map(t => (
                          <tr key={t.id} className="hover:bg-white/[0.01] transition-colors">
                            <td className="px-8 py-6"><p className="text-sm font-bold text-white">{t.description}</p><p className="text-[10px] text-zinc-600">{t.date}</p></td>
                            <td className="px-8 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{t.type === 'income' ? 'Entrada' : 'Saída'}</span></td>
                            <td className="px-8 py-6 text-right font-black text-sm text-white">R$ {t.amount.toLocaleString('pt-BR')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {showAI && (
            <div className="hidden lg:block w-[400px] border-l border-white/5 bg-sidebar-dark z-[100] h-[calc(100vh-6rem)] fixed right-0 top-24 animate-fadeIn">
              <AIAssistant 
                onAction={{
                  cadastrar_cliente: (d) => executeCreateClient(d),
                  abrir_projeto: (d) => executeCreateProject(d),
                  registrar_financeiro: (d) => executeCreateTransaction(d)
                }}
              />
            </div>
          )}
        </div>

        {/* MODAIS */}
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-xl border border-white/10 shadow-2xl my-auto">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 text-center">Lançamento Financeiro</h2>
              <form onSubmit={handleCreateFinance} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Descrição do Lançamento</label>
                  <input required name="description" placeholder="Ex: Pagamento Mensalidade SEO" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Valor (R$)</label>
                    <input required name="amount" type="number" step="0.01" placeholder="0,00" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Data</label>
                    <input required name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo de Fluxo</label>
                    <select name="type" className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-white font-bold cursor-pointer">
                      <option value="income">Entrada (+)</option>
                      <option value="expense">Saída (-)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Vincular Cliente (Opcional)</label>
                    <select name="clientId" className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-white font-bold cursor-pointer">
                      <option value="">Nenhum</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsFinanceModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-white hover:bg-primary-light transition-all shadow-xl shadow-primary/20">Registrar no Hub</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isLeadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-2xl border border-white/10 shadow-2xl my-auto">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-8">Nova Oportunidade</h2>
              <form onSubmit={handleCreateLead} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <input required name="company" placeholder="Empresa / Lead" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-rose-500" />
                  <input required name="name" placeholder="Responsável" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-rose-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required name="email" type="email" placeholder="E-mail" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none" />
                  <input required name="phone" placeholder="WhatsApp" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input required name="service" placeholder="Serviço de Interesse" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none" />
                  <input required name="value" type="number" placeholder="Valor Estimado R$" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-emerald-400 font-bold" />
                </div>
                <select name="source" className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl text-white font-bold">
                  <option value="ads">Tráfego Pago (Ads)</option>
                  <option value="organic">Orgânico / Google</option>
                  <option value="referral">Indicação</option>
                  <option value="outbound">Prospecção Ativa</option>
                </select>
                <textarea name="notes" placeholder="Observações e contexto..." className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white h-32 outline-none"></textarea>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsLeadModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-rose-500 py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-white shadow-xl shadow-rose-500/20">Registrar no Pipeline</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isClientModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-4xl border border-white/10 shadow-2xl my-auto">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Onboarding de Parceiro</h2>
                <button onClick={() => setIsClientModalOpen(false)} className="text-zinc-500 hover:text-white"><span className="material-symbols-outlined text-3xl">close</span></button>
              </div>
              
              <form onSubmit={handleCreateClient} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Razão Social / Empresa</label>
                    <input required name="company" placeholder="Luminus Marketing LTDA" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nome do Responsável (Key Account)</label>
                    <input required name="name" placeholder="Ex: João Silva" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CNPJ</label>
                    <input name="cnpj" placeholder="00.000.000/0000-00" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">CPF (Se Pessoa Física)</label>
                    <input name="cpf" placeholder="000.000.000-00" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Email Principal</label>
                    <input required name="email" type="email" placeholder="contato@empresa.com" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">WhatsApp (Fale Conosco)</label>
                    <input required name="phone" placeholder="(00) 00000-0000" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Telefone Secundário</label>
                    <input name="phone2" placeholder="(00) 0000-0000" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Endereço Comercial</label>
                    <input name="address" placeholder="Rua, Número, Bairro" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cidade</label>
                      <input name="city" placeholder="Ex: São Paulo" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Estado</label>
                      <input name="state" placeholder="Ex: SP" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Website</label>
                    <input name="website" placeholder="www.empresa.com.br" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Instagram (@)</label>
                    <input name="instagram" placeholder="@seucliente" className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Modelo de Billing</label>
                    <select name="billingType" className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl text-white font-bold cursor-pointer">
                      <option value="monthly">Fee Mensal (Recorrente)</option>
                      <option value="one_time">Job Único / Avulso</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsClientModalOpen(false)} className="flex-1 py-5 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5 hover:bg-white/10 transition-all">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-5 rounded-2xl font-black uppercase text-xs tracking-widest text-white hover:bg-primary-light transition-all shadow-xl shadow-primary/20">Registrar Parceiro</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isProjectModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
            <div className="glass-panel p-12 rounded-[56px] w-full max-w-2xl border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8">Novo Workflow</h2>
              <form onSubmit={handleCreateProject} className="space-y-6">
                <input required name="name" placeholder="Nome do Projeto" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Selecione Cliente Existente</label>
                    <select name="clientId" className="w-full bg-white/10 border border-white/10 p-5 rounded-2xl text-white font-bold">
                      <option value="">-- Vincular Cliente --</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Ou Nome do Novo Cliente</label>
                    <input name="newClientName" placeholder="Caso não seja cliente..." className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none focus:border-primary placeholder:text-zinc-700" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <input required name="budget" type="number" placeholder="Budget R$" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-emerald-400 font-bold" />
                  <input required name="dueDate" type="date" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                </div>
                <input required name="serviceType" placeholder="Tipo de Serviço (Ex: Google Ads)" className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white outline-none" />
                <div className="flex gap-4">
                  <button type="button" onClick={() => setIsProjectModalOpen(false)} className="flex-1 py-6 rounded-2xl text-[10px] font-black uppercase text-zinc-500 bg-white/5">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-primary py-6 rounded-2xl font-black uppercase text-xs tracking-widest text-white">Sincronizar Workflow & Financeiro</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {viewingClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 overflow-y-auto">
             <div className="glass-panel p-12 rounded-[56px] w-full max-w-3xl border border-white/10 shadow-2xl relative">
                <button onClick={() => setViewingClient(null)} className="absolute top-10 right-10 text-zinc-500 hover:text-white"><span className="material-symbols-outlined text-3xl">close</span></button>
                <div className="flex items-center gap-6 mb-12">
                   <div className="w-20 h-20 rounded-[32px] bg-primary/20 flex items-center justify-center text-primary text-4xl font-black border border-primary/20">{viewingClient.company.charAt(0)}</div>
                   <div>
                      <h2 className="text-3xl font-black text-white leading-none mb-2">{viewingClient.company}</h2>
                      <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[2px]">{viewingClient.name} • {viewingClient.billingType === 'monthly' ? 'Recorrente' : 'Job Único'}</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 pb-2">Contatos e Fiscal</p>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-center gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">mail</span> {viewingClient.email}</div>
                        <div className="flex items-center gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">call</span> {viewingClient.phone}</div>
                        {viewingClient.cnpj && <div className="flex items-center gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">domain</span> CNPJ: {viewingClient.cnpj}</div>}
                        {viewingClient.address && <div className="flex items-start gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">location_on</span> <div>{viewingClient.address}<br/>{viewingClient.city} - {viewingClient.state}</div></div>}
                      </div>
                   </div>
                   <div className="space-y-6">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest border-b border-white/5 pb-2">Performance & Digital</p>
                      <div className="space-y-4 text-sm">
                        <div className="flex justify-between items-center"><span className="text-zinc-500">LTV Total:</span> <span className="text-white font-black">R$ {viewingClient.totalInvested.toLocaleString('pt-BR')}</span></div>
                        <div className="flex justify-between items-center"><span className="text-zinc-500">Projetos:</span> <span className="text-white font-black">{viewingClient.activeProjects} Ativos</span></div>
                        {viewingClient.instagram && <div className="flex items-center gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">camera</span> @{viewingClient.instagram}</div>}
                        {viewingClient.website && <div className="flex items-center gap-3 text-zinc-400"><span className="material-symbols-outlined text-zinc-600 text-base">language</span> {viewingClient.website}</div>}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}
      </main>

      {/* LOGIN OVERLAY */}
      {!session && (
         <div className="fixed inset-0 z-[1000] flex bg-dark-bg animate-fadeIn">
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-sidebar-dark border-r border-white/5">
              <img 
                src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&q=80&w=1600" 
                className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale hover:grayscale-0 transition-all duration-[10s]" 
                alt="Marketing Strategy" 
              />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-dark-bg/90"></div>
              
              <div className="relative z-10 flex flex-col justify-center px-24 space-y-10">
                <div className="w-24 h-24 bg-primary rounded-[32px] flex items-center justify-center shadow-2xl shadow-primary/30 group">
                  <LuminusIcon className="w-14 h-14 text-white transition-transform group-hover:rotate-12" />
                </div>
                <div className="space-y-4">
                  <h2 className="text-7xl font-black text-white leading-tight tracking-tighter">
                    Hub Luminus <br/>
                    <span className="text-primary-light">Marketing</span> Admin.
                  </h2>
                  <p className="text-zinc-400 text-xl font-medium max-w-lg leading-relaxed">
                    A plataforma inteligente para gestão de agências focada em performance, branding e resultados orientados por IA.
                  </p>
                </div>
              </div>

              <div className="absolute bottom-12 left-24 flex items-center gap-4 text-[10px] font-black text-zinc-600 uppercase tracking-[4px]">
                 <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                 System Protocol v4.5 Active
              </div>
            </div>

            <div className="w-full lg:w-2/5 flex flex-col justify-center items-center px-8 lg:px-24 bg-dark-bg relative">
              <div className="lg:hidden absolute top-12 flex flex-col items-center gap-4">
                 <LuminusIcon className="w-16 h-16 text-primary" />
                 <h1 className="text-2xl font-black text-white tracking-tighter uppercase">Luminus Marketing</h1>
              </div>

              <div className="w-full max-w-md space-y-12">
                <div className="space-y-4 text-center lg:text-left">
                  <h1 className="text-4xl font-black text-white tracking-tight">Login Corporativo</h1>
                  <p className="text-zinc-500 text-sm font-medium">Insira suas credenciais para acessar o Hub de Gestão.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">E-mail de Acesso</label>
                    <input 
                      required 
                      type="email" 
                      placeholder="email@luminus.com" 
                      className="w-full bg-white/[0.03] border border-white/10 p-6 rounded-[22px] text-white outline-none focus:border-primary transition-all shadow-inner placeholder:text-zinc-700" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center px-1">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Chave de Segurança</label>
                      <button type="button" className="text-[9px] font-black text-primary-light uppercase tracking-widest hover:underline">Esqueci a senha</button>
                    </div>
                    <input 
                      required 
                      type="password" 
                      placeholder="••••••••" 
                      className="w-full bg-white/[0.03] border border-white/10 p-6 rounded-[22px] text-white outline-none focus:border-primary transition-all shadow-inner placeholder:text-zinc-700" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-primary py-7 rounded-[22px] font-black uppercase text-xs tracking-[4px] shadow-2xl shadow-primary/30 hover:bg-primary-light hover:scale-[1.02] active:scale-95 transition-all text-white"
                  >
                    Sincronizar Acesso
                  </button>
                </form>

                <div className="pt-8 text-center lg:text-left">
                   <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">
                     Versão 4.5.2 • Cloud Infrastructure Security
                   </p>
                </div>
              </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default App;
