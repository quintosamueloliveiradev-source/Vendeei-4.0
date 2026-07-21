import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, Copy, Store, Smartphone, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CatalogSettings: React.FC = () => {
  const { addToast, user } = useStore();
  const [whatsapp, setWhatsapp] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixBank, setPixBank] = useState('');
  const [pixRule, setPixRule] = useState<'pix_identified' | 'pix_promotional' | 'valor_real'>('valor_real');
  const [isCatalogOpen, setIsCatalogOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('value, catalog_open')
          .eq('key', 'catalog_settings_' + user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          if (data.value) {
            setWhatsapp(data.value.whatsapp_number || '');
            setPixKey(data.value.pix_key || '');
            setPixBank(data.value.pix_bank || '');
            setPixRule(data.value.pix_rule || 'valor_real');
          }
          setIsCatalogOpen(data.catalog_open ?? true);
        }
      } catch (err) {
        console.error('Erro ao buscar configurações do catálogo:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [user]);

  const formatWhatsApp = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Se começar com 55, remove para re-processar uniformemente
    let cleanNumbers = numbers;
    if (cleanNumbers.startsWith('55') && cleanNumbers.length > 10) {
      cleanNumbers = cleanNumbers.substring(2);
    }

    // Limita a 11 dígitos (DDD + Número)
    cleanNumbers = cleanNumbers.substring(0, 11);

    // Aplica a máscara
    if (cleanNumbers.length === 0) return '';
    if (cleanNumbers.length <= 2) return `+55 (${cleanNumbers}`;
    if (cleanNumbers.length <= 7) return `+55 (${cleanNumbers.substring(0, 2)}) ${cleanNumbers.substring(2)}`;
    return `+55 (${cleanNumbers.substring(0, 2)}) ${cleanNumbers.substring(2, 7)}-${cleanNumbers.substring(7)}`;
  };

  const handleUpdate = async (newCatalogOpen: boolean, newWhatsapp: string, newPixKey?: string, newPixBank?: string, newPixRule?: string) => {
    if (!user) return;
    
    // Garante que o valor salvo está formatado antes de enviar
    const formattedWhatsapp = formatWhatsApp(newWhatsapp);
    const finalPixKey = newPixKey !== undefined ? newPixKey : pixKey;
    const finalPixBank = newPixBank !== undefined ? newPixBank : pixBank;
    const finalPixRule = newPixRule !== undefined ? newPixRule : pixRule;
    
    console.log('Tentando atualizar catálogo:', { newCatalogOpen, formattedWhatsapp, finalPixKey, finalPixBank, finalPixRule });

    // Optimistic update
    const previousState = isCatalogOpen;
    setIsCatalogOpen(newCatalogOpen);
    setWhatsapp(formattedWhatsapp);
    setPixKey(finalPixKey);
    setPixBank(finalPixBank);
    setPixRule(finalPixRule as any);
    
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: 'catalog_settings_' + user.id,
        value: { 
          whatsapp_number: formattedWhatsapp,
          pix_key: finalPixKey,
          pix_bank: finalPixBank,
          pix_rule: finalPixRule
        },
        catalog_open: newCatalogOpen
      });
      if (error) {
        console.error('Erro no Supabase:', error);
        throw error;
      }
      console.log('Atualização enviada com sucesso!');
      addToast('Catálogo atualizado!', 'success');
    } catch (err: any) {
      console.error('Erro ao salvar:', err);
      setIsCatalogOpen(previousState);
      addToast(`Erro ao atualizar: ${err.message || 'Erro desconhecido'}`, 'error');
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatWhatsApp(e.target.value);
    setWhatsapp(formatted);
  };

  const handleSaveAll = async () => {
    await handleUpdate(isCatalogOpen, whatsapp, pixKey, pixBank, pixRule);
  };

  const toggleCatalog = () => {
    handleUpdate(!isCatalogOpen, whatsapp, pixKey, pixBank, pixRule);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Catálogo</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-xl font-bold">Catálogo Online</h2>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-semibold text-sm">Status do Catálogo</span>
              <button 
                  onClick={toggleCatalog}
                  className={`w-14 h-7 rounded-full p-1 transition-all flex items-center ${isCatalogOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${isCatalogOpen ? 'translate-x-7' : 'translate-x-0'}`}></div>
              </button>
          </div>
          
          <p className={`text-xs font-bold text-center ${isCatalogOpen ? 'text-emerald-600' : 'text-slate-500'}`}>
              Catálogo {isCatalogOpen ? 'Aberto' : 'Fechado'}
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-semibold">WhatsApp para Pedidos</label>
          <input 
              value={whatsapp} 
              onChange={handleWhatsappChange}
              onBlur={() => setWhatsapp(formatWhatsApp(whatsapp))}
              placeholder="+55 (00) 00000-0000"
              className="w-full p-2 border rounded-lg font-mono"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="font-bold text-sm">Dados para Recebimento (Pix)</h3>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Regra de Cobrança Pix</label>
            <select 
                value={pixRule}
                onChange={e => {
                  const val = e.target.value as any;
                  setPixRule(val);
                  handleUpdate(isCatalogOpen, whatsapp, pixKey, pixBank, val);
                }}
                className="w-full p-2 border rounded-lg text-sm"
            >
                <option value="valor_real">Valor Real (Preço original)</option>
                <option value="pix_identified">Pix Identificado (Acrescenta centavos)</option>
                <option value="pix_promotional">Pix Promocional (Dá desconto)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Chave Pix</label>
            <input 
                value={pixKey} 
                onChange={e => setPixKey(e.target.value)}
                placeholder="Sua chave Pix (CPF, E-mail, Celular...)"
                className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase">Banco / Nome</label>
            <input 
                value={pixBank} 
                onChange={e => setPixBank(e.target.value)}
                placeholder="Ex: Nubank - João Silva"
                className="w-full p-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <button onClick={handleSaveAll} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white p-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-all active:scale-95">
            <Save size={18}/> Salvar Configurações
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold flex items-center gap-2"><Store size={18}/> Link do seu Catálogo</h3>
        <code className="bg-slate-100 p-3 rounded-lg block text-sm break-all font-mono">
            {window.location.origin}/catalogo?store={user?.id}
        </code>
        <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/catalogo?store=${user?.id}`); addToast('Link copiado!', 'info');}} className="w-full border p-2 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold">
            <Copy size={16}/> Copiar Link
        </button>
      </div>
    </div>
  );
};
