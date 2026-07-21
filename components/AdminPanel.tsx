import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  Search, 
  Filter, 
  MoreVertical, 
  CheckCircle2, 
  XCircle, 
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Trash2,
  UserCog,
  Plus,
  Activity,
  TrendingUp,
  RefreshCcw,
  Copy,
  Mail,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useStore } from '../context/StoreContext';
import { Profile } from '../types';
import { supabase } from '../lib/supabase';

export const AdminPanel: React.FC = () => {
  const { user, profile, addToast } = useStore();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [filterType, setFilterType] = useState<'all' | 'inactive' | 'expiring' | 'pro'>('all');
  const [pricing, setPricing] = useState({ price: 14.90, announcement: '' });
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    trialsToday: 0
  });

  useEffect(() => {
    console.log('Profile atual no AdminPanel:', profile);
    // 1. TRAVA DE AUTENTICAÇÃO: Se não há usuário logado, força loading false imediatamente
    if (!user) {
      setLoading(false);
      return;
    }

    fetchUsers();
    fetchSettings();

    // Close menu on click outside
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('app_settings').select('*');
      if (data) {
        const price = data.find(s => s.key === 'subscription_price')?.value || 14.90;
        const announcement = data.find(s => s.key === 'global_announcement')?.value || '';
        setPricing({ price, announcement });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateSettings = async () => {
    try {
      await supabase.from('app_settings').upsert([
        { key: 'subscription_price', value: pricing.price },
        { key: 'global_announcement', value: pricing.announcement }
      ]);
      addToast('Configurações salvas com sucesso', 'success');
    } catch (err) {
      addToast('Erro ao salvar configurações', 'error');
    }
  };

  const fetchUsers = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Dados dos usuários retornados pelo Supabase:', data);
      setUsers(data || []);
      
      // Calculate Stats
      const active = data?.filter(u => u.subscription_status === 'active').length || 0;
      setStats({
        totalUsers: data?.length || 0,
        activeSubscriptions: active,
        monthlyRevenue: active * pricing.price,
        trialsToday: data?.filter(u => {
          const created = new Date(u.created_at);
          const today = new Date();
          return created.toDateString() === today.toDateString();
        }).length || 0
      });

      // Prepare Chart Data (Evolution last 30 days)
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString();
      }).reverse();

      const evolution = last30Days.map(dateStr => {
        const count = data?.filter(u => new Date(u.created_at).toLocaleDateString() === dateStr).length || 0;
        const mrr = (data?.filter(u => 
          u.subscription_status === 'active' && 
          new Date(u.created_at) <= new Date(dateStr.split('/').reverse().join('-'))
        ).length || 0) * pricing.price;

        return { 
          name: dateStr.split('/')[0] + '/' + dateStr.split('/')[1], 
          cadastros: count,
          mrr: mrr
        };
      });
      setChartData(evolution);

    } catch (err) {
      console.error(err);
      addToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscription = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: newStatus,
          subscription_expiry: newStatus === 'active' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
        })
        .eq('id', userId);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription_status: newStatus as any } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, subscription_status: newStatus as any } : null);
      }
      const statusLabel = newStatus === 'active' ? 'Ativo' : 'Inativo';
      addToast(`Status alterado para ${statusLabel}`, 'success');
      fetchUsers(); // Refresh stats
    } catch (err) {
      addToast('Erro ao atualizar assinatura', 'error');
    }
  };

  const changeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw error;
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, role: newRole as any } : null);
      }
      const roleLabel = newRole === 'admin' ? 'Administrador' : 'Cliente';
      addToast(`Nível de acesso alterado para ${roleLabel}`, 'success');
    } catch (err) {
      addToast('Erro ao atualizar nível de acesso', 'error');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm('Tem certeza que deseja excluir permanentemente este usuário? Todos os produtos e vendas dele serão APAGADOS.')) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      addToast('Usuário e dados excluídos com sucesso', 'success');
      fetchUsers(); // Refresh stats
    } catch (err) {
      console.error(err);
      addToast('Erro ao excluir usuário. Verifique se você tem permissão.', 'error');
    }
  };

  const extendTrial = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          subscription_status: 'trial'
        })
        .eq('id', userId);
      
      if (error) throw error;
      
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, subscription_status: 'trial' as any } : null);
      }

      addToast('Teste extendido por +7 dias', 'success');
      fetchUsers();
    } catch (err) {
      addToast('Erro ao extender teste', 'error');
    }
  };

  const formatLastSeen = (date: string | undefined) => {
    if (!date) return 'Nunca';
    const lastSeen = new Date(date);
    const now = new Date();
    const diff = now.getTime() - lastSeen.getTime();
    
    if (diff < 1000 * 60 * 5) return 'Agora mesmo';
    if (diff < 1000 * 60 * 60) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 1000 * 60 * 60 * 24) return `${Math.floor(diff / 3600000)}h atrás`;
    return lastSeen.toLocaleDateString();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('E-mail copiado para a área de transferência', 'success');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.store_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'inactive') return matchesSearch && u.subscription_status === 'inactive';
    if (filterType === 'pro') return matchesSearch && u.subscription_status === 'active';
    if (filterType === 'expiring') {
      if (!u.subscription_expiry) return false;
      const expiry = new Date(u.subscription_expiry);
      const now = new Date();
      const diffHrs = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
      return matchesSearch && diffHrs > 0 && diffHrs <= 48;
    }
    
    return matchesSearch;
  });

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-slate-900">
            Painel do Administrador {profile?.store_name && `- ${profile.store_name}`}
          </h1>
          <p className="text-body-md font-body-md text-slate-500">Gestão de assinaturas e usuários da plataforma</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-title-md uppercase font-semibold tracking-wider transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
          >
            Usuários
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-title-md uppercase font-semibold tracking-wider transition-all ${activeTab === 'settings' ? 'bg-primary text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-100 hover:bg-slate-50'}`}
          >
            Configurações SaaS
          </button>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all text-xs font-title-md uppercase font-bold tracking-wider"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            <span className="hidden md:inline">Atualizar Dados</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total de Usuários', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
              { label: 'Assinaturas Ativas', value: stats.activeSubscriptions, icon: CreditCard, color: 'from-emerald-400 to-emerald-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'MRR (Mensal)', value: `R$ ${stats.monthlyRevenue.toFixed(2)}`, icon: ArrowUpRight, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
              { label: 'Novos Hoje', value: stats.trialsToday, icon: ShieldCheck, color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' }
            ].map((item, i) => (
              <div key={i} className="group relative bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.color} opacity-[0.03] -mr-8 -mt-8 rounded-full group-hover:scale-110 transition-transform duration-500`} />
                
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${item.bg} ${item.text} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon size={24} />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wide">Status</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mt-1" />
                  </div>
                </div>
                
                <div>
                  <p className="text-body-md font-body-md text-slate-500 mb-1">{item.label}</p>
                  <p className="text-display-lg font-display-lg font-bold font-debug-mono text-slate-900 tracking-tight">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-title-md font-title-md text-slate-900 flex items-center gap-2">
                    <TrendingUp className="text-primary" size={20} />
                    Evolução da Plataforma
                  </h3>
                  <p className="text-body-md font-body-md text-slate-500">Cadastros vs Faturamento (Últimos 30 dias)</p>
                </div>
                <div className="flex items-center gap-4 text-label-sm font-label-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-slate-600">Cadastros</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                    <span className="text-slate-600">MRR (R$)</span>
                  </div>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCadastros" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                      interval={4}
                    />
                    <YAxis 
                      yAxisId="left"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white p-3 rounded-xl shadow-xl border border-slate-100">
                              <p className="text-xs font-bold text-slate-500 mb-2 uppercase">{label}</p>
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-slate-600 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                    Novos Usuários
                                  </span>
                                  <span className="font-bold text-slate-900">{payload[0].value}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-slate-600 flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                                    Faturamento Total
                                  </span>
                                  <span className="font-bold text-violet-600">R$ {Number(payload[1].value).toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="cadastros" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorCadastros)" 
                      animationDuration={1500}
                    />
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="mrr" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorMRR)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-title-md font-title-md text-slate-900 mb-6 flex items-center gap-2">
                <Filter className="text-violet-500" size={20} />
                Filtros Rápidos
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'Todos os Usuários', icon: Users, count: stats.totalUsers },
                  { id: 'pro', label: 'Assinantes ATIVOS', icon: CreditCard, count: stats.activeSubscriptions },
                  { id: 'inactive', label: 'Inativos / Cancelados', icon: XCircle, count: users.filter(u => u.subscription_status === 'inactive').length },
                  { id: 'expiring', label: 'Vencendo em 48h', icon: Clock, count: users.filter(u => {
                    if (!u.subscription_expiry) return false;
                    const expiry = new Date(u.subscription_expiry);
                    const diffHrs = (expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60);
                    return diffHrs > 0 && diffHrs <= 48;
                  }).length },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id as any)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${filterType === f.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-100 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-3 text-body-md font-body-md font-semibold">
                      <f.icon size={18} className={filterType === f.id ? 'text-white' : 'text-slate-400'} />
                      {f.label}
                    </div>
                    <span className={`text-label-sm font-label-sm px-2 py-0.5 rounded-full ${filterType === f.id ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-8 p-4 bg-violet-50 rounded-xl border border-violet-100">
                <p className="text-label-sm font-label-sm text-violet-700 font-bold mb-1">Previsão de Faturamento</p>
                <p className="text-title-md font-title-md font-debug-mono text-violet-900">R$ {stats.monthlyRevenue.toFixed(2)} /mês</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  type="text"
                  placeholder="Buscar por e-mail ou loja..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 text-sm font-medium text-slate-900 placeholder:text-slate-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="text-sm font-bold text-slate-600">
                Exibindo <span className="text-slate-900">{filteredUsers.length}</span> usuários
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200">
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide">Usuário / Loja</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide">Último Acesso</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide">Última Venda</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide">Validade</th>
                    <th className="px-6 py-4 text-label-sm font-label-sm text-slate-700 uppercase tracking-wide text-right font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Carregando...</td>
                      </tr>
                    ))
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400">Nenhum usuário encontrado</td>
                    </tr>
                  ) : filteredUsers.map((userProfile) => (
                    <tr key={userProfile.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-body-md font-body-md">{userProfile.email}</span>
                          <span className="text-label-sm font-label-sm text-slate-500 font-semibold uppercase tracking-wide mt-0.5">{userProfile.store_name || 'Carrinho não configurado'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-label-sm uppercase font-semibold
                          ${userProfile.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-800' : 
                            userProfile.subscription_status === 'trial' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}
                          border ${userProfile.subscription_status === 'active' ? 'border-emerald-200' : 
                            userProfile.subscription_status === 'trial' ? 'border-blue-200' : 'border-red-200'}
                        `}>
                          {userProfile.subscription_status === 'active' ? <CheckCircle2 size={12} /> : 
                           userProfile.subscription_status === 'trial' ? <Clock size={12} /> : <XCircle size={12} />}
                          {userProfile.subscription_status === 'active' ? 'Ativo' : 
                           userProfile.subscription_status === 'trial' ? 'Teste' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-700 text-body-md font-body-md font-semibold">
                          <Activity size={16} className={userProfile.last_seen_at && (new Date().getTime() - new Date(userProfile.last_seen_at).getTime() < 300000) ? "text-emerald-600 animate-pulse" : "text-slate-400"} />
                          {formatLastSeen(userProfile.last_seen_at)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-2 text-slate-700 text-body-md font-body-md font-semibold font-debug-mono">
                          <TrendingUp size={16} className="text-indigo-500" />
                          {userProfile.last_sale_at ? new Date(userProfile.last_sale_at).toLocaleDateString() : 'Sem vendas'}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-700 text-body-md font-body-md font-semibold font-debug-mono">
                          <Calendar size={16} className="text-slate-400" />
                          {userProfile.subscription_expiry ? new Date(userProfile.subscription_expiry).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedUser(userProfile)}
                            className="p-2 text-primary hover:bg-emerald-50 rounded-xl transition-all hover:scale-110 active:scale-95 animate-fade-in"
                            title="Gerenciar Usuário"
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Management Modal */}
          {selectedUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div 
                className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative p-8 pb-0 flex items-start justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                      <Users size={32} />
                    </div>
                    <div>
                      <h2 className="text-headline-lg font-headline-lg text-slate-900 leading-tight">Gestão de Conta</h2>
                      <p className="text-body-md font-body-md text-slate-500 font-medium">{selectedUser.email}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="p-8">
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wide mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm font-bold uppercase
                        ${selectedUser.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                          selectedUser.subscription_status === 'trial' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}
                      `}>
                        {selectedUser.subscription_status}
                      </span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wide mb-1">Cargo</p>
                      <p className="text-body-md font-body-md font-semibold text-slate-900 uppercase">{selectedUser.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wide mb-1">Loja</p>
                      <p className="text-body-md font-body-md font-semibold text-slate-900 truncate">{selectedUser.store_name || 'N/A'}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wide mb-1">Validade</p>
                      <p className="text-body-md font-body-md font-semibold text-slate-900 font-debug-mono">
                        {selectedUser.subscription_expiry ? new Date(selectedUser.subscription_expiry).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="space-y-4">
                    <p className="text-label-sm font-label-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Ações Estratégicas</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => { toggleSubscription(selectedUser.id, selectedUser.subscription_status); }}
                        className={`flex items-center gap-4 p-4 rounded-[1.5rem] border-2 transition-all group ${
                          selectedUser.subscription_status === 'active' 
                          ? 'border-red-50 hover:bg-red-50 bg-white' 
                          : 'border-emerald-50 hover:bg-emerald-50 bg-white'
                        }`}
                      >
                        <div className={`p-3 rounded-2xl ${
                          selectedUser.subscription_status === 'active' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          <CreditCard size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-title-md font-semibold text-slate-900">
                            {selectedUser.subscription_status === 'active' ? 'Suspender Assinatura' : 'Ativar Assinatura PRO'}
                          </p>
                          <p className="text-label-sm font-label-sm text-slate-500">Mudar status financeiro</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { extendTrial(selectedUser.id); }}
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] border-2 border-blue-50 bg-white hover:bg-blue-50 transition-all group"
                      >
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                          <Plus size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-title-md font-semibold text-slate-900">Extender Teste</p>
                          <p className="text-label-sm font-label-sm text-slate-500">Adicionar +7 dias bônus</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { changeRole(selectedUser.id, selectedUser.role); }}
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] border-2 border-violet-50 bg-white hover:bg-violet-50 transition-all group"
                      >
                        <div className="p-3 bg-violet-100 text-violet-600 rounded-2xl">
                          <UserCog size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-title-md font-semibold text-slate-900">Alterar Cargo</p>
                          <p className="text-label-sm font-label-sm text-slate-500">Alternar Administrador</p>
                        </div>
                      </button>

                      <button
                        onClick={() => { copyToClipboard(selectedUser.email); }}
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] border-2 border-slate-50 bg-white hover:bg-slate-50 transition-all group"
                      >
                        <div className="p-3 bg-slate-100 text-slate-600 rounded-2xl">
                          <Copy size={20} />
                        </div>
                        <div className="text-left">
                          <p className="font-title-md font-semibold text-slate-900">Copiar Contato</p>
                          <p className="text-label-sm font-label-sm text-slate-500">E-mail para suporte</p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <button
                        onClick={() => { if(confirm('Esta ação removerá todos os dados deste usuário. Continuar?')) { deleteUser(selectedUser.id); } }}
                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-white/20 rounded-2xl">
                            <Trash2 size={24} />
                          </div>
                          <div className="text-left">
                            <p className="font-title-md font-semibold">Remover Conta do Sistema</p>
                            <p className="text-label-sm font-label-sm opacity-80">Ação imediata e permanente</p>
                          </div>
                        </div>
                        <ArrowUpRight size={24} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <CreditCard size={28} />
            </div>
            <h3 className="text-title-md font-title-md text-slate-900 mb-2">Preço da Assinatura</h3>
            <p className="text-body-md font-body-md text-slate-500 mb-6">Defina o valor base para o cálculo do seu MRR e cobranças.</p>
            
            <div className="space-y-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-lg font-debug-mono">R$</span>
                </div>
                <input 
                  type="number" 
                  step="0.01"
                  className="w-full pl-14 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-emerald-500 focus:bg-white outline-none text-display-lg font-display-lg font-bold font-debug-mono transition-all"
                  value={pricing.price}
                  onChange={(e) => setPricing({ ...pricing, price: Number(e.target.value) })}
                />
              </div>
              <button 
                onClick={updateSettings}
                className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-title-md uppercase tracking-wider text-xs shadow-lg shadow-emerald-200 hover:bg-emerald-600 hover:-translate-y-1 active:translate-y-0 transition-all font-semibold"
              >
                Atualizar Preço
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl transition-all duration-300 group">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Activity size={28} />
            </div>
            <h3 className="text-title-md font-title-md text-slate-900 mb-2">Aviso Global</h3>
            <p className="text-body-md font-body-md text-slate-500 mb-6">Envie mensagens em tempo real para todos os logados.</p>
            
            <div className="space-y-6">
              <textarea 
                className="w-full p-5 bg-slate-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white outline-none h-32 text-body-md font-body-md transition-all"
                placeholder="Ex: Manutenção agendada para 23:59..."
                value={pricing.announcement}
                onChange={(e) => setPricing({ ...pricing, announcement: e.target.value })}
              />
              <button 
                onClick={updateSettings}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-title-md uppercase tracking-wider text-xs shadow-lg shadow-amber-200 hover:bg-amber-600 hover:-translate-y-1 active:translate-y-0 transition-all font-semibold"
              >
                Publicar Agora
              </button>
            </div>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-32 -mt-32" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-title-md font-title-md mb-2 text-white">Resumo Operacional</h3>
              <p className="text-body-md font-body-md text-slate-400 mb-8">Saúde geral do seu negócio SaaS.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wide mb-1">Taxa Churn</p>
                  <p className="text-title-md font-title-md font-debug-mono">{(users.filter(u => u.subscription_status === 'inactive').length / users.length * 100 || 0).toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wide mb-1">Ticket Médio</p>
                  <p className="text-title-md font-title-md font-debug-mono">R$ {pricing.price.toFixed(0)}</p>
                </div>
                <div className="col-span-2 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                   <div>
                    <p className="text-label-sm font-label-sm text-emerald-400 uppercase tracking-wide mb-1">Novos Leads</p>
                    <p className="text-title-md font-title-md text-emerald-300 font-debug-mono">{users.filter(u => u.subscription_status === 'trial').length}</p>
                   </div>
                   <div className="text-emerald-450">
                    <TrendingUp size={24} />
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
