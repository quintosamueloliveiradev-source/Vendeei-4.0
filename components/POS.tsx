import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product, Customer } from '../types';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ShoppingBasket, User, Tag, Percent, Barcode, Printer, CheckCircle2, Ticket, FileText, X, Loader2 } from 'lucide-react';
import { printReceipt } from '../services/receiptService';
import { Sale } from '../types';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { CustomerFormModal } from './CustomerFormModal';

export const POS: React.FC = () => {
  const { products, cart, addToCart, removeFromCart, updateCartQuantity, completeSale, addToast, user, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [cardTaxPercent, setCardTaxPercent] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  useEffect(() => {
    if (customerSearch.length < 2 || selectedCustomer) {
      setCustomerResults([]);
      setShowDropdown(false);
      return;
    }

    const searchCustomers = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .or(`name.ilike.%${customerSearch}%,cpf.ilike.%${customerSearch}%,phone.ilike.%${customerSearch}%`)
        .limit(5);

      if (error) {
        console.error(error);
        return;
      }

      setCustomerResults(data.map((c: any) => ({
        id: c.id,
        name: c.name,
        contact: c.phone,
        cpf: c.cpf,
        createdAt: c.created_at,
        totalSpent: Number(c.total_spent)
      })));
      setShowDropdown(true);
    };

    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer, user]);

  const isSearching = searchTerm.trim().length > 0;
  const filteredProducts = isSearching 
    ? products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.barcode && p.barcode === searchTerm.trim())
      )
    : [];

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Cálculo da taxa baseado no subtotal após desconto
  const baseForTax = Math.max(0, subtotal - discount);
  const surchargeValue = (baseForTax * (cardTaxPercent / 100));
  
  const total = baseForTax + surchargeValue;
  const change = receivedAmount > total ? receivedAmount - total : 0;

  const handleComplete = async (method: 'credit' | 'debit' | 'cash' | 'pix') => {
    // Aplicamos a taxa apenas se for cartão (credit/debit) ou se o lojista desejar para outros
    // Neste caso, se o método for dinheiro, ignoramos a taxa informada
    const finalSurcharge = (method === 'credit' || method === 'debit') ? surchargeValue : 0;
    
    const saleCustomerName = selectedCustomer ? selectedCustomer.name : customerSearch.toUpperCase().trim();
    const sale = await completeSale(method, discount, selectedCustomer, finalSurcharge);
    if (sale) {
      setLastSale(sale);
      setShowSuccessModal(true);
    }

    setCustomerSearch('');
    setSelectedCustomer(null);
    setDiscount(0);
    setCardTaxPercent(0);
    setSearchTerm('');
    setReceivedAmount(0);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando PDV</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-2rem)] gap-6 overflow-hidden">
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-2.5 border-b border-slate-100 bg-slate-50/30">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
            <input 
              type="text" 
              placeholder="Buscar produto por nome ou bipar código de barras..." 
              className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-slate-400 rounded-xl text-sm font-bold text-slate-900 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto text-center p-8">
              <div className="p-8 bg-slate-100 rounded-[2rem] mb-6 border-2 border-slate-200 text-slate-400">
                <ShoppingBasket size={64} />
              </div>
              <h3 className="text-title-md font-title-md text-slate-800 mb-2">Nenhum produto cadastrado</h3>
              <p className="text-body-md font-body-md text-slate-500 mb-6 leading-relaxed">
                Você precisa cadastrar pelo menos um produto no estoque antes de realizar vendas no PDV.
              </p>
            </div>
          ) : !isSearching ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="p-4 bg-slate-100 rounded-full mb-3 border-2 border-slate-200">
                <Search size={32} className="text-slate-300" />
              </div>
              <p className="text-xs font-light text-slate-500 uppercase tracking-wider">Digite acima para buscar produtos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <button
                  key={p.id}
                  disabled={p.stock === 0}
                  onClick={() => addToCart(p)}
                  className="flex flex-col text-left border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition-all active:scale-95 disabled:opacity-50 group"
                >
                  <div className="relative h-28 w-full overflow-hidden">
                    <img src={p.imageUrl} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {p.stock === 0 && <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-red-600 text-xs">SEM ESTOQUE</div>}
                  </div>
                  <div className="p-3 bg-white">
                    <h4 className="text-body-md font-body-md font-bold text-slate-800 truncate">{p.name}</h4>
                    <p className="text-label-sm font-label-sm text-slate-500 mb-2 uppercase tracking-wider">{p.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono font-medium tracking-tight text-emerald-600">R$ {p.price.toFixed(2)}</span>
                      <span className={`text-debug-mono font-debug-mono px-1.5 py-0.5 rounded font-bold ${p.stock < 5 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock} un</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="w-full lg:w-96 flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Bloco de fechamento de cima fixo */}
        <div className="p-2.5 bg-white border-b border-slate-100 space-y-2 shadow-sm z-10">
          {/* Sessão de Identificação do Cliente */}
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-600 transition-colors" size={14} />
            <input 
              type="text" 
              placeholder="Buscar cliente por nome, CPF ou telefone..." 
              className="w-full pl-8 pr-16 py-1.5 bg-white border-2 border-slate-300 rounded-xl text-sm text-slate-600 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none transition-all shadow-sm"
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value);
                setSelectedCustomer(null);
              }}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                title="Cadastrar Novo Cliente"
                onClick={() => setIsCustomerModalOpen(true)}
                className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600 transition-colors"
                type="button"
              >
                <Plus size={16} />
              </button>
              {selectedCustomer && (
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showDropdown && customerResults.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-slate-200 rounded-xl mt-1 shadow-lg z-50 overflow-hidden">
                {customerResults.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm border-b border-slate-50 last:border-b-0"
                  >
                    <p className="font-bold text-slate-900">{customer.name}</p>
                    <p className="text-[10px] text-slate-500">{customer.cpf}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md ring-1 ring-white/10">
            <div className="px-3 py-1.5 bg-emerald-500 text-white flex items-center justify-between relative">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wide leading-none opacity-90">Total Final</span>
                <span className="text-xl font-mono font-semibold tracking-tight mt-0.5">R$ {total.toFixed(2)}</span>
              </div>
              {receivedAmount > total && (
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: "easeInOut" }}
                  className="bg-slate-600 text-white px-2.5 py-1 rounded-lg border border-slate-700 shadow text-right text-sm font-mono flex flex-col items-end gap-0.5"
                >
                  <span className="text-[9px] uppercase tracking-wider leading-none text-slate-200">Troco</span>
                  <span className="text-sm font-semibold leading-none">R$ {change.toFixed(2)}</span>
                </motion.div>
              )}
            </div>

            <div className="px-2.5 py-2 grid grid-cols-12 gap-1.5 bg-slate-900">
              {/* Desconto */}
              <div className="col-span-3 relative group">
                <Tag className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-400 transition-colors" size={10} />
                <input 
                  type="number" 
                  placeholder="Desc." 
                  className="w-full pl-5 pr-1 py-1.5 bg-slate-800 border-2 border-white/20 rounded-lg text-xs font-bold text-red-400 focus:border-red-450 focus:border-red-400 focus:outline-none transition-all placeholder:text-slate-500 font-mono shadow-sm"
                  value={discount || ''}
                  onChange={e => setDiscount(Number(e.target.value))}
                />
              </div>

              {/* % Taxa */}
              <div className="col-span-3 relative group">
                <Percent className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-400 transition-colors" size={10} />
                <input 
                  type="number" 
                  placeholder="Taxa" 
                  className="w-full pl-5 pr-1 py-1.5 bg-slate-800 border-2 border-white/20 rounded-lg text-xs font-bold text-indigo-400 focus:border-indigo-450 focus:border-indigo-400 focus:outline-none transition-all placeholder:text-slate-500 font-mono shadow-sm"
                  value={cardTaxPercent || ''}
                  onChange={e => setCardTaxPercent(Number(e.target.value))}
                />
              </div>

              {/* Valor Recebido */}
              <div className="col-span-6 relative group">
                <Banknote className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-400 transition-colors" size={12} />
                <input 
                  type="number" 
                  className="w-full pl-6 pr-2 py-1.5 bg-slate-800 border-2 border-white/20 rounded-lg text-xs sm:text-sm font-bold text-white focus:border-emerald-400 focus:outline-none transition-all placeholder:text-slate-500 font-mono text-emerald-400"
                  placeholder="Recebido"
                  value={receivedAmount || ''}
                  onChange={e => setReceivedAmount(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => handleComplete('pix')} disabled={cart.length === 0} className="py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 uppercase tracking-wider border border-slate-900 shadow-md group">
              <QrCode size={16} className="text-teal-400 group-hover:scale-110 transition-transform" /> Pix
            </button>
            <button onClick={() => handleComplete('credit')} disabled={cart.length === 0} className="py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 uppercase tracking-wider border border-slate-900 shadow-md group">
              <CreditCard size={16} className="text-indigo-400 group-hover:scale-110 transition-transform" /> Cartão
            </button>
            <button onClick={() => handleComplete('cash')} disabled={cart.length === 0} className="py-2 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-black transition-all active:scale-95 disabled:opacity-40 flex flex-col items-center justify-center gap-1 uppercase tracking-wider border border-slate-900 shadow-md group">
              <Banknote size={16} className="text-emerald-400 group-hover:scale-110 transition-transform" /> Dinheiro
            </button>
          </div>
        </div>

        {/* Área de listagem de produtos embaixo que ocupa o restante do espaço com scroll vertical */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-100/50">
          {cart.length > 0 && (
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Itens Selecionados</span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full">{cart.length === 1 ? '1 item' : `${cart.length} itens no pedido atual`}</span>
            </div>
          )}
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500">
              <ShoppingBasket size={64} className="mb-4 text-slate-200" />
              <p className="text-label-sm font-label-sm uppercase tracking-wider text-slate-400">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-200 transition-colors">
                <img src={item.imageUrl} className="w-14 h-14 rounded-lg object-cover shadow-sm border border-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="text-body-md font-body-md font-bold text-slate-900 truncate leading-tight">{item.name}</p>
                  <p className="text-sm font-mono font-medium tracking-tight text-emerald-700 mt-0.5">R$ {item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border-2 border-slate-300">
                  <button onClick={() => updateCartQuantity(item.id, -1)} className="p-1 hover:bg-white hover:text-red-500 rounded-lg transition-all shadow-sm"><Minus size={14}/></button>
                  <span className="text-sm font-mono text-slate-900 w-6 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQuantity(item.id, 1)} className="p-1 hover:bg-white hover:text-emerald-500 rounded-lg transition-all shadow-sm"><Plus size={14}/></button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 p-1.5 transition-colors"><Trash2 size={18}/></button>
              </div>
            ))
          )}
        </div>
      </div>

      {showSuccessModal && lastSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-scale-in">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8 border-4 border-emerald-50">
                <CheckCircle2 size={56} className="animate-bounce" />
              </div>
              <h3 className="text-headline-lg font-headline-lg text-slate-900 leading-tight">Venda Concluída!</h3>
              <p className="text-body-md font-body-md text-slate-600">O pedido <span className="text-indigo-600 font-debug-mono text-debug-mono font-bold">#{lastSale.id}</span> foi registrado.</p>
              
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => printReceipt(lastSale, 'thermal')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group shadow-sm active:scale-95"
                >
                  <Ticket size={40} className="text-slate-600 group-hover:text-emerald-500 transition-colors" />
                  <div className="text-left w-full text-center">
                    <p className="text-label-sm font-label-sm uppercase tracking-wider text-slate-500 group-hover:text-emerald-700">Cupom Não Fiscal</p>
                    <p className="text-body-md font-body-md font-bold text-slate-900">Térmica 58mm</p>
                  </div>
                </button>
                
                <button 
                  onClick={() => printReceipt(lastSale, 'a4')}
                  className="flex flex-col items-center gap-3 p-6 bg-white border-2 border-slate-200 rounded-3xl hover:border-indigo-500 hover:bg-indigo-50 transition-all group shadow-sm active:scale-95"
                >
                  <FileText size={40} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  <div className="text-left w-full text-center">
                    <p className="text-label-sm font-label-sm uppercase tracking-wider text-slate-500 group-hover:text-indigo-700">Relatório Completo</p>
                    <p className="text-body-md font-body-md font-bold text-slate-900">Impressora A4</p>
                  </div>
                </button>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-title-md font-title-md uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                  Novo Pedido
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-500 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
      {isCustomerModalOpen && (
        <CustomerFormModal 
          isOpen={isCustomerModalOpen}
          onClose={() => setIsCustomerModalOpen(false)}
          onSave={async (name, contact, cpf) => {
            if (!user) return;
            try {
              const { data, error } = await supabase
                .from('customers')
                .insert([{
                  user_id: user.id,
                  name: name.toUpperCase().trim(),
                  phone: contact,
                  cpf
                }])
                .select()
                .single();

              if (error) throw error;
              
              setSelectedCustomer({
                id: data.id,
                name: data.name,
                contact: data.phone,
                cpf: data.cpf,
                createdAt: data.created_at,
                totalSpent: 0
              });
              setIsCustomerModalOpen(false);
            } catch (e: any) {
              console.error(e);
              alert("Erro ao cadastrar cliente: " + (e.message || 'Erro inesperado'));
            }
          }}
        />
      )}
    </div>
  );
};
