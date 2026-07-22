import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ShoppingBag, Plus, Minus, X, Trash2, ChevronRight, Store, QrCode, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';

interface CartItem extends Product {
  quantity: number;
}

export const Catalog: React.FC = () => {
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Checkout State
  const [customerName, setCustomerName] = useState('');
  const [customerLastName, setCustomerLastName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [duplicateErrors, setDuplicateErrors] = useState({
    cpf: false,
    phone: false,
    email: false
  });
  const [errorMessages, setErrorMessages] = useState({
    cpf: '',
    phone: '',
    email: ''
  });
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery'>('pickup');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [reference, setReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'cash' | 'card'>('pix');
  const [changeFor, setChangeFor] = useState('');
  const [catalogSettings, setCatalogSettings] = useState({ isOpen: true });
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [pixSettings, setPixSettings] = useState({ key: '', bank: '', rule: 'valor_real' as 'pix_identified' | 'pix_promotional' | 'valor_real' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [randomCents, setRandomCents] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'pix_instructions'>('cart');
  const [stepCheckout, setStepCheckout] = useState<'phone_check' | 'complete_form' | 'ready_to_buy'>('phone_check');
  const [isExistingCustomer, setIsExistingCustomer] = useState(false);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [avisoTelefone, setAvisoTelefone] = useState('');
  const [copied, setCopied] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);
  const pixFoiCopiadoRef = useRef(false);
  const [avisoPix, setAvisoPix] = useState('');

  const resetCustomerForm = () => {
    setCustomerName('');
    setCustomerLastName('');
    setCustomerCpf('');
    setCustomerPhone('');
    setCustomerEmail('');
    setStepCheckout('phone_check');
    setIsExistingCustomer(false);
    setAvisoTelefone('');
    setPixCopiado(false);
    pixFoiCopiadoRef.current = false;
    setAvisoPix('');
    setDuplicateErrors({ cpf: false, phone: false, email: false });
    setErrorMessages({ cpf: '', phone: '', email: '' });
  };

  const checkCustomerByPhone = async (phoneToVerify: string) => {
    const cleanDigits = phoneToVerify.replace(/\D/g, '');
    if (!cleanDigits || cleanDigits.length < 8) return;

    setIsCheckingPhone(true);
    try {
      let query = supabase.from('customers').select('*');
      if (storeId) {
        query = query.eq('user_id', storeId);
      }
      const { data: clientes, error } = await query;
      if (error) throw error;

      const clienteEncontrado = clientes?.find((c: any) => {
        const cPhone = (c.phone || '').replace(/\D/g, '');
        return cPhone.length >= 8 && (cPhone === cleanDigits || cPhone.endsWith(cleanDigits) || cleanDigits.endsWith(cPhone));
      });

      if (clienteEncontrado) {
        setCustomerName(clienteEncontrado.name || '');
        setCustomerLastName(clienteEncontrado.last_name || '');
        setCustomerEmail(clienteEncontrado.email || '');
        setCustomerCpf(clienteEncontrado.cpf || '');
        setIsExistingCustomer(true);
        setStepCheckout('ready_to_buy');
      } else {
        setIsExistingCustomer(false);
        setStepCheckout('complete_form');
      }
    } catch (err) {
      console.error("Erro ao verificar telefone:", err);
      setStepCheckout('complete_form');
    } finally {
      setIsCheckingPhone(false);
    }
  };

  const handleVerificarTelefone = async () => {
    const cleanDigits = customerPhone.replace(/\D/g, '');
    if (cleanDigits.length < 11) {
      setAvisoTelefone("Por favor, informe o WhatsApp completo com DDD e 9 dígitos.");
      return;
    }
    setAvisoTelefone('');
    await checkCustomerByPhone(customerPhone);
  };

  const handlePhoneChange = (value: string) => {
    const cleanDigits = value.replace(/\D/g, '');
    if (cleanDigits.length > 11) return;

    if (avisoTelefone) setAvisoTelefone('');

    setCustomerPhone(value);
    if (duplicateErrors.phone) {
      setDuplicateErrors(prev => ({ ...prev, phone: false }));
      setErrorMessages(prev => ({ ...prev, phone: '' }));
    }

    if (cleanDigits.length === 11) {
      checkCustomerByPhone(value);
    } else {
      setStepCheckout('phone_check');
      setIsExistingCustomer(false);
    }
  };

  const handleCpfChange = (value: string) => {
    const apenasNumeros = value.replace(/\D/g, '');
    if (apenasNumeros.length <= 11) {
      setCustomerCpf(apenasNumeros);
      if (avisoTelefone) setAvisoTelefone('');
      if (duplicateErrors.cpf) {
        setDuplicateErrors(prev => ({ ...prev, cpf: false }));
        setErrorMessages(prev => ({ ...prev, cpf: '' }));
      }
    }
  };

  const copiarChavePix = () => {
    if (!pixSettings.key) return;
    navigator.clipboard.writeText(pixSettings.key);
    pixFoiCopiadoRef.current = true;
    setCopied(true);
    setPixCopiado(true);
    setAvisoPix('');
    setTimeout(() => setCopied(false), 3000);
  };
  
  useEffect(() => {
    // Gera valor aleatório entre 0.01 e 0.20 apenas quando a opção Pix muda
    if (paymentMethod === 'pix' && pixSettings.rule !== 'valor_real') {
      const val = (Math.floor(Math.random() * 20) + 1) / 100;
      setRandomCents(val);
    } else {
      setRandomCents(0);
    }
  }, [paymentMethod, pixSettings.rule]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      if (!storeId) {
          setLoading(false);
          return;
      }

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', storeId)
          .gt('stock', 0);
        
        if (error) throw error;
        setProducts(data || []);
        
        // Buscar configurações do catálogo (status e whatsapp) na tabela app_settings
        const { data: settingsData, error: settingsError } = await supabase
            .from('app_settings')
            .select('value, catalog_open')
            .eq('key', 'catalog_settings_' + storeId)
            .maybeSingle();
            
        if (settingsData) {
            if (settingsData.value) {
              setWhatsappNumber(settingsData.value.whatsapp_number || '');
              setPixSettings({
                key: settingsData.value.pix_key || '',
                bank: settingsData.value.pix_bank || '',
                rule: settingsData.value.pix_rule || 'valor_real'
              });
            }
            setCatalogSettings({ isOpen: settingsData.catalog_open ?? true });
        }

        
      } catch (err) {
        console.error('Erro ao buscar produtos/configurações:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [storeId]);

  // Novo useEffect para Realtime (Depuração e Sincronização em Tempo Real)
  useEffect(() => {
    if (!storeId) return;

    console.log('Iniciando subscrição Realtime para sincronização...');

    const channel = supabase
      .channel('catalog_realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'app_settings',
        filter: `key=eq.catalog_settings_${storeId}`
      }, (payload) => {
        console.log('EVENTO REALTIME RECEBIDO:', payload);
        if (payload.new) {
            const newRecord = payload.new as any;
            if (newRecord.catalog_open !== undefined) {
                setCatalogSettings({ isOpen: newRecord.catalog_open ?? true });
            }
            if (newRecord.value) {
                const val = newRecord.value;
                setWhatsappNumber(val.whatsapp_number || '');
                setPixSettings({
                    key: val.pix_key || '',
                    bank: val.pix_bank || '',
                    rule: val.pix_rule || 'valor_real'
                });
            }
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') console.log('Conectado ao Realtime em app_settings!');
        if (status === 'CHANNEL_ERROR') console.error('Erro de conexão ao Realtime:', err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(i => i.id === productId ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(i => i.id !== productId));
  };

  const total = cart.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  
  const calculateTotal = () => {
      if (paymentMethod !== 'pix') return total;
      switch (pixSettings.rule) {
          case 'pix_identified': return total + randomCents;
          case 'pix_promotional': return Math.max(0, total - randomCents);
          default: return total;
      }
  }
  const finalTotalWithCents = paymentMethod === 'pix' ? Number(calculateTotal().toFixed(2)) : total;
  const itemCount = cart.reduce((sum, p) => sum + p.quantity, 0);

  const saveOrder = async () => {
    if (!storeId || cart.length === 0) return null;

    if (!customerName.trim() || !customerPhone.trim() || !customerEmail.trim()) {
      setAvisoTelefone('Por favor, preencha todos os campos obrigatórios (*).');
      return null;
    }

    setIsSubmitting(true);
    setDuplicateErrors({ cpf: false, phone: false, email: false });
    setErrorMessages({ cpf: '', phone: '', email: '' });
    setAvisoTelefone('');

    const fullName = `${customerName} ${customerLastName}`.trim();

    try {
      // Pré-validação do cliente no Supabase antes do envio
      const cleanPhoneDigits = customerPhone.replace(/\D/g, '');
      const cleanEmailLower = customerEmail.trim().toLowerCase();
      const cleanCpfDigits = customerCpf.replace(/\D/g, '');

      if (cleanPhoneDigits || cleanEmailLower || cleanCpfDigits) {
        const { data: existingCustomers } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', storeId);

        if (existingCustomers && existingCustomers.length > 0) {
          const matchingCust = existingCustomers.find((c: any) => {
            const cPhoneDigits = (c.phone || '').replace(/\D/g, '');
            const cCpfDigits = (c.cpf || '').replace(/\D/g, '');
            const cEmailLower = (c.email || '').trim().toLowerCase();

            const matchPhone = cleanPhoneDigits.length >= 8 && cPhoneDigits.length >= 8 && cleanPhoneDigits === cPhoneDigits;
            const matchEmail = cleanEmailLower.length > 0 && cEmailLower.length > 0 && cleanEmailLower === cEmailLower;
            const matchCpf = cleanCpfDigits.length >= 11 && cCpfDigits.length >= 11 && cleanCpfDigits === cCpfDigits;

            return matchPhone || matchEmail || matchCpf;
          });

          if (matchingCust) {
            const cPhoneDigits = (matchingCust.phone || '').replace(/\D/g, '');
            const cCpfDigits = (matchingCust.cpf || '').replace(/\D/g, '');
            const cEmailLower = (matchingCust.email || '').trim().toLowerCase();

            const phoneMatches = cleanPhoneDigits.length >= 8 && cPhoneDigits.length >= 8 && cleanPhoneDigits === cPhoneDigits;

            if (!phoneMatches || stepCheckout === 'complete_form') {
              const newDupErrors = { cpf: false, phone: false, email: false };
              const newErrorMsgs = { cpf: '', phone: '', email: '' };
              let avisoMsg = '';

              if (cleanPhoneDigits.length >= 8 && cPhoneDigits === cleanPhoneDigits) {
                newDupErrors.phone = true;
                newErrorMsgs.phone = `Este WhatsApp/Telefone já está cadastrado em nossa base.`;
                avisoMsg = 'Este WhatsApp/Telefone já está cadastrado em nossa base.';
              } else if (cleanCpfDigits.length >= 11 && cCpfDigits === cleanCpfDigits) {
                newDupErrors.cpf = true;
                newErrorMsgs.cpf = `Este CPF já está cadastrado no sistema.`;
                avisoMsg = 'Este CPF já está cadastrado no sistema.';
              } else if (cleanEmailLower.length > 0 && cEmailLower === cleanEmailLower) {
                newDupErrors.email = true;
                newErrorMsgs.email = `Este E-mail já está sendo utilizado por outro cliente.`;
                avisoMsg = 'Este E-mail já está sendo utilizado por outro cliente.';
              }

              setAvisoTelefone(avisoMsg);
              setDuplicateErrors(newDupErrors);
              setErrorMessages(newErrorMsgs);
              setIsSubmitting(false);
              return null;
            }
          }
        }
      }

      const response = await fetch('/api/catalog/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          storeId,
          cart,
          name: fullName,
          customerName,
          customerLastName,
          customerCpf,
          customerPhone,
          customerEmail,
          paymentMethod,
          pixSettings,
          randomCents
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao processar pedido no servidor');
      }

      const responseData = await response.json();
      const newOrderId = responseData.orderId;
      const orderExpiresAt = responseData.expiresAt;
      
      setOrderId(newOrderId);
      setExpiresAt(orderExpiresAt || null);
      return newOrderId;
    } catch (err: any) {
      console.error('Erro ao salvar pedido via API:', err);
      const msg = err.message || '';
      setAvisoTelefone(msg || 'Erro ao processar pedido no servidor.');
      if (msg.includes('Telefone') || msg.includes('WhatsApp') || msg.includes('E-mail') || msg.includes('CPF')) {
        const newDup = { cpf: false, phone: false, email: false };
        const newMsgs = { cpf: '', phone: '', email: '' };
        if (msg.includes('Telefone') || msg.includes('WhatsApp')) {
          newDup.phone = true;
          newMsgs.phone = msg;
        }
        if (msg.includes('E-mail')) {
          newDup.email = true;
          newMsgs.email = msg;
        }
        if (msg.includes('CPF')) {
          newDup.cpf = true;
          newMsgs.cpf = msg;
        }
        setDuplicateErrors(newDup);
        setErrorMessages(newMsgs);
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelarPedidoAtual = async (action: 'back' | 'full') => {
    if (!orderId) {
      if (action === 'full') {
        setCart([]);
        setIsCartOpen(false);
      }
      setCheckoutStep('cart');
      return;
    }

    try {
      console.log(`Cancelando pedido #${orderId} em tempo real...`);
      const response = await fetch('/api/catalog/cancel-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          storeId
        })
      });

      if (!response.ok) {
        console.error('Falha ao cancelar pedido no servidor.');
      }
    } catch (err) {
      console.error('Erro ao chamar cancelamento de pedido:', err);
    } finally {
      // Limpa as variáveis do pedido localmente
      setOrderId(null);
      setExpiresAt(null);
      
      if (action === 'full') {
        setCart([]);
        setIsCartOpen(false);
      }
      setCheckoutStep('cart');
    }
  };

  const sendWhatsAppOrder = async () => {
    const id = await saveOrder();
    if (!id) return;

    const cleanPhone = whatsappNumber.replace(/\D/g, ''); 
    
    if (!cleanPhone || cleanPhone === '5511999999999' || cleanPhone.length < 10) {
        alert('O número de WhatsApp da loja não está configurado corretamente.');
        return;
    }

    const fullName = `${customerName} ${customerLastName}`.trim();

    const addressStr = deliveryType === 'delivery' 
        ? `\n*Endereço:* ${address}, ${number} - ${neighborhood}${reference ? ` (${reference})` : ''}` 
        : '';
    
    const paymentStr = paymentMethod === 'cash' 
        ? `Dinheiro${changeFor ? ` (Troco para R$ ${changeFor})` : ''}`
        : paymentMethod === 'pix' ? 'Pix (Aguardando comprovante)' : 'Cartão';

    const message = `*🛍️ NOVO PEDIDO #${id} - Vendeei*\n` +
      `--------------------------------\n` +
      `*Cliente:* ${fullName}\n` +
      (customerPhone ? `*Telefone:* ${customerPhone}\n` : '') +
      (customerEmail ? `*E-mail:* ${customerEmail}\n` : '') +
      `*Entrega:* ${deliveryType === 'pickup' ? 'Retirada no Balcão' : 'Entrega em Casa'}` +
      `${addressStr}\n` +
      `--------------------------------\n` +
      `*ITENS DO PEDIDO:*\n` +
      cart.map(i => `• ${i.quantity}x ${i.name} (R$ ${(i.price * i.quantity).toFixed(2)})`).join('\n') +
      `\n--------------------------------\n` +
      `*Total:* R$ ${finalTotalWithCents.toFixed(2)}\n` +
      `*Forma de Pagamento:* ${paymentStr}`;

    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    if (paymentMethod === 'pix') {
      pixFoiCopiadoRef.current = false;
      setPixCopiado(false);
      setAvisoPix('');
      setCheckoutStep('pix_instructions');
    } else {
      window.open(whatsappUrl, '_blank');
      // Limpa o carrinho e fecha
      setCart([]);
      setIsCartOpen(false);
      resetCustomerForm();
      setOrderId(null);
      setExpiresAt(null);
    }
  };

  const sendPixProof = () => {
    if (!pixFoiCopiadoRef.current && !pixCopiado) {
      setAvisoPix('Atenção: Você precisa clicar em "Copiar Chave Pix" antes de enviar o comprovante.');
      return;
    }
    if (!orderId) return;
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const expiryDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 30 * 60 * 1000);
    const formattedExpirationTime = expiryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fullName = `${customerName} ${customerLastName}`.trim();

    const proofMessage = `\u2705 *AGUARDANDO COMPROVANTE*\n` +
      `*Pedido:* #${orderId}\n` +
      `*Cliente:* ${fullName}\n` +
      `*Valor à Pagar:* R$ ${finalTotalWithCents.toFixed(2)}\n\n` +
      `Envie o comprovante antes das *${formattedExpirationTime}* para evitar cancelamento automático do seu pedido.`;
      
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(proofMessage)}`, '_blank');
    
    // Finaliza o fluxo
    setCart([]);
    setIsCartOpen(false);
    resetCustomerForm();
    setOrderId(null);
    setExpiresAt(null);
    setCheckoutStep('cart');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-slate-900 text-white p-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-1.5 rounded-lg">
              <Store size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold font-vendeei tracking-tight">Vendeei</h1>
          </div>
          <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold ${catalogSettings.isOpen ? 'bg-green-600' : 'bg-red-600'}`}>
            {catalogSettings.isOpen ? '🟢 Aberto' : '🔴 Fechado'}
          </span>
        </div>
        <div className="max-w-4xl mx-auto mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              placeholder="Buscar produtos..."
              className="w-full bg-slate-800 text-white placeholder:text-slate-500 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pb-24">
        {loading ? (
            <p className="text-center text-slate-500">Carregando...</p>
        ) : !catalogSettings.isOpen ? (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-sm mx-auto text-center mt-10">
               <h2 className="text-xl font-bold mb-4">Catálogo Fechado</h2>
               <p className="text-slate-600">No momento este catálogo está fechado. Por favor, volte mais tarde ou entre em contato pelo WhatsApp.</p>
             </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-2">
                    <div className="h-40 bg-slate-200 rounded-xl mb-2 flex items-center justify-center text-slate-400 overflow-hidden">
                        <img 
                            src={p.imageUrl || (p as any).image_url || (p as any).image || 'https://placehold.co/200x200?text=Sem+Imagem'}
                            alt={p.name} 
                            className="w-full h-full object-cover" 
                        />
                    </div>
                    <h3 className="font-bold text-slate-900 uppercase text-sm">{p.name}</h3>
                    <div className="flex items-center justify-between mt-auto">
                        <span className="text-green-600 font-black text-lg">R$ {p.price.toFixed(2)}</span>
                        <button 
                         onClick={() => addToCart(p)}
                         className="bg-slate-900 text-white p-2 rounded-full hover:bg-slate-800 transition">
                            <Plus size={18} />
                        </button>
                    </div>
                </div>
              ))}
            </div>
        )}
      </main>

      {/* Cart Drawer/Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-sm h-full overflow-y-auto p-6 animate-slide-in-right">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold">
                        {checkoutStep === 'cart' ? 'Seu Pedido' : 'Pagamento Pix'}
                    </h2>
                    <button onClick={() => {
                        if (checkoutStep === 'pix_instructions') {
                            handleCancelarPedidoAtual('full');
                        } else {
                            setIsCartOpen(false);
                            setCheckoutStep('cart');
                        }
                    }}><X size={24}/></button>
                </div>
                
                {checkoutStep === 'cart' ? (
                  <>
                    <div className="space-y-4 mb-6">
                        {cart.map(item => (
                            <div key={item.id} className="flex gap-4 items-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-lg" />
                                <div className="flex-1">
                                    <h4 className="font-bold text-sm">{item.name}</h4>
                                    <span className="text-green-600 font-bold">R$ {item.price.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 border rounded"><Minus size={14}/></button>
                                    <span>{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 border rounded"><Plus size={14}/></button>
                                    <button onClick={() => removeFromCart(item.id)} className="text-red-500 ml-2"><Trash2 size={14}/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        {/* DADOS DO CLIENTE */}
                        <div className="space-y-3">
                            {/* Passo 1: Sempre pede apenas o WhatsApp primeiro */}
                            <div>
                                <label className="text-xs text-gray-500 font-semibold mb-1 block">
                                    WhatsApp / Telefone *
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        placeholder="(00) 90000-0000"
                                        maxLength={15}
                                        value={customerPhone}
                                        onChange={(e) => handlePhoneChange(e.target.value)}
                                        onBlur={() => {
                                            const cleanDigits = customerPhone.replace(/\D/g, '');
                                            if (cleanDigits.length === 11 && stepCheckout === 'phone_check' && !isCheckingPhone) {
                                                checkCustomerByPhone(customerPhone);
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && stepCheckout === 'phone_check') {
                                                e.preventDefault();
                                                handleVerificarTelefone();
                                            }
                                        }}
                                        disabled={isCheckingPhone || stepCheckout === 'ready_to_buy'}
                                        required
                                        className={`w-full p-3 bg-gray-50 border rounded-xl text-sm outline-none focus:bg-white focus:ring-2 transition-all ${
                                            duplicateErrors.phone
                                                ? 'border-red-500 ring-2 ring-red-500/20 bg-red-50/50'
                                                : 'border-gray-200 focus:ring-green-500'
                                        }`}
                                    />
                                    {stepCheckout === 'phone_check' && (
                                        <button
                                            type="button"
                                            onClick={handleVerificarTelefone}
                                            disabled={isCheckingPhone || !customerPhone.trim()}
                                            className="bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center min-w-[60px]"
                                        >
                                            {isCheckingPhone ? '...' : 'OK'}
                                        </button>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 block">Informe o DDD e o número com 9 dígitos.</span>
                                {avisoTelefone && (
                                    <div className="flex items-center gap-1.5 text-amber-700 text-xs mt-1.5 bg-amber-50 p-2 rounded-lg border border-amber-200 font-medium animate-fade-in">
                                        <span>⚠️</span>
                                        <span>{avisoTelefone}</span>
                                    </div>
                                )}
                                {duplicateErrors.phone && (
                                    <p className="text-xs text-red-600 font-semibold mt-1 px-1 flex items-center gap-1">
                                        ⚠️ {errorMessages.phone}
                                    </p>
                                )}
                            </div>

                            {/* Se já for cliente cadastrado, mostra mensagem amigável */}
                            {stepCheckout === 'ready_to_buy' && isExistingCustomer && (
                                <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-sm text-green-800 space-y-1 animate-fade-in">
                                    <p className="font-semibold">
                                        👋 Olá, <b>{customerName}</b>! Reconhecemos seu número. Pronto para finalizar?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStepCheckout('phone_check');
                                            setIsExistingCustomer(false);
                                        }}
                                        className="text-xs text-blue-600 hover:underline block font-medium"
                                    >
                                        Não é você? Alterar número
                                    </button>
                                </div>
                            )}

                            {/* Se o cliente for NOVO ou se abriu o formulário completo */}
                            {stepCheckout === 'complete_form' && (
                                <div className="space-y-3 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-300 animate-fade-in">
                                    <p className="text-xs text-green-700 font-semibold flex items-center gap-1">
                                        ✨ Número novo! Por favor, preencha seus dados:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="Nome *"
                                            value={customerName}
                                            onChange={(e) => { setCustomerName(e.target.value); if (avisoTelefone) setAvisoTelefone(''); }}
                                            required
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Sobrenome"
                                            value={customerLastName}
                                            onChange={(e) => { setCustomerLastName(e.target.value); if (avisoTelefone) setAvisoTelefone(''); }}
                                            className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                                        />
                                    </div>

                                    <div>
                                        <input
                                            type="text"
                                            placeholder="CPF (apenas números ex: 12345678901)"
                                            value={customerCpf}
                                            onChange={(e) => handleCpfChange(e.target.value)}
                                            maxLength={11}
                                            className={`w-full p-2.5 bg-white border rounded-lg text-sm outline-none focus:ring-2 transition-all ${
                                                duplicateErrors.cpf
                                                    ? 'border-red-500 ring-2 ring-red-500/20'
                                                    : 'border-gray-200 focus:ring-green-500'
                                            }`}
                                        />
                                        {duplicateErrors.cpf && (
                                            <p className="text-xs text-red-600 font-semibold mt-1 px-1 flex items-center gap-1">
                                                ⚠️ {errorMessages.cpf}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            type="email"
                                            placeholder="E-mail *"
                                            value={customerEmail}
                                            onChange={(e) => {
                                                setCustomerEmail(e.target.value);
                                                if (duplicateErrors.email) {
                                                    setDuplicateErrors(prev => ({ ...prev, email: false }));
                                                    setErrorMessages(prev => ({ ...prev, email: '' }));
                                                }
                                            }}
                                            required
                                            className={`w-full p-2.5 bg-white border rounded-lg text-sm outline-none focus:ring-2 transition-all ${
                                                duplicateErrors.email
                                                    ? 'border-red-500 ring-2 ring-red-500/20'
                                                    : 'border-gray-200 focus:ring-green-500'
                                            }`}
                                        />
                                        {duplicateErrors.email && (
                                            <p className="text-xs text-red-600 font-semibold mt-1 px-1 flex items-center gap-1">
                                                ⚠️ {errorMessages.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-2">
                            <button onClick={() => setDeliveryType('pickup')} className={`flex-1 p-2 rounded-lg ${deliveryType === 'pickup' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>Retirada</button>
                            <button onClick={() => setDeliveryType('delivery')} className={`flex-1 p-2 rounded-lg ${deliveryType === 'delivery' ? 'bg-green-600 text-white' : 'bg-slate-100'}`}>Entrega</button>
                        </div>

                        {deliveryType === 'delivery' && (
                            <div className="space-y-2">
                                <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua / Avenida" className="w-full border p-2 rounded-lg" />
                                <div className="flex gap-2">
                                    <input value={number} onChange={e => setNumber(e.target.value)} placeholder="Nº" className="w-full border p-2 rounded-lg" />
                                    <input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" className="w-full border p-2 rounded-lg" />
                                </div>
                                <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ponto de referência" className="w-full border p-2 rounded-lg" />
                            </div>
                        )}

                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as any)} className="w-full border p-2 rounded-lg">
                            <option value="pix">Pagamento: Pix</option>
                            <option value="cash">Pagamento: Dinheiro</option>
                            <option value="card">Pagamento: Cartão</option>
                        </select>

                        {paymentMethod === 'cash' && (
                            <input value={changeFor} onChange={e => setChangeFor(e.target.value)} placeholder="Precisa de troco para quanto?" className="w-full border p-2 rounded-lg" />
                        )}

                        {paymentMethod === 'pix' && pixSettings.key && (
                            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-3 animate-fade-in">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                                    <QrCode size={18} /> Pagamento via Pix
                                </div>
                                <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                                    <p className="text-[11px] text-amber-700 font-bold leading-tight">
                                        💡 Ao finalizar, seu total será de <span className="text-sm">R$ {finalTotalWithCents.toFixed(2)}</span>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Botão de Enviar Pedido (só aparece se já validou o telefone ou completou o cadastro) */}
                        {(stepCheckout === 'ready_to_buy' || stepCheckout === 'complete_form') && (
                            <button 
                                onClick={sendWhatsAppOrder}
                                disabled={isSubmitting || cart.length === 0 || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim()}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isSubmitting || !customerName.trim() || !customerPhone.trim() || !customerEmail.trim() ? 'bg-slate-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'}`}
                            >
                                {isSubmitting ? 'Processando...' : 'Enviar Pedido'} <ChevronRight size={18}/>
                            </button>
                        )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 animate-fade-in py-4">
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <QrCode size={32} />
                      </div>
                      <h3 className="font-bold text-lg">Quase lá!</h3>
                      <p className="text-sm text-slate-500">Realize o pagamento Pix para confirmar seu pedido.</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-100 space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Valor Exato</p>
                        <p className="text-2xl font-black text-emerald-600">R$ {finalTotalWithCents.toFixed(2)}</p>
                        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                          <p className="text-xs text-amber-800 font-medium leading-relaxed">
                            <span className="font-bold">Atenção:</span> Para sua segurança e nossa agilidade, realize o pagamento com este <span className="font-bold underline">valor exato</span>.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-200 text-left">
                        {pixSettings.bank && (
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Destinatário: <span className="font-semibold text-slate-700 normal-case">{pixSettings.bank}</span>
                          </div>
                        )}
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Chave Pix</p>
                          <div className="text-sm font-mono font-bold text-slate-800 break-all select-none bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                            {pixSettings.key}
                          </div>
                        </div>
                        <button
                          onClick={copiarChavePix}
                          className="w-full mt-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 border border-slate-200 active:scale-95"
                        >
                          {copied ? (
                            <>
                              <Check size={14} className="text-emerald-600 animate-bounce" />
                              <span className="text-emerald-600">Chave Copiada!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={14} />
                              <span>Copiar Chave Pix</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {avisoPix && (
                        <div className="flex items-center gap-2 text-amber-800 text-xs bg-amber-50 p-3 rounded-xl border border-amber-300 shadow-sm text-left">
                          <span className="text-base">⚠️</span>
                          <span className="font-semibold">{avisoPix}</span>
                        </div>
                      )}

                      <button 
                        onClick={sendPixProof}
                        disabled={!pixFoiCopiadoRef.current && !pixCopiado}
                        className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all duration-200 ${
                          (pixFoiCopiadoRef.current || pixCopiado) 
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200 cursor-pointer transform active:scale-98' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 border border-gray-300'
                        }`}
                      >
                        <span>Enviar Comprovante</span> <ChevronRight size={18}/>
                      </button>

                      <button 
                        onClick={() => handleCancelarPedidoAtual('full')}
                        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 border border-red-100 active:scale-95"
                      >
                        <Trash2 size={14} /> Cancelar Pedido e Limpar Carrinho
                      </button>

                      <button 
                        onClick={() => handleCancelarPedidoAtual('back')}
                        className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium text-xs text-center transition-colors"
                      >
                        Voltar para o carrinho
                      </button>
                    </div>
                  </div>
                )}
            </div>
        </div>
      )}

      {/* Cart Float */}
      {itemCount > 0 && (
        <button 
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-4 left-4 right-4 bg-green-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between font-bold z-30"
        >
           <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <span>{itemCount} itens</span>
           </div>
           <span>Total: R$ {total.toFixed(2)}</span>
        </button>
      )}
    </div>
  );
};
