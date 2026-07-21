
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product, Sale, CartItem, Profile, Customer } from '../types';
import { INITIAL_PRODUCTS } from '../constants';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { playOrderEnteredSound, playOrderCanceledSound } from '../services/audioService';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreContextType {
  user: User | null;
  profile: Profile | null;
  products: Product[];
  sales: Sale[];
  cart: CartItem[];
  allTimeStats: { revenue: number; salesCount: number; totalProfit: number };
  isDefaultPassword: boolean;
  loading: boolean;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, delta: number) => void;
  clearCart: () => void;
  completeSale: (paymentMethod: Sale['paymentMethod'], discount: number, customer: Customer | null, surcharge: number) => Promise<Sale | null>;
  cancelSale: (saleId: string, password: string) => Promise<{ success: boolean; message: string }>;
  clearSalesHistory: (password: string) => Promise<boolean>;
  updateSaleStatus: (saleId: string, status: Sale['status']) => Promise<boolean>;
  resetSystem: (password: string) => Promise<boolean>;
  updateAdminPassword: (currentPw: string, newPw: string) => Promise<boolean>;
  exportSalesToCSV: () => void;
  signOut: () => Promise<void>;
  checkSubscription: () => boolean;
  isDemoMode: boolean;
  enterDemoMode: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminPassword, setAdminPassword] = useState<string>('admin');
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => sessionStorage.getItem('vendeei_demo_mode') === 'true');

  const [allTimeStats, setAllTimeStats] = useState({ revenue: 0, salesCount: 0, totalProfit: 0 });

  const isDefaultPassword = adminPassword === 'admin';

  const enterDemoMode = () => {
    sessionStorage.setItem('vendeei_demo_mode', 'true');
    setIsDemoMode(true);
  };

  const fetchProducts = async () => {
    if (isDemoMode) {
      const savedProducts = localStorage.getItem('vendeei_demo_products');
      let loadedProducts = INITIAL_PRODUCTS;
      if (savedProducts) {
        try {
          loadedProducts = JSON.parse(savedProducts);
        } catch (e) {
          console.error(e);
        }
      }
      setProducts(loadedProducts);
      return;
    }

    if (!user?.id) return;
    try {
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (productsData) {
        setProducts(productsData.map(p => ({
          ...p,
          costPrice: Number(p.cost_price),
          price: Number(p.price),
          imageUrl: p.image_url
        })));
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
    }
  };

  const fetchSales = async () => {
    if (isDemoMode) {
      const savedSales = localStorage.getItem('vendeei_demo_sales');
      let loadedSales: Sale[] = [];
      if (savedSales) {
        try {
          loadedSales = JSON.parse(savedSales);
        } catch (e) {
          console.error(e);
        }
      }
      setSales(loadedSales);

      const stats = loadedSales.reduce((acc, s) => {
        if (s.status !== 'canceled') {
          acc.revenue += s.total;
          acc.salesCount += 1;
          acc.totalProfit += s.profit;
        }
        return acc;
      }, { revenue: 0, salesCount: 0, totalProfit: 0 });
      setAllTimeStats(stats);
      return;
    }

    if (!user?.id) return;
    try {
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });
      
      if (salesData) {
        const formattedSales: Sale[] = salesData.map(s => ({
          id: s.id,
          timestamp: new Date(s.timestamp).getTime(),
          subtotal: Number(s.subtotal),
          discount: Number(s.discount),
          surcharge: Number(s.surcharge),
          total: Number(s.total),
          profit: Number(s.profit),
          customerName: s.customer_name,
          paymentMethod: s.payment_method as any,
          status: s.status as any,
          expiresAt: s.expires_at,
          items: s.sale_items.map((si: any) => ({
            id: si.product_id,
            name: si.name,
            quantity: si.quantity,
            price: Number(si.price_at_sale),
            costPrice: Number(si.cost_price_at_sale)
          }))
        }));
        setSales(formattedSales);

        const stats = formattedSales.reduce((acc, s) => {
          if (s.status !== 'canceled') {
            acc.revenue += s.total;
            acc.salesCount += 1;
            acc.totalProfit += s.profit;
          }
          return acc;
        }, { revenue: 0, salesCount: 0, totalProfit: 0 });
        setAllTimeStats(stats);
      } else {
        setSales([]);
        setAllTimeStats({ revenue: 0, salesCount: 0, totalProfit: 0 });
      }
    } catch (err) {
      console.error('Erro ao buscar vendas:', err);
    }
  };

  // Gerenciar Sessão do Usuário
  useEffect(() => {
    let mounted = true;

    if (isDemoMode) {
      setUser({ id: 'demo-user', email: 'demo@vendeei.com' } as any);
      setLoading(false);
      return;
    }

    // Busca a sessão inicial IMEDIATAMENTE
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          if (session?.user) {
            console.log('Sessão inicial detectada:', session.user.email);
            setUser(session.user);
          } else {
            // TRAVA DE AUTENTICAÇÃO: Se não houver usuário, force imediatamente loading false
            console.log('Nenhuma sessão inicial encontrada.');
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar sessão inicial no Supabase:', error);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };
    initSession();

    // Ouve mudanças de auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        console.log('Evento de Auth:', event, session?.user?.email);
        setUser(session?.user ?? null);
        
        if (!session?.user) {
          // Caso do Logout: limpa estados e descarta loading imediatamente
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isDemoMode]);

  // Carregar Perfil e Dados quando o usuário mudar
  useEffect(() => {
    if (isDemoMode) {
      setLoading(true);
      const mockProfile: Profile = {
        id: 'demo-user',
        email: 'demo@vendeei.com',
        role: 'customer',
        subscription_status: 'trial',
        subscription_expiry: null,
        created_at: new Date().toISOString(),
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        store_name: 'Minha Loja Demo'
      };
      setProfile(mockProfile);

      // Carregar produtos
      const savedProducts = localStorage.getItem('vendeei_demo_products');
      let loadedProducts = INITIAL_PRODUCTS;
      if (savedProducts) {
        try {
          loadedProducts = JSON.parse(savedProducts);
        } catch (e) {
          console.error(e);
        }
      } else {
        localStorage.setItem('vendeei_demo_products', JSON.stringify(INITIAL_PRODUCTS));
      }
      setProducts(loadedProducts);

      // Carregar vendas
      fetchSales();

      setLoading(false);
      return;
    }

    if (!user?.id) {
      setProducts([]);
      setSales([]);
      setLoading(false);
      return;
    }

    const loadProfileData = async () => {
      setLoading(true);
      console.log('Carregando perfil para:', user.email);
      try {
        let currentProfile = null;
        let retries = 3;
        
        while (retries > 0 && !currentProfile) {
          console.log(`Buscando perfil no banco... (Tentativas restantes: ${retries})`);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id);

          if (profileError) {
            console.error('Erro ao buscar perfil:', profileError);
          }

          currentProfile = (profileData && profileData.length > 0) ? profileData[0] : null;

          if (!currentProfile) {
            retries--;
            if (retries > 0) {
              console.warn('Perfil não encontrado, aguardando trigger (1s)...');
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
          }
        }

        if (currentProfile) {
          // Normalizar e preencher as propriedades de controle de monetização camelCase
          let status = (currentProfile.subscription_status || 'trial') as 'trial' | 'active' | 'canceled' | 'expired';
          const trialEndDateStr = currentProfile.subscription_expiry || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
          
          // Se for "trial" e a data atual for MAIOR que o término, muda para expired
          if (status === 'trial') {
            const trialEnd = new Date(trialEndDateStr);
            if (new Date() > trialEnd) {
              console.log('Período de testes (Trial) expirado! Atualizando status para "expired" no banco...');
              status = 'expired';
              
              // Atualizar no banco de dados de maneira assíncrona
              supabase.from('profiles')
                .update({ subscription_status: 'expired' })
                .eq('id', user.id)
                .then(({ error }) => {
                  if (error) console.error('Erro ao atualizar status de assinatura expirada:', error);
                });
            }
          }

          const augmentedProfile: Profile = {
            ...currentProfile,
            subscription_status: status,
            subscriptionStatus: status,
            trialEndDate: trialEndDateStr,
            stripeCustomerId: currentProfile.stripe_customer_id || undefined,
            asaasCustomerId: currentProfile.asaas_customer_id || undefined
          };

          setProfile(augmentedProfile);
          // Atualizar última atividade de forma silenciosa
          supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('id', user.id).then();
          console.log('Perfil carregado com sucesso:', augmentedProfile.role, augmentedProfile.subscriptionStatus);
        } else {
          // AUTO-HEALING: Se após retries não existir, cria um perfil padrão para não travar o app
          console.warn('Perfil não encontrado após retries. Criando perfil padrão (self-healing)...');
          const isAdmin = user.email === 'backup02atelietetemimos@gmail.com';
          
          const defaultProfile = {
            id: user.id,
            email: user.email || '',
            role: isAdmin ? 'admin' : 'customer',
            subscription_status: isAdmin ? 'active' : 'trial',
            subscription_expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            store_name: 'Minha Loja'
          };

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .upsert([defaultProfile])
            .select()
            .single();

          if (createError) {
            console.error('Erro crítico ao criar perfil de fallback:', createError);
            // Se falhou até o fallback, usamos um perfil local temporário para evitar a tela de erro fatal
            setProfile(defaultProfile as any);
          } else {
            setProfile(newProfile as any);
          }
        }

        // 2. Buscar Produtos do Usuário
        await fetchProducts();

        // 3. Buscar Vendas do Usuário
        await fetchSales();

      } catch (err: any) {
        console.error('Erro ao carregar dados do usuário:', err);
        addToast(`Erro de perfil: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [user?.id, isDemoMode]);

  // Realtime Subscription para Vendas e Produtos (Estoque)
  useEffect(() => {
    if (isDemoMode) return;
    if (!user?.id) return;

    console.log('Iniciando subscrições Realtime para vendas e produtos...');
    
    const salesChannel = supabase
      .channel(`realtime-sales-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Mudança detectada em "sales":', payload.eventType);
          fetchSales();
          fetchProducts();
          if (payload.eventType === 'INSERT') {
            playOrderEnteredSound();
          } else if (payload.eventType === 'DELETE') {
            playOrderCanceledSound();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao Realtime de Vendas!');
        }
      });

    const productsChannel = supabase
      .channel(`realtime-products-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuta INSERT, UPDATE e DELETE
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          console.log('Mudança detectada em "products":', payload.eventType);
          fetchProducts();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado ao Realtime de Produtos/Estoque!');
        }
      });

    return () => {
      console.log('Limpando subscrições Realtime...');
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [user?.id]);

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      sessionStorage.removeItem('vendeei_demo_mode');
      setUser(null);
      setProfile(null);
      addToast('Sessão de demonstração encerrada', 'info');
      return;
    }
    await supabase.auth.signOut();
    addToast('Sessão encerrada', 'info');
  };

  const checkSubscription = () => {
    if (!profile) return false;
    // Administrador tem acesso irrestrito
    if (profile.role === 'admin') return true;

    const status = profile.subscriptionStatus || profile.subscription_status;
    const expiry = profile.trialEndDate || profile.subscription_expiry;

    // Se o status for 'active', permite acesso total.
    if (status === 'active') return true;

    // Se o status for 'trial' e data atual menor que trialEndDate, permite acesso total.
    if (status === 'trial') {
      if (!expiry) return true; // Se não tem data, assume que está em teste
      const trialEnd = new Date(expiry);
      return new Date() < trialEnd;
    }

    // Se o status for 'expired' ou 'canceled', bloqueia o acesso.
    return false;
  };

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  const addProduct = async (product: Product) => {
    if (isDemoMode) {
      const updatedProducts = [...products, product];
      setProducts(updatedProducts);
      localStorage.setItem('vendeei_demo_products', JSON.stringify(updatedProducts));
      addToast('Produto salvo (Modo Demo)', 'success');
      return;
    }
    if (!user) return;
    try {
      const { error } = await supabase
        .from('products')
        .insert([{
          id: product.id,
          user_id: user.id,
          name: product.name,
          category: product.category,
          price: product.price,
          cost_price: product.costPrice,
          stock: product.stock,
          description: product.description,
          image_url: product.imageUrl,
          barcode: product.barcode
        }]);

      if (error) throw error;
      setProducts(prev => [...prev, product]);
      addToast('Produto salvo', 'success');
    } catch (err: any) {
      addToast(`Erro ao salvar: ${err.message}`, 'error');
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (isDemoMode) {
      const updatedProducts = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
      setProducts(updatedProducts);
      localStorage.setItem('vendeei_demo_products', JSON.stringify(updatedProducts));
      addToast('Produto atualizado (Modo Demo)', 'success');
      return;
    }
    if (!user) return;
    try {
      const { error } = await supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          category: updatedProduct.category,
          price: updatedProduct.price,
          cost_price: updatedProduct.costPrice,
          stock: updatedProduct.stock,
          description: updatedProduct.description,
          image_url: updatedProduct.imageUrl,
          barcode: updatedProduct.barcode,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedProduct.id)
        .eq('user_id', user.id); // Segurança extra

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
      addToast('Produto atualizado', 'success');
    } catch (err) {
      addToast('Erro ao atualizar produto', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (isDemoMode) {
      const updatedProducts = products.filter(p => p.id !== id);
      setProducts(updatedProducts);
      setCart(prev => prev.filter(item => item.id !== id));
      localStorage.setItem('vendeei_demo_products', JSON.stringify(updatedProducts));
      addToast('Produto removido (Modo Demo)', 'info');
      return;
    }
    if (!user) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      setCart(prev => prev.filter(item => item.id !== id));
      addToast('Produto removido', 'info');
    } catch (err) {
      addToast('Erro ao remover produto', 'error');
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentProduct = products.find(p => p.id === product.id);
      const availableStock = currentProduct ? currentProduct.stock : 0;

      if (existing) {
        if (existing.quantity < availableStock) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        addToast('Limite de estoque atingido', 'error');
        return prev;
      }
      if (availableStock > 0) return [...prev, { ...product, quantity: 1 }];
      return prev;
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const currentProduct = products.find(p => p.id === productId);
        const availableStock = currentProduct ? currentProduct.stock : 0;
        const newQty = item.quantity + delta;
        if (newQty > 0 && newQty <= availableStock) return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const completeSale = async (paymentMethod: Sale['paymentMethod'], discount: number, customer: Customer | null, surcharge: number) => {
    if (isDemoMode) {
      const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const total = Math.max(0, subtotal - discount + surcharge);
      const costTotal = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
      const profit = total - costTotal;

      const formattedId = Date.now().toString();

      const newSale: Sale = {
        id: formattedId,
        timestamp: Date.now(),
        subtotal,
        total,
        discount,
        surcharge,
        profit,
        customerName: customer ? customer.name : undefined,
        items: [...cart],
        paymentMethod,
        status: 'completed'
      };

      const updatedSales = [newSale, ...sales];
      setSales(updatedSales);
      localStorage.setItem('vendeei_demo_sales', JSON.stringify(updatedSales));

      const updatedProducts = products.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) {
          const newStock = Math.max(0, p.stock - cartItem.quantity);
          return { ...p, stock: newStock };
        }
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('vendeei_demo_products', JSON.stringify(updatedProducts));

      setAllTimeStats(prev => ({
        revenue: prev.revenue + total,
        salesCount: prev.salesCount + 1,
        totalProfit: prev.totalProfit + profit
      }));

      clearCart();
      addToast(`Venda #${formattedId} realizada com sucesso! (Modo Demo)`, 'success');
      playOrderEnteredSound();
      return newSale;
    }

    if (!user) return null;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = Math.max(0, subtotal - discount + surcharge);
    const costTotal = cart.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0);
    const profit = total - costTotal;

    const formattedId = Date.now().toString();

    const newSale: Sale = {
      id: formattedId,
      timestamp: Date.now(),
      subtotal,
      total,
      discount,
      surcharge,
      profit,
      customerName: customer ? customer.name : undefined,
      items: [...cart],
      paymentMethod,
      status: 'completed'
    };

    try {
      const { error: saleError } = await supabase
        .from('sales')
        .insert([{
          id: formattedId,
          user_id: user.id,
          subtotal,
          total,
          discount,
          surcharge,
          profit,
          customer_name: newSale.customerName,
          payment_method: paymentMethod,
          status: 'completed',
          timestamp: new Date().toISOString()
        }]);

      if (saleError) throw saleError;
      
      // Atualizar total gasto no banco
      if (customer && customer.id) {
        const { data: customerData } = await supabase.from('customers').select('total_spent').eq('id', customer.id).single();
        const currentTotal = Number(customerData?.total_spent) || 0;
        const newTotal = currentTotal + total;
        await supabase.from('customers').update({ total_spent: newTotal }).eq('id', customer.id);
      }

      const saleItems = cart.map(item => ({
        user_id: user.id,
        sale_id: formattedId,
        product_id: item.id,
        name: item.name,
        quantity: item.quantity,
        price_at_sale: item.price,
        cost_price_at_sale: item.costPrice
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.id)
            .eq('user_id', user.id);
        }
      }

      setSales(prev => [newSale, ...prev]);
      setAllTimeStats(prev => ({
        revenue: prev.revenue + total,
        salesCount: prev.salesCount + 1,
        totalProfit: prev.totalProfit + profit
      }));

      setProducts(prev => prev.map(p => {
        const cartItem = cart.find(c => c.id === p.id);
        if (cartItem) return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        return p;
      }));

      await clearCart();
      
      // 4. Update last_sale_at in profile
      if (user) {
        await supabase.from('profiles').update({ last_sale_at: new Date().toISOString() }).eq('id', user.id);
      }

      addToast(`Venda #${formattedId} realizada!`, 'success');
      return newSale;

    } catch (err: any) {
      console.error('Sale error:', err);
      addToast(`Erro ao processar venda: ${err.message || 'Desconhecido'}`, 'error');
      return null;
    }
  };

  const cancelSale = async (saleId: string, password: string) => {
    if (isDemoMode) {
      if (password !== adminPassword) {
        addToast('Senha administrativa incorreta', 'error');
        return { success: false, message: 'Senha incorreta.' };
      }
      const saleIndex = sales.findIndex(s => s.id === saleId);
      if (saleIndex === -1) return { success: false, message: 'Venda não encontrada.' };
      
      const saleToCancel = sales[saleIndex];
      if (saleToCancel.status === 'canceled') return { success: false, message: 'Já cancelada.' };

      const updatedSales = [...sales];
      updatedSales[saleIndex] = { ...saleToCancel, status: 'canceled' };
      setSales(updatedSales);
      localStorage.setItem('vendeei_demo_sales', JSON.stringify(updatedSales));

      const updatedProducts = products.map(p => {
        const itemToReturn = saleToCancel.items.find(item => item.id === p.id);
        if (itemToReturn) return { ...p, stock: p.stock + itemToReturn.quantity };
        return p;
      });
      setProducts(updatedProducts);
      localStorage.setItem('vendeei_demo_products', JSON.stringify(updatedProducts));

      setAllTimeStats(prev => ({
        revenue: Math.max(0, prev.revenue - saleToCancel.total),
        salesCount: prev.salesCount,
        totalProfit: Math.max(0, prev.totalProfit - saleToCancel.profit)
      }));

      addToast(`Venda #${saleId} estornada (Modo Demo)`, 'info');
      playOrderCanceledSound();
      return { success: true, message: 'Venda estornada.' };
    }

    if (!user) return { success: false, message: 'Usuário não autenticado.' };
    if (password !== adminPassword) {
      addToast('Senha administrativa incorreta', 'error');
      return { success: false, message: 'Senha incorreta.' };
    }

    const saleIndex = sales.findIndex(s => s.id === saleId);
    if (saleIndex === -1) return { success: false, message: 'Venda não encontrada.' };
    
    const saleToCancel = sales[saleIndex];
    if (saleToCancel.status === 'canceled') return { success: false, message: 'Já cancelada.' };

    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'canceled' })
        .eq('id', saleId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Devolver estoque com segurança de usuário
      for (const item of saleToCancel.items) {
        const product = products.find(p => p.id === item.id);
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock + item.quantity })
            .eq('id', item.id)
            .eq('user_id', user.id);
        }
      }

      const updatedSales = [...sales];
      updatedSales[saleIndex] = { ...saleToCancel, status: 'canceled' };
      setSales(updatedSales);

      setAllTimeStats(prev => ({
        revenue: Math.max(0, prev.revenue - saleToCancel.total),
        salesCount: prev.salesCount,
        totalProfit: Math.max(0, prev.totalProfit - saleToCancel.profit)
      }));

      setProducts(prev => prev.map(p => {
        const itemToReturn = saleToCancel.items.find(item => item.id === p.id);
        if (itemToReturn) return { ...p, stock: p.stock + itemToReturn.quantity };
        return p;
      }));

      addToast(`Venda #${saleId} estornada`, 'info');
      return { success: true, message: 'Venda estornada.' };
    } catch (err) {
      addToast('Erro ao cancelar venda', 'error');
      console.error(err);
      return { success: false, message: 'Erro no servidor.' };
    }
  };

  const updateSaleStatus = async (saleId: string, status: Sale['status']) => {
    if (isDemoMode) {
      const updatedSales = sales.map(s => s.id === saleId ? { ...s, status } : s);
      setSales(updatedSales);
      localStorage.setItem('vendeei_demo_sales', JSON.stringify(updatedSales));

      if (status === 'completed') {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
          const isAwaitingOrPending = sale.status === 'awaiting_payment' || sale.status === 'pending';
          if (isAwaitingOrPending) {
            setAllTimeStats(prev => ({
              ...prev,
              revenue: prev.revenue + sale.total,
              salesCount: prev.salesCount + 1,
              totalProfit: prev.totalProfit + sale.profit
            }));
          }
        }
      }

      addToast(`Pedido #${saleId} ${status === 'completed' ? 'confirmado' : 'atualizado'} (Modo Demo)`, 'success');
      return true;
    }

    if (!user) return false;
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', saleId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSales(prev => prev.map(s => s.id === saleId ? { ...s, status } : s));
      
      if (status === 'completed') {
        const sale = sales.find(s => s.id === saleId);
        if (sale) {
          const isAwaitingOrPending = sale.status === 'awaiting_payment' || sale.status === 'pending';
          if (isAwaitingOrPending) {
            setAllTimeStats(prev => ({
              ...prev,
              revenue: prev.revenue + sale.total,
              salesCount: prev.salesCount + 1,
              totalProfit: prev.totalProfit + sale.profit
            }));
          }
        }
      }

      addToast(`Pedido #${saleId} ${status === 'completed' ? 'confirmado' : 'atualizado'}`, 'success');
      return true;
    } catch (err) {
      console.error('Error updating status:', err);
      addToast('Erro ao atualizar status do pedido', 'error');
      return false;
    }
  };

  const exportSalesToCSV = () => {
    if (sales.length === 0) return addToast('Sem vendas para exportar', 'error');
    const headers = ['ID', 'Data', 'Cliente', 'Itens', 'Subtotal', 'Desconto', 'Taxa/Acrescimo', 'Total', 'Lucro', 'Metodo', 'Status'];
    const rows = sales.map(s => {
      const itemsList = s.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
      return [
        s.id, 
        new Date(s.timestamp).toLocaleString('pt-BR'), 
        s.customerName || 'Consumidor Final',
        itemsList,
        s.subtotal.toFixed(2).replace('.', ','), 
        s.discount.toFixed(2).replace('.', ','), 
        s.surcharge.toFixed(2).replace('.', ','), 
        s.total.toFixed(2).replace('.', ','), 
        s.profit.toFixed(2).replace('.', ','),
        s.paymentMethod.toUpperCase(), 
        s.status === 'completed' ? 'CONCLUÍDO' : 'ESTORNADO'
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(";")).join("\n");
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const updateAdminPassword = async (currentPw: string, newPw: string) => {
    if (currentPw === adminPassword) {
      if (isDemoMode) {
        setAdminPassword(newPw);
        addToast('Senha alterada (Modo Demo)', 'success');
        return true;
      }
      try {
        const { error } = await supabase
          .from('app_settings')
          .upsert({ key: 'admin_password', value: newPw });
        
        if (error) throw error;
        
        setAdminPassword(newPw);
        addToast('Senha alterada', 'success');
        return true;
      } catch (err) {
        addToast('Erro ao salvar nova senha', 'error');
        console.error(err);
        return false;
      }
    }
    return false;
  };

  const resetSystem = async (password: string) => {
    if (password !== adminPassword) return false;
    if (isDemoMode) {
      setProducts(INITIAL_PRODUCTS);
      setSales([]);
      setCart([]);
      setAllTimeStats({ revenue: 0, salesCount: 0, totalProfit: 0 });
      localStorage.setItem('vendeei_demo_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('vendeei_demo_sales', JSON.stringify([]));
      addToast('Sistema reiniciado no Modo Demo!', 'success');
      return true;
    }
    if (!user) return false;
    try {
      await supabase.from('sale_items').delete().eq('user_id', user.id);
      await supabase.from('sales').delete().eq('user_id', user.id);
      await supabase.from('products').delete().eq('user_id', user.id);
      
      setProducts([]);
      setSales([]);
      setCart([]);
      setAllTimeStats({ revenue: 0, salesCount: 0, totalProfit: 0 });
      addToast('Sistema reiniciado no Supabase!', 'success');
      return true;
    } catch (err) {
      addToast('Erro ao reiniciar sistema', 'error');
      console.error(err);
      return false;
    }
  };

  return (
    <StoreContext.Provider value={{
      user, profile, products, sales, cart, allTimeStats, isDefaultPassword, loading, toasts,
      addToast, removeToast, addProduct, updateProduct, deleteProduct,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      completeSale, cancelSale, clearSalesHistory: async (pw) => { 
        if (!user) return false;
        if (pw === adminPassword) { 
          await supabase.from('sale_items').delete().eq('user_id', user.id);
          await supabase.from('sales').delete().eq('user_id', user.id);
          setSales([]); 
          setAllTimeStats(prev => ({ ...prev, revenue: 0, salesCount: 0, totalProfit: 0 }));
          return true; 
        } 
        return false; 
      },
      signOut, checkSubscription,
      updateSaleStatus,
      importData: async (data: any, password: string) => {
        if (password !== adminPassword) return false;
        if (!user) return false;
        try {
          setLoading(true);
          // 1. Limpar apenas dados do usuário autenticado!
          await supabase.from('sale_items').delete().eq('user_id', user.id);
          await supabase.from('sales').delete().eq('user_id', user.id);
          await supabase.from('products').delete().eq('user_id', user.id);

          // 2. Importar Produtos
          if (data.products && data.products.length > 0) {
            const productsToInsert = data.products.map((p: any) => ({
              id: p.id,
              user_id: user.id,
              name: p.name,
              category: p.category,
              price: p.price,
              cost_price: p.costPrice,
              stock: p.stock,
              description: p.description,
              image_url: p.imageUrl,
              barcode: p.barcode
            }));
            await supabase.from('products').insert(productsToInsert);
          }

          // 3. Importar Vendas
          if (data.sales && data.sales.length > 0) {
            for (const s of data.sales) {
              await supabase.from('sales').insert({
                id: s.id,
                user_id: user.id,
                subtotal: s.subtotal,
                total: s.total,
                discount: s.discount,
                surcharge: s.surcharge,
                profit: s.profit,
                customer_name: s.customerName,
                payment_method: s.paymentMethod,
                status: s.status,
                timestamp: new Date(s.timestamp).toISOString()
              });

              if (s.items && s.items.length > 0) {
                const itemsToInsert = s.items.map((item: any) => ({
                  sale_id: s.id,
                  user_id: user.id,
                  product_id: item.id,
                  name: item.name,
                  quantity: item.quantity,
                  price_at_sale: item.price,
                  cost_price_at_sale: item.costPrice
                }));
                await supabase.from('sale_items').insert(itemsToInsert);
              }
            }
          }

          addToast('Backup restaurado com sucesso!', 'success');
          window.location.reload(); // Recarregar para garantir sincronia total
          return true;
        } catch (err) {
          console.error(err);
          addToast('Erro ao restaurar backup', 'error');
          return false;
        } finally {
          setLoading(false);
        }
      },
      resetSystem, updateAdminPassword, exportSalesToCSV,
      isDemoMode, enterDemoMode
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
