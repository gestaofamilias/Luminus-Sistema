
import React from 'react';
import { Page } from '../types';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  onSignOut: () => void;
}

const LuminusLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8"/>
    <circle cx="50" cy="50" r="18" fill="currentColor"/>
    <path d="M50 32C40 32 32 40 32 50C32 60 40 68 50 68" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onSignOut }) => {
  const menuItems = [
    { id: Page.DASHBOARD, label: 'Dashboard', icon: 'grid_view' },
    { id: Page.CLIENTS, label: 'Clientes Ativos', icon: 'group' },
    { id: Page.SERVICES, label: 'Serviços', icon: 'layers' },
    { id: Page.PROJECTS, label: 'Projetos', icon: 'account_tree' },
    { id: Page.CRM, label: 'CRM de Vendas', icon: 'hub' },
    { id: Page.FINANCE, label: 'Financeiro', icon: 'account_balance' },
  ];

  return (
    <aside className="w-[260px] bg-sidebar-dark border-r border-white/5 flex flex-col h-screen flex-shrink-0 z-50">
      <div className="p-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 text-primary flex items-center justify-center">
             <LuminusLogo className="w-full h-full" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">Luminus</h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Marketing OS</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-bold text-zinc-600 uppercase tracking-[2px] mb-4">Gerenciamento</p>
        <div className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                currentPage === item.id 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 font-semibold' 
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <span className={`material-symbols-outlined text-[22px] transition-transform group-hover:scale-110 ${currentPage === item.id ? 'fill-1' : 'opacity-70 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className="p-6 border-t border-white/5 bg-black/10">
        <button 
          onClick={onSignOut}
          className="w-full flex items-center gap-3 p-2 bg-white/5 rounded-2xl border border-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 group-hover:text-rose-500 transition-colors">
            <span className="material-symbols-outlined text-xl">logout</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-xs font-bold text-white truncate">Encerrar Hub</p>
            <p className="text-[9px] text-zinc-500 font-medium uppercase truncate">Modo Local</p>
          </div>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
