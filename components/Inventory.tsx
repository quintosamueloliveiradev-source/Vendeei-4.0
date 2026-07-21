import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { Plus, Search, Edit2, Trash2, X, Box, Image as ImageIcon, Filter, ChevronDown, ChevronUp, DollarSign, Tag, Archive, AlertCircle, Barcode, Loader2 } from 'lucide-react';

export const Inventory: React.FC = () => {
  const { products, deleteProduct, addProduct, updateProduct, loading } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(() => {
    return sessionStorage.getItem('inventory_modal_open') === 'true';
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState<Partial<Product> & { margin?: number }>(() => {
    const saved = sessionStorage.getItem('inventory_form_data');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return { name: '', category: '', price: 0, costPrice: 0, margin: 0, stock: 0, description: '', imageUrl: '', barcode: '' };
  });

  const calculatePrice = (cost: number, margin: number) => {
    return Number((cost * (1 + (margin / 100))).toFixed(2));
  };

  const handleCostChange = (cost: number) => {
    const margin = formData.margin || 0;
    setFormData({ ...formData, costPrice: cost, price: calculatePrice(cost, margin) });
  };

  const handleMarginChange = (margin: number) => {
    const cost = formData.costPrice || 0;
    setFormData({ ...formData, margin, price: calculatePrice(cost, margin) });
  };
  const [isEditing, setIsEditing] = useState(() => {
    return sessionStorage.getItem('inventory_is_editing') === 'true';
  });
  
  // Estado para o modal de confirmação de exclusão
  const [deleteTarget, setDeleteTarget] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    sessionStorage.setItem('inventory_modal_open', isModalOpen.toString());
  }, [isModalOpen]);

  useEffect(() => {
    sessionStorage.setItem('inventory_form_data', JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    sessionStorage.setItem('inventory_is_editing', isEditing.toString());
  }, [isEditing]);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).sort(), [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productToSave = {
      ...formData,
      id: isEditing ? formData.id! : Date.now().toString(),
      price: Number(formData.price),
      costPrice: Number(formData.costPrice),
      stock: Number(formData.stock),
      imageUrl: formData.imageUrl || 'https://placehold.co/200x200?text=Sem+Imagem',
      barcode: formData.barcode || ''
    } as Product;

    if (isEditing) {
      await updateProduct(productToSave);
    } else {
      await addProduct(productToSave);
    }
    setIsModalOpen(false);
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Estoque</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold font-sans text-slate-800">Gerenciamento de Estoque</h2>
          <p className="text-sm font-sans text-slate-500">Controle total sobre seus produtos e margens.</p>
        </div>
        <button onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }} className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-sans font-medium hover:bg-emerald-700 transition-all shadow-sm active:scale-95">
          <Plus size={16} /> Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white min-h-[400px]">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-3xl flex items-center justify-center mb-5 border-2 border-slate-200/60 shadow-sm">
              <Box size={28} />
            </div>
            <h3 className="text-title-md font-title-md text-slate-800 mb-2">Nenhum produto cadastrado no estoque</h3>
            <p className="text-body-md font-body-md text-slate-500 max-w-md mb-8 leading-relaxed">
              Você ainda não cadastrou produtos. Comece adicionando um novo produto neste painel para controlar seu estoque e realizar vendas no PDV.
            </p>
            <button 
              onClick={() => { setFormData({ name: '', category: '', price: 0, costPrice: 0, stock: 0, description: '', imageUrl: '', barcode: '' }); setIsEditing(false); setIsModalOpen(true); }}
              className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3.5 rounded-xl font-title-md hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95 text-sm"
            >
              <Plus size={18} /> Cadastrar Meu Primeiro Produto
            </button>
          </div>
        ) : (
          <>
            <div className="p-2.5 bg-slate-50 flex flex-col md:flex-row gap-2.5 border-b border-slate-200">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="text" 
                  placeholder="Pesquisar por nome do produto..." 
                  className="w-full pl-9 pr-3 py-1.5 bg-white border-2 border-slate-300 rounded-lg text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-500 shadow-sm" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="relative">
                 <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={14} />
                 <select 
                  className="pl-8 pr-8 py-1.5 bg-white border-2 border-slate-300 rounded-lg text-sm font-semibold text-slate-800 appearance-none cursor-pointer min-w-[180px] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all" 
                  value={selectedCategory} 
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 text-[11px] font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2">Produto</th>
                    <th className="px-4 py-2">Preço Venda</th>
                    <th className="px-4 py-2">Preço Custo</th>
                    <th className="px-4 py-2">Margem</th>
                    <th className="px-4 py-2">Estoque</th>
                    <th className="px-4 py-2 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                        Nenhum produto correspondente aos filtros de busca encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => {
                      const margin = p.price - p.costPrice;
                      const marginPercent = p.price > 0 ? ((margin / p.price) * 100).toFixed(0) : '0';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">{p.name}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{p.category}</p>
                                  {p.barcode && (
                                    <span className="font-mono text-[10px] font-bold bg-indigo-50 text-indigo-600 px-1 py-0.5 rounded border border-indigo-200 flex items-center gap-1">
                                      <Barcode size={8} /> {p.barcode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm font-mono font-medium tracking-tight text-emerald-600">R$ {p.price.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-mono font-medium tracking-tight text-slate-600">R$ {p.costPrice.toFixed(2)}</td>
                          <td className="px-4 py-2">
                            <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${Number(marginPercent) > 30 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {marginPercent}% Lucro
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-1.5">
                              <Archive size={12} className={p.stock < 5 ? 'text-red-500' : 'text-slate-400'} />
                              <span className={`text-sm font-mono font-medium tracking-tight ${p.stock < 5 ? 'text-red-500' : 'text-slate-700'}`}>{p.stock} <span className="text-[10px] font-medium text-slate-400 font-sans">un</span></span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right space-x-2">
                            <button 
                              onClick={() => { setFormData(p); setIsEditing(true); setIsModalOpen(true); }} 
                              className="p-1 px-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all"
                            >
                              <Edit2 size={14}/>
                            </button>
                            <button 
                              onClick={() => setDeleteTarget({id: p.id, name: p.name})} 
                              className="p-1 px-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal de Confirmação de Exclusão Customizado */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-8 text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-900">Excluir Produto?</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Você está prestes a remover <strong>{deleteTarget.name}</strong> definitivamente do sistema. Esta ação não pode ser desfeita.
              </p>
              
              <div className="flex flex-col gap-3 pt-4">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                >
                  Sim, Excluir Produto
                </button>
                <button 
                  onClick={() => setDeleteTarget(null)}
                  className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{isEditing ? 'Editar Produto' : 'Cadastrar Novo Produto'}</h3>
                <p className="text-xs text-slate-500">Preencha os dados com atenção.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-800"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[75vh] overflow-y-auto bg-white">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <Tag size={10} className="text-slate-400" /> Nome do Produto
                </label>
                <input 
                  required 
                  type="text" 
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-400 text-sm" 
                  placeholder="Nome do produto"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <DollarSign size={10} className="text-indigo-500" /> Custo
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-indigo-600 font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 focus:outline-none transition-all text-sm" 
                    value={formData.costPrice || ''} 
                    onChange={e => handleCostChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <Tag size={10} className="text-amber-500" /> Margem (%)
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-amber-600 font-bold focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 focus:outline-none transition-all text-sm" 
                    placeholder="%"
                    value={formData.margin || ''} 
                    onChange={e => handleMarginChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <DollarSign size={10} className="text-emerald-500" /> Venda
                  </label>
                  <input 
                    required 
                    type="number" 
                    step="0.01" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-emerald-600 font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all text-sm" 
                    value={formData.price || ''} 
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <Barcode size={10} /> Código de Barras
                </label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300 text-sm" 
                    placeholder="EAN-13, EAN-8..."
                    value={formData.barcode || ''} 
                    onChange={e => setFormData({...formData, barcode: e.target.value})} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <Box size={10} /> Categoria
                  </label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all text-sm" 
                    placeholder=""
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <Archive size={10} /> Estoque Inicial
                  </label>
                  <input 
                    required 
                    type="number" 
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all text-sm" 
                    value={formData.stock || ''} 
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                  <ImageIcon size={10} /> URL da Imagem
                </label>
                <input 
                  type="text" 
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-300 text-sm" 
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={formData.imageUrl} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors uppercase tracking-wider text-xs font-bold">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all shadow-sm uppercase tracking-wider text-xs font-bold">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
