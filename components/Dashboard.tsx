import React, { useMemo, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign, ShoppingBag, AlertTriangle, TrendingUp, Trophy, PieChart, Calendar, Loader2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { products, sales, loading } = useStore();
  const [period, setPeriod] = useState<'today' | '7days' | 'month'>('7days');

  const activeSales = useMemo(() => sales.filter(s => s.status !== 'canceled'), [sales]);
  const totalStockValue = useMemo(() => products.reduce((acc, p) => acc + (p.price * p.stock), 0), [products]);

  // Filtra as vendas com base no período selecionado
  const filteredSalesForStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (period === 'today') {
      return activeSales.filter(sale => sale.timestamp >= startOfToday);
    } else if (period === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return activeSales.filter(sale => sale.timestamp >= startOfMonth);
    } else {
      // Últimos 7 dias
      const startOf7DaysAgo = startOfToday - 6 * 24 * 60 * 60 * 1000;
      return activeSales.filter(sale => sale.timestamp >= startOf7DaysAgo);
    }
  }, [activeSales, period]);

  // Cálculos dinâmicos com base no período selecionado
  const periodRevenue = useMemo(() => {
    return filteredSalesForStats.reduce((acc, sale) => acc + sale.total, 0);
  }, [filteredSalesForStats]);

  const periodProfit = useMemo(() => {
    return filteredSalesForStats.reduce((acc, sale) => acc + sale.profit, 0);
  }, [filteredSalesForStats]);

  const topProducts = useMemo(() => {
    const productCounts: Record<string, number> = {};
    filteredSalesForStats.forEach(sale => {
      sale.items.forEach(item => {
        productCounts[item.id] = (productCounts[item.id] || 0) + item.quantity;
      });
    });

    return Object.entries(productCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => {
        const product = products.find(p => p.id === id);
        return product ? { ...product, soldCount: count } : null;
      })
      .filter((item): item is (typeof products[0] & { soldCount: number }) => item !== null);
  }, [filteredSalesForStats, products]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Dashboard</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  const salesData = useMemo(() => {
    if (period === 'today') {
      // Agrupa em blocos de 2 horas
      const hours = [8, 10, 12, 14, 16, 18, 20, 22];
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      return hours.map(h => {
        const blockStart = startOfToday + h * 60 * 60 * 1000;
        const blockEnd = blockStart + 2 * 60 * 60 * 1000;

        const totalInBlock = activeSales
          .filter(sale => sale.timestamp >= blockStart && sale.timestamp < blockEnd)
          .reduce((sum, sale) => sum + sale.total, 0);

        return {
          name: `${String(h).padStart(2, '0')}h-${String(h + 2).padStart(2, '0')}h`,
          valor: parseFloat(totalInBlock.toFixed(2))
        };
      });
    }

    if (period === 'month') {
      // Agrupa por semanas do mês
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      
      const weeks = [
        { name: 'Sem. 1', start: 1, end: 7 },
        { name: 'Sem. 2', start: 8, end: 14 },
        { name: 'Sem. 3', start: 15, end: 21 },
        { name: 'Sem. 4+', start: 22, end: 31 },
      ];

      return weeks.map(w => {
        const startTimestamp = new Date(currentYear, currentMonth, w.start, 0, 0, 0).getTime();
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const endDay = Math.min(w.end, lastDayOfMonth);
        const endTimestamp = new Date(currentYear, currentMonth, endDay, 23, 59, 59).getTime();

        const totalInWeek = activeSales
          .filter(sale => sale.timestamp >= startTimestamp && sale.timestamp <= endTimestamp)
          .reduce((sum, sale) => sum + sale.total, 0);

        return {
          name: w.name,
          valor: parseFloat(totalInWeek.toFixed(2))
        };
      });
    }

    // Padrão: 7 dias corridos
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d;
    }).reverse();

    return days.map(day => {
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;

      const dailyTotal = activeSales
        .filter(sale => sale.timestamp >= dayStart && sale.timestamp < dayEnd)
        .reduce((sum, sale) => sum + sale.total, 0);

      const dayOfWeek = day.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const dayAndMonth = day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const label = `${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)} (${dayAndMonth})`;

      return {
        name: label,
        valor: parseFloat(dailyTotal.toFixed(2))
      };
    });
  }, [activeSales, period]);

  const lowStockCount = products.filter(p => p.stock < 5).length;

  return (
    <div className="space-y-5 animate-fade-in">
      <header className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">Visão Geral do Negócio</h2>
          <p className="text-xs lg:text-sm text-slate-500 mt-0.5">Métricas de faturamento, lucro e estoque em tempo real.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
          <Calendar size={14} className="text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as any)}
            className="bg-transparent text-xs font-bold text-slate-700 outline-none focus:outline-none cursor-pointer"
          >
            <option value="today">Hoje</option>
            <option value="7days">Últimos 7 dias</option>
            <option value="month">Este Mês</option>
          </select>
        </div>
      </header>

      <div className="grid grid-sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Card Faturamento */}
        <div className="bg-white p-3 md:p-3.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full shrink-0">
            <DollarSign size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Faturamento</p>
            <p className="font-medium font-mono text-lg lg:text-xl text-slate-900 whitespace-nowrap leading-tight mt-0.5">
              R$ {periodRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Card Lucro Estimado */}
        <div className="bg-white p-3 md:p-3.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-full shrink-0">
            <TrendingUp size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Lucro Estimado</p>
            <p className="font-medium font-mono text-lg lg:text-xl text-emerald-600 whitespace-nowrap leading-tight mt-0.5">
              R$ {periodProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Card Valor em Estoque */}
        <div className="bg-white p-3 md:p-3.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full shrink-0">
            <PieChart size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Valor em Estoque</p>
            <p className="font-medium font-mono text-lg lg:text-xl text-slate-900 whitespace-nowrap leading-tight mt-0.5">
              R$ {totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Card Alerta de Reposição */}
        <div className={`bg-white p-3 md:p-3.5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3 relative overflow-hidden transition-all duration-300`}>
          {lowStockCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
          <div className={`p-2 rounded-full shrink-0 ${lowStockCount === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Alertas de Reposição</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`font-medium font-mono text-lg lg:text-xl leading-tight ${lowStockCount === 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {lowStockCount}
              </span>
              {lowStockCount === 0 ? (
                <span className="px-1.5 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-bold rounded-md uppercase tracking-wider">
                  Tudo em dia
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-red-50 border border-red-250 text-red-600 text-[9px] font-bold rounded-md uppercase tracking-wider">
                  Repor itens
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-title-md font-title-md text-slate-800 mb-6">Vendas Recentes</h3>
          {activeSales.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 20, right: 40, left: 10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                  />
                  <Tooltip 
                    formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Faturamento']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="valor"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#areaGradient)"
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, fill: '#10b981' }}
                    label={(props: any) => {
                      const { x, y, value } = props;
                      if (!value || value <= 0) return null;
                      return (
                        <text
                          x={x}
                          y={y - 12}
                          fill="#374151"
                          fontSize={11}
                          textAnchor="middle"
                          fontWeight="600"
                        >
                          {value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </text>
                      );
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 p-6 text-center">
              <TrendingUp size={40} className="text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Sem dados de faturamento</p>
              <p className="text-slate-400 text-xs max-w-xs mt-1">Realize vendas no módulo PDV para gerar gráficos e estatísticas de vendas em tempo real.</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-yellow-600" />
            <h3 className="text-title-md font-title-md text-slate-900">Mais Vendidos</h3>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <span className="font-mono text-slate-400 w-4">{i + 1}</span>
                  <img src={p.imageUrl} className="w-10 h-10 rounded-lg object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-md font-body-md font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-label-sm font-label-sm text-slate-500 uppercase tracking-wider">{p.soldCount} unidades</p>
                  </div>
                  <p className="font-mono font-medium text-emerald-600 font-bold">R$ {p.price.toFixed(2)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 text-center">
              <Trophy size={32} className="text-slate-200 mb-2" />
              <p className="font-bold text-slate-700 text-sm">Nenhum ranking disponível</p>
              <p className="text-slate-400 text-xs max-w-[200px] mt-1">Os produtos mais vendidos serão calculados aqui automaticamente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
