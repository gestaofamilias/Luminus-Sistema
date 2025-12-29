
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import { Page, LeadStatus, FinanceTransaction, CRMItem, Project, ProjectTask, Client } from './types';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area
} from 'recharts';

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
  // --- ESTADOS CORE ---
  const [session, setSession] = useState<any>(storage.getUser());
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(Page.DASHBOARD);

  // --- ESTADOS DE DADOS ---
  const [crmItems, setCrmItems] = useState<CRMItem[]>(storage.get('crm'));
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(storage.get('finance'));
  const [projects, setProjects] = useState<Project[]>(storage.get('projects'));
  const [clients, setClients] = useState<Client[]>(storage.get('clients'));

  // --- ESTADOS DE UI/MODAIS ---
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isFinanceModalOpen, setIsFinanceModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [selectedProjectForView, setSelectedProjectForView] = useState<Project | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isSavingProject, setIsSavingProject] = useState(false);

  // --- FORMULÁRIOS ---
  const [newProjectForm, setNewProjectForm] = useState({
    projectName: '', clientName: '', clientEmail: '', dueDate: '', description: '', linkedLeadId: '', linkedClientId: '', tasks: [] as ProjectTask[]
  });
  const [newTaskText, setNewTaskText] = useState('');

  const [financeForm, setFinanceForm] = useState({
    description: '', amount: '', type: 'income' as 'income' | 'expense', date: new Date().toISOString().split('T')[0], status: 'paid' as 'paid' | 'pending', clientId: '', projectId: ''
  });

  const [leadForm, setLeadForm] = useState({
    name: '', company: '', email: '', phone: '', address: '', cpf: '', cnpj: '', service: 'Web Design Pro', value: '', tag: 'NOVO', notes: ''
  });

  const [clientForm, setClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    phone2: '',
    cpf: '',
    cnpj: '',
    address: '',
    instagram: '',
    facebook: '',
    website: ''
  });

  const servicesData = [
    { id: 'web', name: 'Web Design Pro', tagline: 'Interfaces de Próxima Geração', desc: 'Sistemas web e sites focados em alta performance e UX refinada.', icon: 'desktop_windows', img: 'https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&q=80&w=1200', process: [{t: 'Briefing Inicial'}, {t: 'Wireframes & UI'}, {t: 'Desenvolvimento'}, {t: 'Deploy & QA'}] },
    { id: 'brand', name: 'Branding Estratégico', tagline: 'Identidades Memoráveis', desc: 'Construção de marcas que contam histórias e geram conexão real.', icon: 'palette', img: 'https://images.unsplash.com/photo-1586717791821-3f44a563eb4c?auto=format&fit=crop&q=80&w=1200', process: [{t: 'Brainstorming Conceitual'}, {t: 'Design do Logo'}, {t: 'Brandbook'}, {t: 'Apresentação Final'}] },
    { id: 'social', name: 'Content Growth', tagline: 'Presença Digital Dominante', desc: 'Gestão de redes sociais com foco em crescimento orgânico e autoridade.', icon: 'share', img: 'https://images.unsplash.com/photo-1493612276216-ee3925520721?auto=format&fit=crop&q=80&w=1200', process: [{t: 'Auditoria de Perfil'}, {t: 'Calendário Editorial'}, {t: 'Criação de Artes'}, {t: 'Agendamento Postagens'}] },
    { id: 'ads', name: 'Performance Ads', tagline: 'Escala de Faturamento', desc: 'Campanhas de tráfego pago otimizadas por dados para ROAS máximo.', icon: 'campaign', img: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1200', process: [{t: 'Setup Pixel/API'}, {t: 'Copywriting de Criativos'}, {t: 'Lançamento Campanhas'}, {t: 'Relatório Mensal'}] }
  ];

  // --- SINCRONIZAÇÃO LOCAL STORAGE ---
  useEffect(() => { storage.set('crm', crmItems); }, [crmItems]);
  useEffect(() => { storage.set('finance', transactions); }, [transactions]);
  useEffect(() => { storage.set('projects', projects); }, [projects]);
  useEffect(() => { storage.set('clients', clients); }, [clients]);

  // --- LÓGICA DE NEGÓCIO ---

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    // Simulação de autenticação
    setTimeout(() => {
      const mockUser = { email: authEmail, name: 'Admin Luminus' };
      setSession(mockUser);
      storage.setUser(mockUser);
      setAuthLoading(false);
    }, 1500);
  };

  const handleSignOut = () => {
    setSession(null);
    storage.setUser(null);
  };

  const handleDrop = (status: LeadStatus) => {
    if (!draggedId) return;
    setCrmItems(prev => {
      const updated = prev.map(item => item.id === draggedId ? { ...item, status } : item);
      
      if (status === LeadStatus.CLOSED) {
        const lead = updated.find(l => l.id === draggedId);
        if (lead && !clients.find(c => c.email === lead.email)) {
          const newClient: Client = {
            id: `client-${Date.now()}`,
            name: lead.name,
            company: lead.company,
            email: lead.email,
            phone: lead.phone,
            status: 'active',
            totalInvested: 0,
            activeProjects: 0
          };
          setClients(cPrev => [...cPrev, newClient]);
        }
      }
      return updated;
    });
    setDraggedId(null);
  };

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead: CRMItem = {
      ...leadForm,
      id: `lead-${Date.now()}`,
      status: LeadStatus.NEW,
      createdAt: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
    };
    setCrmItems(prev => [newLead, ...prev]);
    setIsLeadModalOpen(false);
    setLeadForm({ name: '', company: '', email: '', phone: '', address: '', cpf: '', cnpj: '', service: 'Web Design Pro', value: '', tag: 'NOVO', notes: '' });
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      ...clientForm,
      id: `client-${Date.now()}`,
      status: 'active',
      totalInvested: 0,
      activeProjects: 0
    };
    setClients(prev => [...prev, newClient]);
    setIsClientModalOpen(false);
    setClientForm({ name: '', company: '', email: '', phone: '', phone2: '', cpf: '', cnpj: '', address: '', instagram: '', facebook: '', website: '' });
  };

  const openStartProjectModal = (svcId?: string) => {
    const svc = servicesData.find(s => s.id === svcId);
    setSelectedServiceId(svcId || null);
    
    setNewProjectForm({
      projectName: svc?.name || '',
      clientName: '',
      clientEmail: '',
      description: '',
      linkedLeadId: '',
      linkedClientId: '',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tasks: svc?.process?.map((p, idx) => ({ id: `st-${idx}-${Date.now()}`, text: p.t, completed: false })) || []
    });
    setIsProjectModalOpen(true);
  };

  const handleCreateOrUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProject(true);
    
    setTimeout(() => {
      const currentSvc = servicesData.find(s => s.id === selectedServiceId);
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        name: newProjectForm.projectName,
        client: newProjectForm.clientName,
        clientEmail: newProjectForm.clientEmail,
        progress: 0,
        status: 'active',
        dueDate: newProjectForm.dueDate,
        serviceType: currentSvc?.name || 'Projeto Customizado',
        description: newProjectForm.description,
        tasks: newProjectForm.tasks,
        clientId: newProjectForm.linkedClientId || undefined
      };

      setProjects(prev => [newProject, ...prev]);
      
      if (newProjectForm.linkedClientId) {
        setClients(prev => prev.map(c => 
          c.id === newProjectForm.linkedClientId ? { ...c, activeProjects: c.activeProjects + 1 } : c
        ));
      }

      setIsSavingProject(false);
      setIsProjectModalOpen(false);
      setCurrentPage(Page.PROJECTS);
    }, 800);
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(financeForm.amount);
    const newTransaction: FinanceTransaction = {
      id: `trans-${Date.now()}`,
      description: financeForm.description,
      amount: amountNum,
      type: financeForm.type,
      date: financeForm.date,
      status: financeForm.status,
      clientId: financeForm.clientId || undefined
    };
    
    setTransactions(prev => [newTransaction, ...prev]);

    if (financeForm.type === 'income' && financeForm.clientId) {
      setClients(prev => prev.map(c => 
        c.id === financeForm.clientId ? { ...c, totalInvested: c.totalInvested + amountNum } : c
      ));
    }

    setIsFinanceModalOpen(false);
    setFinanceForm({ description: '', amount: '', type: 'income', date: new Date().toISOString().split('T')[0], status: 'paid', clientId: '', projectId: '' });
  };

  const addTaskToForm = () => {
    if (!newTaskText.trim()) return;
    setNewProjectForm(prev => ({
      ...prev,
      tasks: [...prev.tasks, { id: Date.now().toString(), text: newTaskText, completed: false }]
    }));
    setNewTaskText('');
  };

  const toggleTaskStatus = (projectId: string, taskId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const newTasks = p.tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t);
        const done = newTasks.filter(t => t.completed).length;
        const progress = Math.round((done / newTasks.length) * 100);
        const updated = { ...p, tasks: newTasks, progress };
        if (selectedProjectForView?.id === projectId) setSelectedProjectForView(updated);
        return updated;
      }
      return p;
    }));
  };

  // --- RENDERIZADORES DE PÁGINAS ---

  const renderDashboard = () => (
    <div className="space-y-10 animate-fadeIn">
      <div className="relative h-64 rounded-[40px] overflow-hidden group border border-white/5 shadow-2xl">
        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-[10s]" alt="Dashboard Hero" />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg via-dark-bg/80 to-transparent"></div>
        <div className="absolute inset-0 flex flex-col justify-center px-12 space-y-2">
          <span className="text-primary-light font-black uppercase tracking-[4px] text-xs">Sistema Luminus</span>
          <h1 className="text-4xl font-black text-white tracking-tight leading-tight">Gestão Operacional <br/><span className="text-primary-light">Marketing Digital</span></h1>
          <p className="text-zinc-400 text-sm max-w-md font-medium">Controle total de leads, clientes e faturamento.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Clientes Ativos', val: clients.length.toString(), icon: 'group', color: 'text-indigo-400' },
          { label: 'Projetos Vivos', val: projects.filter(p => p.status === 'active').length.toString(), icon: 'rocket', color: 'text-amber-400' },
          { label: 'Receita Total', val: `R$ ${transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0).toLocaleString('pt-BR')}`, icon: 'trending_up', color: 'text-emerald-400' },
          { label: 'Fluxo de Caixa', val: `R$ ${transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc - t.amount, 0).toLocaleString('pt-BR')}`, icon: 'account_balance_wallet', color: 'text-rose-400' },
        ].map((stat, i) => (
          <div key={i} className="glass-panel p-6 rounded-[30px] group hover:scale-[1.03] transition-all inner-glow">
            <div className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center ${stat.color} mb-4`}>
                 <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-black text-white mb-1">{stat.val}</p>
            <h3 className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">{stat.label}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="glass-panel p-8 rounded-[32px] inner-glow">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-lg font-bold text-white">Captação Mensal</h3>
            <span className="px-3 py-1 bg-primary/20 text-primary-light text-[10px] font-bold rounded-lg uppercase">Métricas em Tempo Real</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[{n:'S1',l:4},{n:'S2',l:8},{n:'S3',l:6},{n:'S4',l:12}]}>
                <defs><linearGradient id="colorL" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.3}/><stop offset="95%" stopColor="#2563EB" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="n" stroke="#334155" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0A0C12', border: '1px solid #ffffff10', borderRadius: '16px' }} />
                <Area type="monotone" dataKey="l" stroke="#3B82F6" strokeWidth={4} fill="url(#colorL)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Clientes Ativos</h1><p className="text-zinc-500 mt-1">Sua base de parceiros recorrentes.</p></div>
        <button onClick={() => setIsClientModalOpen(true)} className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><span className="material-symbols-outlined text-sm">person_add</span> Novo Cliente</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-panel rounded-[40px] border-dashed border-2 border-white/5 opacity-50 font-bold uppercase tracking-widest text-xs">Nenhum cliente registrado.</div>
        ) : (
          clients.map(c => (
            <div key={c.id} className="glass-panel p-6 rounded-[32px] border border-white/5 hover:border-primary/40 transition-all group inner-glow">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary-light font-black text-xl border border-primary/20">{c.company.charAt(0)}</div>
                <div><h3 className="font-bold text-white text-lg">{c.company}</h3><p className="text-xs text-zinc-500">{c.name}</p></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">LTV (Faturamento)</p><p className="text-emerald-400 font-bold">R$ {c.totalInvested.toLocaleString('pt-BR')}</p></div>
                <div><p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Projetos Atuais</p><p className="text-white font-bold">{c.activeProjects}</p></div>
              </div>
              {c.website && (
                <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                   <a href={c.website} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">language</span></a>
                   {c.instagram && <a href={c.instagram} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 hover:text-rose-400 transition-colors"><span className="material-symbols-outlined text-sm">share</span></a>}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderCRM = () => (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Pipeline Comercial</h1><p className="text-zinc-500 mt-1">Arraste os cards para avançar as negociações.</p></div>
        <button onClick={() => setIsLeadModalOpen(true)} className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2"><span className="material-symbols-outlined text-sm">add</span> Capturar Lead</button>
      </div>
      <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar min-h-[70vh]">
        {[
          { id: LeadStatus.NEW, label: 'Novo Lead', icon: 'auto_awesome' },
          { id: LeadStatus.CONTACTED, label: 'Primeiro Contato', icon: 'chat_bubble' },
          { id: LeadStatus.QUALIFIED, label: 'Qualificado', icon: 'verified' },
          { id: LeadStatus.NEGOTIATION, label: 'Negociação', icon: 'handshake' },
          { id: LeadStatus.CLOSED, label: 'Fechado / Ganho', icon: 'task_alt' }
        ].map(col => (
          <div key={col.id} className="flex flex-col gap-5 min-w-[300px] w-[300px]" onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.id)}>
            <div className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-white/5">
               <div className="flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary-light">{col.icon}</span><h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{col.label}</h4></div>
               <span className="text-[10px] font-black text-zinc-600 bg-white/5 w-6 h-6 rounded-full flex items-center justify-center">{crmItems.filter(i => i.status === col.id).length}</span>
            </div>
            <div className="space-y-4">
              {crmItems.filter(i => i.status === col.id).map(lead => (
                <div key={lead.id} draggable onDragStart={() => setDraggedId(lead.id)} className="glass-panel p-5 rounded-[24px] border border-white/5 hover:border-primary/40 transition-all cursor-move group inner-glow">
                   <h5 className="text-sm font-bold text-white mb-1">{lead.name}</h5>
                   <p className="text-[11px] text-zinc-500 mb-4">{lead.company}</p>
                   <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <span className="text-xs font-black text-white">{lead.value}</span>
                      <span className="text-[10px] text-zinc-600 font-bold uppercase">{lead.createdAt}</span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dark-bg text-slate-100 selection:bg-primary/40 overflow-hidden font-sans">
      <Sidebar currentPage={currentPage} onNavigate={setCurrentPage} onSignOut={handleSignOut} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 glass-panel border-b border-white/5 flex items-center justify-between px-10 z-[60] sticky top-0 shadow-xl">
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setCurrentPage(Page.DASHBOARD)}>
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary transition-transform group-hover:scale-110">
               <LuminusIcon className="w-6 h-6" />
            </div>
            <h2 className="text-xs font-black text-white uppercase tracking-[4px]">Luminus Marketing OS</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hidden md:block">Gestão Ativa</span>
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500">
               <span className="material-symbols-outlined">settings</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto pb-20">
            {currentPage === Page.DASHBOARD && renderDashboard()}
            {currentPage === Page.CLIENTS && renderClients()}
            {currentPage === Page.CRM && renderCRM()}
            {currentPage === Page.PROJECTS && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Projetos Ativos</h1><p className="text-zinc-500 mt-1">Acompanhamento checklist das entregas.</p></div>
                  <button onClick={() => openStartProjectModal()} className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">Criar Projeto</button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {projects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProjectForView(p)} className="glass-panel p-8 rounded-[40px] border border-white/5 hover:border-primary/20 transition-all cursor-pointer group inner-glow">
                      <div className="flex justify-between items-start mb-8">
                        <div><h3 className="text-xl font-black text-white mb-2 group-hover:text-primary-light transition-colors">{p.name}</h3><p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{p.serviceType} • {p.client}</p></div>
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-primary-light border border-white/10 transition-transform group-hover:rotate-12"><span className="material-symbols-outlined text-3xl">folder_open</span></div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end"><span className="text-[10px] font-black text-zinc-500 uppercase tracking-[2px]">Progresso</span><span className="text-sm font-black text-white">{p.progress}%</span></div>
                        <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden p-[2px]"><div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }}></div></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {currentPage === Page.SERVICES && (
               <div className="space-y-12 animate-fadeIn">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                   <h1 className="text-4xl font-black text-white tracking-tight">Arquitetura de Serviços</h1>
                   <p className="text-zinc-500 text-sm font-bold uppercase tracking-[2px]">Selecione um template para iniciar um novo workflow</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {servicesData.map(svc => (
                     <div key={svc.id} onClick={() => openStartProjectModal(svc.id)} className="glass-panel rounded-[40px] overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all border border-white/5 inner-glow">
                        <div className="h-64 overflow-hidden relative">
                           <img src={svc.img} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-[15s]" alt={svc.name} />
                           <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-transparent to-transparent"></div>
                        </div>
                        <div className="p-8 flex items-start justify-between">
                           <div className="space-y-2"><h3 className="text-2xl font-black text-white group-hover:text-primary-light transition-colors">{svc.name}</h3><p className="text-zinc-500 text-sm leading-relaxed">{svc.desc}</p></div>
                           <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary-light group-hover:bg-primary group-hover:text-white transition-all shadow-xl"><span className="material-symbols-outlined text-3xl">{svc.icon}</span></div>
                        </div>
                     </div>
                   ))}
                </div>
             </div>
            )}
            {currentPage === Page.FINANCE && (
              <div className="space-y-8 animate-fadeIn">
                <div className="flex justify-between items-center">
                  <div><h1 className="text-3xl font-extrabold text-white tracking-tight">Tesouraria</h1><p className="text-zinc-500 mt-1">Lançamentos de caixa por cliente.</p></div>
                  <button onClick={() => setIsFinanceModalOpen(true)} className="px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl">Novo Lançamento</button>
                </div>
                <div className="glass-panel rounded-[32px] overflow-hidden border border-white/5">
                    <table className="w-full text-left">
                      <thead className="bg-white/5 border-b border-white/5"><tr className="text-[10px] font-black text-zinc-500 uppercase tracking-widest"><th className="px-8 py-5">Descrição</th><th className="px-8 py-5">Cliente Vinculado</th><th className="px-8 py-5">Data</th><th className="px-8 py-5 text-right">Valor</th></tr></thead>
                      <tbody className="divide-y divide-white/5">
                        {transactions.map(t => {
                          const client = clients.find(c => c.id === t.clientId);
                          return (
                            <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6"><p className="text-sm font-bold text-zinc-200">{t.description}</p><p className="text-[9px] font-black uppercase tracking-wider text-zinc-500">{t.status}</p></td>
                              <td className="px-8 py-6">{client ? <span className="px-3 py-1 bg-primary/10 text-primary-light text-[10px] font-bold rounded-full uppercase border border-primary/20">{client.company}</span> : <span className="text-[10px] text-zinc-700 font-bold uppercase">Geral</span>}</td>
                              <td className="px-8 py-6 text-[11px] text-zinc-500">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                              <td className={`px-8 py-6 text-sm font-black text-right ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>{t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR')}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL DE LOGIN */}
        {!session && (
          <div className="fixed inset-0 z-[1000] flex bg-dark-bg animate-fadeIn">
            <div className="hidden lg:flex lg:w-3/5 relative overflow-hidden bg-sidebar-dark border-r border-white/5">
              <img src="https://images.unsplash.com/photo-1557426272-fc759fdf7a8d?auto=format&fit=crop&q=80&w=1600" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" alt="Marketing" />
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-dark-bg"></div>
              <div className="relative z-10 flex flex-col justify-center px-24 space-y-8">
                <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/20"><LuminusIcon className="w-12 h-12 text-white" /></div>
                <h2 className="text-6xl font-black text-white leading-tight tracking-tighter">Performance <br/><span className="text-primary-light">Digital</span> em Escala.</h2>
                <p className="text-zinc-400 text-xl font-medium max-w-lg leading-relaxed">O cockpit definitivo para a gestão da sua agência.</p>
              </div>
            </div>
            <div className="w-full lg:w-2/5 flex flex-col justify-center items-center px-8 lg:px-24 bg-dark-bg">
              <div className="w-full max-w-md space-y-12">
                <div className="space-y-2 text-center lg:text-left">
                  <span className="text-primary font-black uppercase tracking-[4px] text-xs">Auth Hub</span>
                  <h1 className="text-4xl font-black text-white tracking-tight">Bem-vindo.</h1>
                  <p className="text-zinc-500 text-sm">Insira suas credenciais corporativas.</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-4">
                    <input 
                      required 
                      type="email" 
                      value={authEmail} 
                      onChange={(e) => setAuthEmail(e.target.value)} 
                      placeholder="email@luminus.com" 
                      className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl outline-none focus:border-primary focus:bg-white/[0.06] transition-all text-white" 
                    />
                    <input 
                      required 
                      type="password" 
                      value={authPassword} 
                      onChange={(e) => setAuthPassword(e.target.value)} 
                      placeholder="••••••••" 
                      className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-2xl outline-none focus:border-primary focus:bg-white/[0.06] transition-all text-white" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={authLoading} 
                    className="w-full bg-primary py-5 rounded-2xl font-black uppercase text-xs tracking-[2px] shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                  >
                    {authLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Validando...
                      </>
                    ) : 'Acessar Hub de Operações'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FINANCEIRO */}
        {isFinanceModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="glass-panel p-10 rounded-[48px] w-full max-w-lg relative inner-glow">
              <button onClick={() => setIsFinanceModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
              <h2 className="text-2xl font-black text-white uppercase mb-8">Novo Lançamento</h2>
              <form onSubmit={handleAddTransaction} className="space-y-6">
                <input required value={financeForm.description} onChange={e => setFinanceForm({...financeForm, description: e.target.value})} placeholder="Ex: Pagamento Setup Facebook Ads" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all" />
                <div className="grid grid-cols-2 gap-4">
                  <input required type="number" step="0.01" value={financeForm.amount} onChange={e => setFinanceForm({...financeForm, amount: e.target.value})} placeholder="Valor R$" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" />
                  <select value={financeForm.type} onChange={e => setFinanceForm({...financeForm, type: e.target.value as any})} className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none text-white cursor-pointer">
                    <option value="income">Receita (+)</option><option value="expense">Despesa (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Vincular a Cliente</label>
                  <select value={financeForm.clientId} onChange={e => setFinanceForm({...financeForm, clientId: e.target.value})} className="w-full bg-white/10 border border-white/10 p-4 rounded-2xl outline-none text-white cursor-pointer">
                    <option value="">Lançamento Geral</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.company}</option>)}
                  </select>
                </div>
                <button type="submit" className="w-full bg-primary py-5 rounded-[24px] font-black uppercase text-xs shadow-xl shadow-primary/20 hover:bg-primary-light transition-all">Efetivar Lançamento</button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NOVO CLIENTE DETALHADO */}
        {isClientModalOpen && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4 overflow-y-auto">
            <div className="glass-panel p-8 md:p-10 rounded-[48px] w-full max-w-2xl relative inner-glow my-auto">
              <button onClick={() => setIsClientModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
              
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary-light"><span className="material-symbols-outlined">person_add</span></div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">Cadastro de Novo Cliente</h2>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-8">
                {/* Seção 1: Identificação */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="material-symbols-outlined text-xs text-primary">badge</span>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Informações de Identificação</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Empresa / Razão Social</label>
                      <input required value={clientForm.company} onChange={e => setClientForm({...clientForm, company: e.target.value})} placeholder="Ex: Luminus Tech LTDA" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Responsável Principal</label>
                      <input required value={clientForm.name} onChange={e => setClientForm({...clientForm, name: e.target.value})} placeholder="Nome Completo" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">CNPJ</label>
                      <input value={clientForm.cnpj} onChange={e => setClientForm({...clientForm, cnpj: e.target.value})} placeholder="00.000.000/0000-00" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">CPF do Responsável</label>
                      <input value={clientForm.cpf} onChange={e => setClientForm({...clientForm, cpf: e.target.value})} placeholder="000.000.000-00" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  </div>
                </div>

                {/* Seção 2: Contato e Endereço */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="material-symbols-outlined text-xs text-primary">contact_mail</span>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contato e Localização</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">E-mail Corporativo</label>
                      <input required type="email" value={clientForm.email} onChange={e => setClientForm({...clientForm, email: e.target.value})} placeholder="contato@empresa.com" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Telefone (Fixo)</label>
                      <input value={clientForm.phone2} onChange={e => setClientForm({...clientForm, phone2: e.target.value})} placeholder="(00) 0000-0000" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">WhatsApp / Celular</label>
                      <input required value={clientForm.phone} onChange={e => setClientForm({...clientForm, phone: e.target.value})} placeholder="(00) 90000-0000" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Endereço Completo</label>
                      <input value={clientForm.address} onChange={e => setClientForm({...clientForm, address: e.target.value})} placeholder="Rua, Número, Bairro, Cidade" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  </div>
                </div>

                {/* Seção 3: Presença Digital */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                    <span className="material-symbols-outlined text-xs text-primary">public</span>
                    <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ecosistema Digital</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 relative">
                       <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Instagram (@)</label>
                       <input value={clientForm.instagram} onChange={e => setClientForm({...clientForm, instagram: e.target.value})} placeholder="@perfil" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Facebook</label>
                       <input value={clientForm.facebook} onChange={e => setClientForm({...clientForm, facebook: e.target.value})} placeholder="facebook.com/pagina" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] text-zinc-600 font-bold uppercase ml-1">Site / Landing Page</label>
                       <input value={clientForm.website} onChange={e => setClientForm({...clientForm, website: e.target.value})} placeholder="www.empresa.com.br" className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-primary py-5 rounded-[24px] font-black uppercase text-[10px] shadow-xl shadow-primary/20 hover:bg-primary-light transition-all flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    Efetivar Cadastro
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
};

export default App;
