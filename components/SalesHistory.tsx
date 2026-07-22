import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';
import { Sale } from '../types';
import { Clock, CreditCard, Banknote, QrCode, AlertTriangle, X, RotateCcw, Ban, ShieldCheck, ShieldAlert, Key, Info, Calendar, Filter, ChevronRight, FileDown, User, PlusCircle, Printer, Ticket, FileText, Search, Loader2 } from 'lucide-react';
import { printReceipt } from '../services/receiptService';

export const SalesHistory: React.FC = () => {
  const { sales, cancelSale, isDefaultPassword, updateAdminPassword, exportSalesToCSV, loading, updateSaleStatus } = useStore();
  const [saleToCancel, setSaleToCancel] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'24h' | 'custom'>('24h');
  const [startDate, setStartDate] = useState<string>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  });

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    return sales.filter(sale => {
      let matchesTime = false;
      if (filterMode === '24h') {
        matchesTime = sale.timestamp >= twentyFourHoursAgo;
      } else {
        const selectedStart = new Date(startDate + 'T00:00:00').getTime();
        matchesTime = sale.timestamp >= selectedStart;
      }

      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        sale.id.toLowerCase().includes(searchLower) ||
        (sale.customerName && sale.customerName.toLowerCase().includes(searchLower));
        
      return matchesTime && matchesSearch;
    });
  }, [sales, filterMode, startDate, searchTerm]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'credit': return <CreditCard size={16} className="text-blue-500" />;
      case 'debit': return <CreditCard size={16} className="text-sky-500" />;
      case 'cash': return <Banknote size={16} className="text-emerald-500" />;
      case 'pix': return <QrCode size={16} className="text-teal-500" />;
      default: return <CreditCard size={16} />;
    }
  };

  const handleCancelSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;
    setError('');
    if (isDefaultPassword) {
      if (password.length < 4) { setError('Mínimo 4 caracteres.'); return; }
      if (password !== confirmPassword) { setError('Senhas não conferem.'); return; }
      if (cancelSale(saleToCancel, 'admin').success) {
        updateAdminPassword('admin', password);
        closeModals();
      } else setError('Erro ao estornar.');
    } else {
      if (cancelSale(saleToCancel, password).success) closeModals();
      else setError('Senha incorreta.');
    }
  };

  const closeModals = () => {
    setSaleToCancel(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const handleConfirmarPix = async (sale: Sale) => {
    try {
      await updateSaleStatus(sale.id, 'completed');

      let phone = '';
      if (sale.customerName) {
        const { data: custData } = await supabase
          .from('customers')
          .select('phone')
          .ilike('name', `%${sale.customerName.trim()}%`)
          .limit(1);

        if (custData && custData.length > 0 && custData[0].phone) {
          phone = custData[0].phone;
        }
      }

      const mensagemSucesso = `*✅ Comprovante recebido com sucesso!*\n\nMuito obrigado pelo seu pedido! 😊 Seu pagamento foi confirmado e daremos continuidade ao processamento. Agradecemos pela preferência!`;

      if (phone) {
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length > 0) {
          if (!cleanPhone.startsWith('55')) {
            cleanPhone = `55${cleanPhone}`;
          }
          window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(mensagemSucesso)}`, '_blank');
          return;
        }
      }

      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensagemSucesso)}`, '_blank');
    } catch (err) {
      console.error("Erro ao confirmar Pix:", err);
    }
  };

  const stats = useMemo(() => {
    return filteredSales.reduce((acc, sale) => {
      if (sale.status === 'completed') {
        acc.revenue += sale.total;
        acc.profit += sale.profit;
        acc.items += sale.items.reduce((sum, i) => sum + i.quantity, 0);
        acc.count += 1;
      }
      return acc;
    }, { revenue: 0, profit: 0, items: 0, count: 0 });
  }, [filteredSales]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Vendas</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold font-sans text-slate-800">Histórico de Movimentação</h2>
          <p className="text-sm font-sans text-slate-500">Consulte vendas, estorne pagamentos e gere relatórios.</p>
        </div>
        <button onClick={exportSalesToCSV} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all shadow-sm font-sans font-medium text-xs uppercase tracking-wider active:scale-95">
          <FileDown size={14} className="text-emerald-400" /> Relatório CSV
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Vendas (Período)</p>
          <p className="text-lg font-mono font-semibold text-slate-800">{stats.count}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Faturamento</p>
          <p className="text-lg font-mono font-semibold text-slate-800">R$ {stats.revenue.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm group hover:border-emerald-200 transition-all">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Itens Vendidos</p>
          <p className="text-lg font-mono font-semibold text-slate-800">{stats.items}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-200 transition-all">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Lucro Estimado</p>
          <p className="text-lg font-mono font-semibold text-slate-800">R$ {stats.profit.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white px-4 py-2.5 rounded-xl border-2 border-slate-200 shadow-sm flex flex-col xl:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider min-w-[130px]">
          <Filter size={14} className="text-indigo-500" /> Filtros de Busca
        </div>

        <div className="relative flex-1 w-full min-w-[200px] group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-all" size={14} />
          <input 
            type="text" 
            placeholder="Buscar por ID (ex: #1778) ou Cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-white border-2 border-slate-300 rounded-lg text-sm text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-sm placeholder:font-normal placeholder:text-slate-400"
          />
        </div>

        <div className="flex p-0.5 bg-slate-100 rounded-xl w-full md:w-auto border border-slate-200">
          <button onClick={() => setFilterMode('24h')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterMode === '24h' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Últimas 24h</button>
          <button onClick={() => setFilterMode('custom')} className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${filterMode === 'custom' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Personalizado</button>
        </div>

        {filterMode === 'custom' && (
          <div className="flex items-center gap-3 w-full md:w-auto animate-fade-in">
            <ChevronRight size={16} className="text-slate-300 hidden md:block" />
            <div className="relative flex-1 md:flex-none group">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-700 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all cursor-pointer shadow-sm"
              />
            </div>
          </div>
        )}
      </div>

      {sales.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl min-h-[350px]">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4 border-2 border-slate-200">
            <Clock size={32} />
          </div>
          <h3 className="text-title-md font-title-md text-slate-800 mb-2">Nenhuma venda registrada</h3>
          <p className="text-body-md font-body-md text-slate-500 max-w-sm">Suas vendas finalizadas no PDV aparecerão aqui com o histórico detalhado e relatórios financeiros.</p>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="p-8 text-center bg-white border border-slate-100 rounded-3xl text-slate-500 font-bold">
          Nenhuma venda encontrada correspondente aos filtros de busca ou período.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSales.map(sale => {
            const isCanceled = sale.status === 'canceled';
            const isPending = sale.status === 'pending' || sale.status === 'awaiting_payment';
            
            return (
              <div key={sale.id} className={`bg-white border-2 ${isCanceled ? 'border-red-100 bg-red-50/20 grayscale opacity-60' : isPending ? 'border-amber-200 bg-amber-50/10' : 'border-slate-100'} rounded-xl p-3 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center relative transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3 min-w-[160px]">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 ${isCanceled ? 'bg-red-50 border-red-200 text-red-400' : isPending ? 'bg-amber-50 border-amber-200 text-amber-500' : 'bg-slate-50 border-slate-100 text-slate-500'}`}><Clock size={16} /></div>
                  <div>
                    <p className="font-mono font-bold text-slate-900 leading-tight text-sm">#{sale.id}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{new Date(sale.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {new Date(sale.timestamp).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {sale.items.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-600 font-semibold leading-none">
                        {item.quantity}x {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {sale.customerName && <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"><User size={10} className="text-indigo-400" /> Cliente: {sale.customerName}</div>}
                    {sale.surcharge > 0 && <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-500 uppercase tracking-wider font-mono"><PlusCircle size={10} /> Taxa Cartão: R$ {sale.surcharge.toFixed(2)}</div>}
                    {isPending && (
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 uppercase tracking-wider animate-pulse">
                          <Info size={10} /> Aguardando Pagamento
                        </div>
                        {sale.expiresAt && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                            <Clock size={10} /> Expira às: {new Date(sale.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end border-t border-slate-100 lg:border-none pt-2.5 lg:pt-0">
                  <div className="bg-slate-50 px-2   py-1 rounded-lg border border-slate-200 flex items-center gap-1.5">
                     {getPaymentIcon(sale.paymentMethod)}
                     <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{sale.paymentMethod}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wide text-slate-400 uppercase mb-0.5">Total</p>
                    <p className={`text-sm font-mono font-medium tracking-tight ${isCanceled ? 'text-red-400 line-through' : isPending ? 'text-amber-600' : 'text-emerald-600'}`}>R$ {sale.total.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    {isPending && (
                        <button 
                          onClick={() => handleConfirmarPix(sale)}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm font-sans font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5"
                        >
                          <ShieldCheck size={14} /> Confirmar Pix
                        </button>
                    )}
                    {!isCanceled && !isPending && (
                      <>
                        <button 
                          onClick={() => printReceipt(sale, 'thermal')} 
                          className="w-8 h-8 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 border border-emerald-100 rounded-lg transition-all shadow-sm group relative shrink-0"
                          title="Imprimir Cupom 58mm"
                        >
                          <Ticket size={16} />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Térmica 58mm</span>
                        </button>
                        
                        <button 
                          onClick={() => printReceipt(sale, 'a4')} 
                          className="w-8 h-8 flex items-center justify-center text-indigo-600 hover:bg-indigo-50 border border-indigo-100 rounded-lg transition-all shadow-sm group relative shrink-0"
                          title="Imprimir A4"
                        >
                          <FileText size={16} />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Relatório A4</span>
                        </button>
                        
                        <button 
                          onClick={() => setSaleToCancel(sale.id)} 
                          className="w-8 h-8 flex items-center justify-center text-amber-500 hover:bg-amber-50 border border-amber-100 rounded-lg transition-all shadow-sm group relative shrink-0"
                          title="Estornar Venda"
                        >
                          <RotateCcw size={16} />
                          <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Estornar</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {saleToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isDefaultPassword ? 'bg-indigo-50 text-indigo-800' : 'bg-amber-50 text-amber-800'}`}>
              <h3 className="text-title-md font-title-md uppercase tracking-wide flex items-center gap-2">
                {isDefaultPassword ? <ShieldCheck size={22} /> : <RotateCcw size={22} />}
                {isDefaultPassword ? 'Segurança Administrativa' : 'Confirmar Estorno'}
              </h3>
              <button onClick={closeModals} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleCancelSale} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-body-md font-body-md text-slate-600 leading-relaxed font-semibold">
                {isDefaultPassword 
                  ? "Como este é seu primeiro estorno, você precisa criar sua senha administrativa personalizada para prosseguir com segurança." 
                  : <>Você está removendo <span className="font-debug-mono text-debug-mono font-bold">R$ {sales.find(s=>s.id===saleToCancel)?.total.toFixed(2)}</span> do faturamento. O estoque dos itens do pedido <span className="font-debug-mono text-debug-mono font-bold">#{saleToCancel}</span> será devolvido.</>
                }
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">{isDefaultPassword ? 'Nova Senha Admin' : 'Sua Senha Mestre'}</label>
                  <input 
                    autoFocus type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                    placeholder="••••••••" required
                  />
                </div>
                {isDefaultPassword && (
                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">Confirmar Senha</label>
                    <input 
                      type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                      placeholder="••••••••" required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">{error}</div>}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={closeModals} className="flex-1 px-4 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 font-title-md text-xs uppercase tracking-wider transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-4 text-white rounded-2xl font-title-md text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] ${isDefaultPassword ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}>Estornar Pedido</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
