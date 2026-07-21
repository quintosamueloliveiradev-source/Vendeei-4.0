import React, { useRef, useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  Save, 
  RefreshCw, 
  X, 
  Lock, 
  Shield, 
  Key, 
  Receipt, 
  CreditCard, 
  ExternalLink, 
  Calendar, 
  Sparkles, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { products, sales, importData, resetSystem, updateAdminPassword, isDefaultPassword, profile, addToast, loading } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [modalType, setModalType] = useState<'restore' | 'reset' | 'reset-initial' | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pendingFileContent, setPendingFileContent] = useState<any>(null);
  const [error, setError] = useState('');

  const [pwdForm, setPwdForm] = useState({ current: '', new: '', confirm: '' });
  const [pwdMessage, setPwdMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Estados do histórico de faturas
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [activeTab, setActiveTab] = useState<'subscription' | 'security' | 'maintenance'>('subscription');

  useEffect(() => {
    const fetchPayments = async () => {
      if (!profile?.id) return;
      setLoadingPayments(true);
      try {
        const response = await fetch(`/api/asaas/payments/${profile.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPayments(data.payments || []);
          }
        }
      } catch (err) {
        console.error("Erro ao obter cobranças:", err);
      } finally {
        setLoadingPayments(false);
      }
    };

    fetchPayments();
  }, [profile?.id]);

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'RECEIVED':
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-150 text-[10px] font-black uppercase rounded-full tracking-wide">PAGO</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-150 text-[10px] font-black uppercase rounded-full tracking-wide">AGUARDANDO PAGAMENTO</span>;
      case 'OVERDUE':
        return <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-150 text-[10px] font-black uppercase rounded-full tracking-wide">VENCIDO</span>;
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-150 text-[10px] font-black uppercase rounded-full tracking-wide">{status || 'PENDENTE'}</span>;
    }
  };

  const getPaymentMethodLabel = (type: string) => {
    if (type?.toUpperCase() === 'PIX') return 'Pix Imediato';
    if (type?.toUpperCase() === 'CREDIT_CARD') return 'Cartão de Crédito';
    if (type?.toUpperCase() === 'BOLETO') return 'Boleto Bancário';
    return type || 'Pix';
  };

  const handleExportBackup = () => {
    const data = { timestamp: Date.now(), version: 1, products, sales };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendeei-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.products || !parsed.sales) throw new Error("Inválido");
        setPendingFileContent(parsed);
        setModalType('restore');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) { alert("Erro no backup."); }
    };
    reader.readAsText(file);
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (modalType === 'restore') {
      const { importData } = useStore() as any; 
      if (await importData(pendingFileContent, password)) closeModal();
      else setError('Senha incorreta ou erro técnico.');
    } else if (modalType === 'reset') {
      if (await resetSystem(password)) closeModal();
      else setError('Senha incorreta.');
    } else if (modalType === 'reset-initial') {
      if (password.length < 4) { setError('Mínimo 4 caracteres.'); return; }
      if (password !== confirmPassword) { setError('Senhas não conferem.'); return; }
      if (await resetSystem('admin') && await updateAdminPassword('admin', password)) closeModal();
      else setError('Erro crítico.');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    if (pwdForm.new.length < 4) { setPwdMessage({ type: 'error', text: 'Mínimo 4 caracteres.' }); return; }
    if (pwdForm.new !== pwdForm.confirm) { setPwdMessage({ type: 'error', text: 'Confirmação não confere.' }); return; }
    if (await updateAdminPassword(pwdForm.current, pwdForm.new)) {
      setPwdMessage({ type: 'success', text: 'Senha alterada no Supabase!' });
      setPwdForm({ current: '', new: '', confirm: '' });
    } else setPwdMessage({ type: 'error', text: 'Senha atual incorreta.' });
  };

  const closeModal = () => {
    setModalType(null);
    setPassword('');
    setConfirmPassword('');
    setError('');
    setPendingFileContent(null);
  };

  const isDanger = modalType === 'reset' || modalType === 'reset-initial';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-16 space-y-6 animate-fade-in">
        <div className="relative">
          <Loader2 className="animate-spin text-emerald-600" size={64} />
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
        </div>
        <div className="space-y-2 text-center">
          <p className="text-lg font-bold text-slate-800 tracking-tight text-center">Carregando Configurações</p>
          <p className="font-semibold text-slate-500 uppercase tracking-widest text-[9px] text-slate-400 font-mono text-center">
            SINCRONIZANDO COM O SUPABASE...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl pb-12">
      <header>
        <h2 className="text-2xl font-light text-slate-900">Configurações</h2>
        <p className="text-sm text-slate-500 mt-0.5">Gerenciamento de conta, segurança e dados.</p>
      </header>

      {/* Abas de Navegação */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'subscription'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Assinatura
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'security'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Segurança
        </button>
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
            activeTab === 'maintenance'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Manutenção
        </button>
      </div>

      <div className="w-full">
        {/* Conteúdo: Assinatura */}
        {activeTab === 'subscription' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 animate-fade-in w-full max-w-2xl mx-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Receipt size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Assinatura do SmartPOS</h3>
                  <p className="text-xs text-slate-500">Detalhes e status do seu plano ativo</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (!profile?.id) return;
                  setLoadingPayments(true);
                  try {
                    const r = await fetch(`/api/asaas/payments/${profile.id}`);
                    if (r.ok) {
                      const d = await r.json();
                      if (d.success) setPayments(d.payments || []);
                    }
                    addToast('Histórico atualizado!', 'success');
                  } catch {
                    addToast('Erro ao atualizar', 'error');
                  } finally {
                    setLoadingPayments(false);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
                disabled={loadingPayments}
              >
                <RefreshCw size={12} className={loadingPayments ? 'animate-spin' : ''} />
                Atualizar Dados
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
                <span className="text-sm font-bold text-slate-800 flex items-center gap-1">
                  {profile?.subscriptionStatus === 'active' || profile?.subscription_status === 'active' ? (
                    <span className="text-emerald-600 flex items-center gap-1"><Sparkles size={14} /> Ativo</span>
                  ) : profile?.subscriptionStatus === 'trial' || profile?.subscription_status === 'trial' ? (
                    <span className="text-indigo-600">Período de Testes</span>
                  ) : (
                    <span className="text-rose-600">Inativo</span>
                  )}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vencimento</span>
                <span className="text-sm font-bold text-slate-800">
                  {profile?.subscription_expiry ? (
                    new Date(profile.subscription_expiry).toLocaleDateString('pt-BR')
                  ) : profile?.trialEndDate ? (
                    new Date(profile.trialEndDate).toLocaleDateString('pt-BR')
                  ) : 'Não disponível'}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ID Cliente Asaas</span>
                <span className="text-sm font-bold text-slate-800 truncate block">
                  {profile?.asaasCustomerId || profile?.asaas_customer_id || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Conteúdo: Segurança */}
        {activeTab === 'security' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 animate-fade-in w-full max-w-2xl mx-auto">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-800">Segurança da Conta</h3>
                <p className="text-xs text-slate-500">Altere sua senha de acesso administrativo</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {pwdMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold animate-fade-in flex items-center gap-2 border ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {pwdMessage.type === 'success' ? <RefreshCw size={14} className="animate-spin" /> : <AlertTriangle size={14} />}
                  {pwdMessage.text}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Senha Atual</label>
                <input 
                  type="password" 
                  placeholder="Digite sua senha atual"
                  value={pwdForm.current}
                  onChange={e => setPwdForm({...pwdForm, current: e.target.value})}
                  className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder:text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nova Senha</label>
                  <input 
                    type="password" 
                    placeholder="Min. 4 Caracteres"
                    value={pwdForm.new}
                    onChange={e => setPwdForm({...pwdForm, new: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder:text-slate-200"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    placeholder="Repita a nova senha"
                    value={pwdForm.confirm}
                    onChange={e => setPwdForm({...pwdForm, confirm: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none placeholder:text-slate-200"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                Alterar Senha
              </button>
            </form>
          </div>
        )}

        {/* Conteúdo: Manutenção */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6 w-full max-w-2xl mx-auto animate-fade-in">
            {/* Manutenção de Dados */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                  <Save size={20} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Manutenção de Banco de Dados</h3>
                  <p className="text-xs text-slate-500">Exporte ou monte backups integrados dos seus dados</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={handleExportBackup} className="flex items-center justify-center gap-2.5 bg-slate-900 text-white p-4 rounded-xl hover:bg-slate-800 transition-all shadow-md active:scale-[0.99]">
                  <Download size={18} className="text-blue-400" />
                  <span className="font-bold text-xs uppercase tracking-wider">Exportar Backup</span>
                </button>

                <button onClick={() => fileInputRef.current?.click()} className="flex items-center justify-center gap-2.5 bg-white border border-slate-300 text-slate-700 p-4 rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm active:scale-[0.99]">
                  <Upload size={18} className="text-slate-500" />
                  <span className="font-bold text-xs uppercase tracking-wider">Importar Backup</span>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
              </div>
            </div>

            {/* Área Crítica */}
            <div className="bg-red-50 p-6 rounded-2xl border border-red-200 space-y-4">
              <div className="flex items-center gap-3 pb-2 border-b border-red-100">
                <div className="p-2 bg-white text-red-600 rounded-xl shadow-sm border border-red-100">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-red-955">Área Crítica (Ações Irreversíveis)</h3>
                  <p className="text-xs text-red-600">Confirme para resetar os registros locais do banco de dados</p>
                </div>
              </div>
              <button onClick={() => setModalType(isDefaultPassword ? 'reset-initial' : 'reset')} className="w-full px-4 py-3 bg-red-650 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-red-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm">
                <RefreshCw size={16} /> Reset de Fábrica do Sistema
              </button>
            </div>
          </div>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className={`p-6 border-b border-slate-100 flex justify-between items-center ${isDanger ? 'bg-red-50 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
              <h3 className="text-title-md font-title-md flex items-center gap-2 uppercase tracking-wide">
                {isDanger ? <AlertTriangle size={20} /> : <Lock size={20} />}
                {modalType === 'restore' ? 'Validar Restauração' : modalType === 'reset-initial' ? 'Primeiro Uso' : 'Confirmar Limpeza'}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmitPassword} className="p-8 space-y-6">
              <div className="p-4 bg-slate-50 rounded-2xl text-body-md font-body-md text-slate-600 border border-slate-100 font-semibold leading-relaxed">
                {modalType === 'reset' && "Esta ação apagará permanentemente todos os produtos e vendas. Confirme com sua senha administrativa."}
                {modalType === 'restore' && "Todos os dados atuais serão removidos e substituídos pelos do arquivo. Confirme com sua senha."}
                {modalType === 'reset-initial' && "Crie sua senha de administrador antes de realizar o primeiro reset total do sistema."}
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">{modalType === 'reset-initial' ? 'Nova Senha Admin' : 'Senha do Sistema'}</label>
                  <input 
                    autoFocus
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {modalType === 'reset-initial' && (
                  <div className="space-y-2">
                    <label className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider">Repita a Senha</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 bg-white border-2 border-slate-300 rounded-2xl text-body-md font-body-md font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all placeholder:text-slate-200 font-debug-mono text-debug-mono"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                )}
              </div>

              {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2 animate-shake"><AlertTriangle size={14} />{error}</div>}

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-4 border-2 border-slate-200 text-slate-500 rounded-2xl hover:bg-slate-50 font-title-md text-xs uppercase tracking-wider transition-colors">Cancelar</button>
                <button type="submit" className={`flex-1 px-4 py-4 text-white rounded-2xl font-title-md text-xs uppercase tracking-wider shadow-lg transition-all active:scale-[0.98] ${isDanger ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
