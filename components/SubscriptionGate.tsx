import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  ShieldAlert, 
  CheckCircle, 
  Smartphone, 
  ExternalLink, 
  Code, 
  Terminal, 
  Clock, 
  Star, 
  Zap, 
  Copy, 
  Check, 
  RefreshCw, 
  LogOut 
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { supabase } from '../lib/supabase';

// Controle visual para Produção - quando true, esconde botões/mensagens de simulação/debug
const isProduction = true;

// Função de máscara dinâmica para CPF / CNPJ
const formatCpfCnpj = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  
  if (digits.length <= 11) {
    // Máscara CPF: 000.000.000-00
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  } else {
    // Máscara CNPJ: 00.000.000/0000-00
    return digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
};

// Validação de CPF Real (Algoritmo de Dígito Verificador)
const isValidCPF = (cpf: string): boolean => {
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

// Validação de CNPJ Real (Algoritmo de Dígito Verificador)
const isValidCNPJ = (cnpj: string): boolean => {
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  size = size + 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

export const SubscriptionGate: React.FC = () => {
  const { profile, addToast, signOut } = useStore();
  const [showIntegrationsGuide, setShowIntegrationsGuide] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  
  // Estados para o fluxo do Pix Asaas Realtime
  const [paymentStep, setPaymentStep] = useState<'initial' | 'pix_details' | 'success'>('initial');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [qrCodeBase64, setQrCodeBase64] = useState('');
  const [copiaCola, setCopiaCola] = useState('');
  const [isSimulated, setIsSimulated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [avisoPix, setAvisoPix] = useState('');
  const [pollingActive, setPollingActive] = useState(false);
  const [pollingErrorCount, setPollingErrorCount] = useState(0);

  // Polling para checar status do pagamento junto ao servidor
  useEffect(() => {
    let intervalId: any;

    if (pollingActive && paymentId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/asaas/check-payment/${paymentId}`);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Erro de validação retornado pelo backend:', errorText);
            throw new Error(`Falha ao comunicar com o validador de faturas (${response.status}).`);
          }
          
          const data = await response.json();
          if (data.success && (data.status === 'CONFIRMED' || data.status === 'RECEIVED')) {
            setPollingActive(false);
            clearInterval(intervalId);
            
            // Ativa 30 dias de acesso completo no Supabase
            const { error } = await supabase
              .from('profiles')
              .update({ 
                subscription_status: 'active',
                subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .eq('id', profile!.id);

            if (error) throw error;
            
            addToast('Pagamento confirmado com sucesso pelo Asaas!', 'success');
            setPaymentStep('success');
            
            // Recarrega a página após 3 segundos para recarregar o contexto com acesso liberado
            setTimeout(() => {
              window.location.reload();
            }, 3000);
          }
        } catch (err) {
          console.error('Erro ao verificar pagamento:', err);
          setPollingErrorCount(prev => prev + 1);
          // Se houverem muitos erros seguidos de polling, desativa para preservar recusos
          if (pollingErrorCount > 15) {
            setPollingActive(false);
            addToast('Poller inativo devido a erros de conexão consecutivos.', 'error');
          }
        }
      }, 4000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [pollingActive, paymentId, profile, addToast, pollingErrorCount]);

  // Iniciar fluxo do checkout gerando o Pix no Asaas
  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    // Validação robusta de CPF ou CNPJ com algoritmo de dígito verificador
    const rawCpfCnpj = cpfCnpj.replace(/\D/g, '');
    if (rawCpfCnpj.length === 11) {
      if (!isValidCPF(rawCpfCnpj)) {
        addToast('O CPF inserido é inválido. Por favor, verifique os dígitos corretos.', 'error');
        return;
      }
    } else if (rawCpfCnpj.length === 14) {
      if (!isValidCNPJ(rawCpfCnpj)) {
        addToast('O CNPJ inserido é inválido. Por favor, verifique os dígitos corretos.', 'error');
        return;
      }
    } else {
      addToast('Por favor, digite um CPF válido (11 números) ou CNPJ válido (14 números).', 'error');
      return;
    }

    setLoadingPayment(true);
    try {
      addToast('Conectando ao gateway Asaas Sandbox...', 'info');
      
      const response = await fetch('/api/asaas/create-pix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: profile.store_name || 'Assinante Vendeei',
          email: profile.email,
          cpfCnpj: rawCpfCnpj,
          userId: profile.id
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Dados brutos do erro retornados pelo backend:', errorText);
        throw new Error(`Erro no servidor (${response.status}): ${errorText.substring(0, 150)}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Erro inesperado ao gerar fatura no Asaas.');
      }

      setPaymentId(data.paymentId);
      setQrCodeBase64(data.encodedImage);
      setCopiaCola(data.payload);
      setIsSimulated(!!data.simulated);
      setPaymentStep('pix_details');
      setPollingActive(true);
      
      if (data.simulated) {
        addToast('Como sua ASAAS_API_KEY no .env não está configurada, geramos um Pix simulado!', 'success');
      } else {
        addToast('Cobrança Pix emitida no Asaas Sandbox com sucesso!', 'success');
      }

    } catch (err: any) {
      addToast(err.message || 'Falha ao integrar com o gateway Asaas.', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleCopyCode = () => {
    if (!copiaCola) return;
    navigator.clipboard.writeText(copiaCola);
    setCopied(true);
    setPixCopiado(true);
    setAvisoPix('');
    addToast('Chave copia e cola copiada para a área de transferência!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Simular aprovação instantânea se for simulado
  const handleSimulatePaymentApproval = async () => {
    if (!pixCopiado) {
      setAvisoPix('Atenção: Você precisa clicar em "Copiar Chave Pix" antes de enviar o comprovante.');
      addToast('Você precisa copiar a chave Pix antes de continuar.', 'warning');
      return;
    }
    if (!profile) return;
    setLoadingPayment(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription_status: 'active',
          subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      addToast('Incrível! Assinatura liberada instantaneamente no modo simulado.', 'success');
      setPaymentStep('success');
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      addToast('Erro ao simular liberação', 'error');
    } finally {
      setLoadingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-12">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Esquerda: Informações & Recursos */}
        <div className="p-8 md:p-12 bg-slate-900 text-white flex-1 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-full text-label-sm font-label-sm font-semibold uppercase tracking-wider mb-6">
              <Clock size={12} />
              Período de Teste Encerrado
            </div>

            <h2 className="text-headline-lg font-headline-lg tracking-tight mb-4 leading-tight">
              Seus 7 dias gratuitos <span className="text-emerald-400">chegaram ao fim</span>
            </h2>
            
            <p className="text-body-md font-body-md text-slate-400 mb-8 leading-relaxed">
              Obrigado por usar o Vendeei para gerenciar seu negócio! Seu período de demonstração gratuita expirou. Escolha um plano para ativar o acesso total.
            </p>
            
            <div className="space-y-4">
              <p className="text-label-sm font-label-sm text-slate-400 uppercase tracking-wider font-semibold">Recursos Inclusos na Assinatura:</p>
              <ul className="space-y-3.5">
                {[
                  { title: 'Controle de Estoque Inteligente', desc: 'Alertas de falta e cálculo automático de custos e margem de lucro.' },
                  { title: 'Ponto de Venda (PDV) Rápido', desc: 'Fluxo ágil de vendas, carrinho pré-computado e suporte a leitor de código de barras.' },
                  { title: 'Histórico Completo & Estornos', desc: 'Gere cupons térmicos (58mm) e relatórios formatados em PDF A4.' },
                  { title: 'Painel Financeiro Detalhado', desc: 'Estatísticas de receita e margem de lucro com gráficos refinados.' }
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle size={14} />
                    </div>
                    <div>
                      <p className="text-body-md font-body-md font-semibold text-white leading-tight">{feature.title}</p>
                      <p className="text-label-sm font-label-sm text-slate-400 mt-0.5">{feature.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between">
            <button 
              onClick={signOut}
              className="inline-flex items-center gap-1.5 font-title-md text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              <LogOut size={14} />
              Desconectar minha conta
            </button>
            {!isProduction && (
              <button 
                onClick={() => setShowIntegrationsGuide(!showIntegrationsGuide)}
                className="inline-flex items-center gap-1.5 font-title-md text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                <Code size={14} />
                {showIntegrationsGuide ? 'Ocultar Código da API' : 'Ver Código da API / Webhook'}
              </button>
            )}
          </div>
        </div>

        {/* Direita: Fluxo de Checkout Pix Asaas */}
        <div className="p-8 md:p-12 w-full md:w-[410px] bg-white text-slate-950 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100">
          
          {paymentStep === 'initial' && (
            <div className="space-y-6">
              <div className="text-center">
                <span className="text-label-sm font-label-sm uppercase tracking-wide font-bold text-slate-400 block">Assinatura Mensal</span>
                <div className="flex items-baseline justify-center gap-1 mt-2">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-display-lg font-display-lg font-bold text-slate-900 font-debug-mono tracking-tight">14,90</span>
                  <span className="text-sm font-bold text-slate-400">/mês</span>
                </div>
                <p className="text-body-md font-body-md text-slate-500 mt-2">Plano completo. Cancele e pause quando desejar.</p>
              </div>

              {/* Formulário de Identificação Requerido pelo Asaas */}
              <form onSubmit={handleGeneratePix} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-label-sm font-label-sm text-slate-700 uppercase tracking-wide block font-semibold">
                    CPF ou CNPJ do Pagador *
                  </label>
                  <input 
                    type="text" 
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    value={cpfCnpj}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setCpfCnpj(formatCpfCnpj(digitsOnly));
                    }}
                    required
                    maxLength={18}
                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white rounded-2xl text-body-md font-body-md font-debug-mono font-semibold transition-all outline-none"
                  />
                  <p className="text-label-sm font-label-sm text-slate-400 leading-tight font-medium">
                    * Requerido pela regulamentação do Banco Central para emissão de chaves Pix registradas.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button 
                    type="submit"
                    disabled={loadingPayment}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-title-md text-sm uppercase tracking-wider shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingPayment ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        Trabalhando...
                      </>
                    ) : (
                      <>
                        <Smartphone size={16} />
                        Pagar com PIX Imediato 
                      </>
                    )}
                  </button>

                  {!isProduction && (
                    <button 
                      type="button"
                      onClick={handleSimulatePaymentApproval}
                      className="w-full py-3 border-2 border-slate-200 hover:bg-slate-50 text-slate-500 rounded-2xl font-title-md text-xs transition-colors cursor-pointer"
                    >
                      Simular Ativação de Teste
                    </button>
                  )}
                </div>
              </form>

              {!isProduction && (
                <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex gap-3">
                  <div className="text-yellow-600 mt-0.5 shrink-0"><Star size={16} fill="currentColor" /></div>
                  <p className="text-label-sm font-label-sm text-slate-500 leading-relaxed font-medium">
                    <strong>Sandbox Integration:</strong> O sistema está pronto! Insira o CPF, clique no botão e o app chamará o gateway para exibir o Pix oficial em tempo de execução.
                  </p>
                </div>
              )}
            </div>
          )}

          {paymentStep === 'pix_details' && (
            <div className="space-y-6 animate-fade-in text-center">
              <div>
                <span className="text-label-sm font-label-sm bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-full border border-indigo-100 uppercase font-semibold">
                  Aguardando Pagamento Pix
                </span>
                <p className="text-body-md font-body-md font-semibold text-slate-700 mt-3">Escaneie o QR Code ou Use o Copia e Cola:</p>
              </div>

              {/* Renderização Dinâmica do QR Code obtido do Asaas */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl shadow-sm mb-4">
                  {qrCodeBase64 ? (
                    <img 
                      src={`data:image/png;base64,${qrCodeBase64}`} 
                      alt="Asaas QR Code Pix" 
                      className="w-44 h-44 object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100 rounded-lg animate-pulse text-slate-400 text-label-sm font-label-sm">
                      Buscando QR Code...
                    </div>
                  )}
                  
                  {isSimulated && !isProduction && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-label-sm font-label-sm font-bold uppercase px-1.5 py-0.5 rounded shadow-sm">
                      MOCK ACTIVE
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1.5 text-label-sm font-label-sm text-slate-500 mb-4 justify-center">
                  <RefreshCw size={12} className="animate-spin text-emerald-600" />
                  <span>Sincronizado com Asaas Sandbox...</span>
                </div>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-2">
                <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                  <div className="max-w-[200px] overflow-hidden">
                    <p className="text-label-sm font-label-sm uppercase font-semibold text-slate-400">Pix Copia e Cola</p>
                    <p className="text-debug-mono font-debug-mono text-slate-700 truncate mt-0.5">{copiaCola || 'PIX_KEY'}</p>
                  </div>
                  <button 
                    onClick={handleCopyCode}
                    className={`px-3 py-2.5 rounded-xl border font-title-md text-xs transition-all active:scale-95 shrink-0 flex items-center gap-1.5 cursor-pointer ${
                      copied 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                        : 'bg-white border-slate-200 hover:bg-slate-100/50 text-slate-700'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={14} className="text-emerald-500" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                </div>

                {avisoPix && (
                  <div className="flex items-center gap-2 text-amber-800 text-xs bg-amber-50 p-3 rounded-xl border border-amber-300 mb-3 shadow-sm text-left">
                    <span className="text-base">⚠️</span>
                    <span className="font-semibold">{avisoPix}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                {!isProduction && (
                  <button 
                    onClick={handleSimulatePaymentApproval}
                    disabled={!pixCopiado}
                    className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                      pixCopiado 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg cursor-pointer transform active:scale-98' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 border border-gray-300'
                    }`}
                  >
                    <span>Enviar Comprovante</span>
                    <span>➔</span>
                  </button>
                )}
                <button 
                  onClick={() => {
                    setPollingActive(false);
                    setPaymentStep('initial');
                  }}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-700 font-title-md text-xs font-semibold"
                >
                  ← Voltar e alterar dados
                </button>
              </div>
            </div>
          )}

          {paymentStep === 'success' && (
            <div className="text-center py-8 space-y-6 animate-fade-in flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 border-2 border-emerald-200 rounded-3xl flex items-center justify-center animate-bounce mb-2">
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 className="text-headline-lg font-headline-lg text-slate-900 tracking-tight">Pagamento Confirmado!</h3>
                <p className="text-body-md font-body-md text-slate-500 mt-2 max-w-[260px] mx-auto leading-relaxed">
                  Perfeito! O Asaas processou sua transação de R$ 14,90. Sua assinatura Vendeei foi ativada por mais 30 dias com sucesso.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-label-sm font-label-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
                <RefreshCw size={12} className="animate-spin" />
                Carregando PDV...
              </div>
            </div>
          )}

          <p className="mt-8 text-label-sm font-label-sm text-slate-400 text-center uppercase tracking-wide font-semibold">
            <span className="font-vendeei font-black">Vendeei</span> © 2026 • GESTÃO INTELIGENTE MVP
          </p>
        </div>

      </div>

      {/* Caixa de Guia de Integração na API de Pagamento (Developer Mode) */}
      {showIntegrationsGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="max-w-3xl w-full bg-slate-950 border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl relative text-left">
            <button 
              onClick={() => setShowIntegrationsGuide(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-900 p-2 rounded-xl border border-slate-800 transition-colors text-xs font-bold"
            >
              Fechar Guia
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center border border-indigo-500/20">
                <Terminal size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Guia de Integração Stripe & Asaas</h3>
                <p className="text-xs text-slate-400">Instruções e Boilerplates prontos de checkout e tratamento de Webhooks</p>
              </div>
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar font-sans text-sm text-slate-300">
              
              {/* Seção Como Configurar .env */}
              <div className="space-y-2 border-l-2 border-indigo-500 pl-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span> Onde configurar seu Token?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Para utilizar a API real do Asaas, abra o arquivo <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-emerald-400">.env</code> na raiz do projeto e declare a chave do Token Sandbox obtido direto no painel do parceiro do Asaas:
                </p>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800">
{`# vendeei/.env
ASAAS_API_KEY=$your_sandbox_access_token_copied_from_asaas`}
                </pre>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ao reiniciar o servidor, o sistema fará a comunicação REST direta com <code className="text-indigo-400">https://sandbox.asaas.com/api/v3</code> para emitir faturas reais no nome do cliente da conta, gerando o QR Code dinamicamente com base nos dados informados!
                </p>
              </div>

              {/* Seção Stripe */}
              <div className="space-y-2 border-l-2 border-slate-500 pl-4">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span> Exemplo de Configuração Stripe
                </h4>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed">
{`// 1. Criar Checkout Session (Backend / Supabase Edge Function)
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function handleCheckout(userId, userEmail) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'brl',
        product_data: { name: 'Assinatura Mensal Vendeei' },
        unit_amount: 1490, // R$ 14,90
        recurring: { interval: 'month' },
      },
      quantity: 1,
    }],
    mode: 'subscription',
    client_reference_id: userId,
    customer_email: userEmail,
    success_url: 'https://vendeei.com/dashboard?payment=success',
    cancel_url: 'https://vendeei.com/dashboard?payment=fail',
  });
  return session.url;
}`}
                </pre>
              </div>

              {/* Seção Webhook Handler */}
              <div className="space-y-2 border-l-2 border-amber-500 pl-4">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span> Webhook Pronto de Retorno no Servidor
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nós já deixamos o endpoint express pronto! Você pode usar a rota <code className="bg-slate-900 px-1.5 py-0.5 rounded font-mono text-indigo-400">POST /api/asaas/webhook</code> no seu painel para aprovações em tempo real rodando em produção:
                </p>
                <pre className="bg-slate-900 text-[11px] p-4 rounded-xl font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed">
{`// Código rodando no nosso server.ts para webhook do Asaas:
app.post('/api/asaas/webhook', async (req, res) => {
  const event = req.body;
  if (event && (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED')) {
    const userId = event.payment.externalReference; // Recupera userID vindo do Asaas
    
    // Atualizar no banco Supabase
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      })
      .eq('id', userId);
  }
  return res.status(200).json({ received: true });
});`}
                </pre>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                O Vendeei está preparado para rodar em larga escala integrando com múltiplos gateways de pagamento com segurança absoluta!
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
