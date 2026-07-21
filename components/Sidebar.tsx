import React from 'react';
import { ViewState } from '../types';
import { LayoutDashboard, ShoppingCart, Package, History, Users, Store, Settings, ShieldCheck, LogOut, Share2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const { user, profile, signOut, isDemoMode } = useStore();

  const navItems: { id: ViewState; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'pos', label: 'Ponto de Venda', icon: <ShoppingCart size={18} /> },
    { id: 'inventory', label: 'Estoque', icon: <Package size={18} /> },
    { id: 'history', label: 'Vendas', icon: <History size={18} /> },
    { id: 'customers', label: 'Clientes', icon: <Users size={18} /> },
    { id: 'catalog', label: 'Catálogo Online', icon: <Share2 size={18} /> },
    { id: 'settings', label: 'Configurações', icon: <Settings size={18} /> },
    { 
      id: 'admin', 
      label: 'Painel Admin', 
      icon: <ShieldCheck size={18} />, 
      hidden: isDemoMode || user?.email !== 'backup02atelietetemimos@gmail.com' 
    },
  ];

  return (
    <div className="w-20 lg:w-64 bg-dark text-white flex flex-col h-screen fixed left-0 top-0 z-40 transition-all duration-300">
      <div className="p-4 lg:p-4.5 flex items-center justify-center lg:justify-start gap-2.5 border-b border-slate-700">
        <div className="bg-primary p-1.5 rounded-lg">
          <Store size={20} className="text-white" />
        </div>
        <div className="hidden lg:block overflow-hidden flex-1 self-center">
          <div className="flex items-center gap-1.55">
            <h1 className="text-base font-bold tracking-tight text-white leading-tight font-vendeei">Vendeei</h1>
            <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase tracking-wider leading-none ${
              isDemoMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isDemoMode ? 'Demo' : (profile?.role === 'admin' ? 'Admin' : 'Pro')}
            </span>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 mt-4 px-2 lg:px-3 space-y-1 overflow-y-auto">
        {navItems.filter(i => !i.hidden).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center justify-center lg:justify-start gap-3 p-2 lg:p-2.5 rounded-lg transition-all duration-200 ${
              currentView === item.id 
                ? 'bg-primary text-white shadow-lg shadow-emerald-900/40 ring-1 ring-white/20' 
                : 'text-slate-200 hover:bg-white/10 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="hidden lg:block font-title-md text-xs lg:text-sm font-medium tracking-wide">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-3 space-y-2 border-t border-slate-700 mt-auto bg-slate-900/50">
        <div className="hidden lg:block px-2.5 py-1">
          <p className="text-[10px] text-slate-400 truncate font-medium" title={user?.email}>
            {user?.email}
          </p>
          {isDemoMode && (
            <p className="text-[8px] text-amber-400 font-bold uppercase tracking-wider mt-0.5">
              Modo Demonstração
            </p>
          )}
        </div>
        <button 
          onClick={signOut}
          className="w-full flex items-center justify-center lg:justify-start gap-3 p-2 lg:p-2.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors font-title-md text-xs lg:text-sm font-medium tracking-wide"
        >
          <LogOut size={18} />
          <span className="hidden lg:block">Sair</span>
        </button>

      </div>
    </div>
  );
};
