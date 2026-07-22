import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(express.json());

// Instanciar cliente do Supabase para processamento seguro no backend
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseClient = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
}) : null;


// Rota de Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Proxy da API do Asaas Sandbox com tratamento refinado de erros
app.post('/api/asaas/create-pix', async (req, res) => {
  try {
    const { name, email, cpfCnpj, userId } = req.body;
    const apiKey = process.env.ASAAS_API_KEY;

    // Validação estrita para a chave de API do Asaas
    if (!apiKey || apiKey.trim() === '') {
      return res.status(500).json({
        success: false,
        error: 'Chave de API do Asaas (ASAAS_API_KEY) não encontrada pelo servidor. Por favor, adicione-a como variável de ambiente (.env).',
        message: 'Chave de API do Asaas (ASAAS_API_KEY) não encontrada pelo servidor. Por favor, adicione-a como variável de ambiente (.env).'
      });
    }

    if (!name || !email || !userId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parâmetros name, email e userId são obrigatórios.' 
      });
    }

    const cleanCpfCnpj = (cpfCnpj || '00000000000').replace(/\D/g, '');
    const headers = {
      'Content-Type': 'application/json',
      'access_token': apiKey
    };

    console.log(`Buscando se cliente com email ${email} ou CPF ${cleanCpfCnpj} já existe no Asaas...`);
    // 1. Verificar se o cliente já existe para evitar duplicidades
    const searchUrl = `https://sandbox.asaas.com/api/v3/customers?email=${encodeURIComponent(email)}`;
    const searchResponse = await fetch(searchUrl, { method: 'GET', headers });
    
    if (!searchResponse.ok) {
      const errText = await searchResponse.text();
      throw new Error(`Falha ao buscar cliente no Asaas (${searchResponse.status}): ${errText}`);
    }

    const searchData = await searchResponse.json();

    let customerId = '';
    if (searchData.data && searchData.data.length > 0) {
      customerId = searchData.data[0].id;
      console.log(`Cliente encontrado no Asaas. ID: ${customerId}`);
    } else {
      // Se não encontrar, cria um novo
      console.log(`Cliente não encontrado. Criando novo cliente no Asaas...`);
      const createCustResponse = await fetch('https://sandbox.asaas.com/api/v3/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name,
          email,
          cpfCnpj: cleanCpfCnpj,
          notificationDisabled: true
        })
      });
      
      if (!createCustResponse.ok) {
        const errMsg = await createCustResponse.text();
        console.error('Erro Asaas cadastrar cliente:', errMsg);
        throw new Error('Falha ao cadastrar cliente no Asaas: ' + errMsg);
      }
      
      const newCustData = await createCustResponse.json();
      customerId = newCustData.id;
      console.log(`Novo cliente cadastrado com sucesso. ID: ${customerId}`);
    }

    // Salva o ID do cliente Asaas no Supabase para uso futuro (como histórico de faturas)
    if (supabaseClient && customerId) {
      const { error: updateCustError } = await supabaseClient
        .from('profiles')
        .update({ asaas_customer_id: customerId })
        .eq('id', userId);
      if (updateCustError) {
        console.error('Erro ao salvar asaas_customer_id no perfil:', updateCustError);
      } else {
        console.log(`asaas_customer_id registrado com sucesso no Supabase para ${userId}`);
      }
    }

    // 2. Criar Cobrança para PIX
    console.log(`Criando cobrança PIX para o cliente ${customerId}...`);
    // Data de vencimento: amanhã
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = tomorrow.toISOString().split('T')[0];

    const paymentResponse = await fetch('https://sandbox.asaas.com/api/v3/payments', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        customer: customerId,
        billingType: 'PIX',
        value: 14.90,
        dueDate,
        description: 'Assinatura Vendeei Mensal - ' + email,
        externalReference: userId
      })
    });

    if (!paymentResponse.ok) {
      const errMsg = await paymentResponse.text();
      console.error('Erro Asaas cadastrar cobrança:', errMsg);
      throw new Error('Falha ao gerar cobrança no Asaas: ' + errMsg);
    }

    const paymentData = await paymentResponse.json();
    const paymentId = paymentData.id;
    console.log(`Cobrança criada com êxito. PaymentID: ${paymentId}`);

    // 3. Obter QR Code Pix e Copia e Cola Payload
    console.log(`Buscando QR Code Pix para o pagamento ${paymentId}...`);
    const qrCodeResponse = await fetch(`https://sandbox.asaas.com/api/v3/payments/${paymentId}/pixQrCode`, {
      method: 'GET',
      headers
    });

    if (!qrCodeResponse.ok) {
      const errMsg = await qrCodeResponse.text();
      console.error('Erro Asaas buscar código Pix:', errMsg);
      throw new Error('Falha ao obter QR Code do Asaas: ' + errMsg);
    }

    const qrCodeData = await qrCodeResponse.json();
    console.log('QR Code Pix e Payload gerados com sucesso!');

    return res.json({
      success: true,
      simulated: false,
      paymentId,
      encodedImage: qrCodeData.encodedImage, // Base64 da imagem
      payload: qrCodeData.payload // Copia e cola string
    });

  } catch (error: any) {
    console.error('Erro geral detectado no backend (create-pix):', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Erro desconhecido no servidor para o gateway Asaas.',
      message: error.message || 'Erro desconhecido no servidor para o gateway Asaas.' 
    });
  }
});

// Polling de pagamento com tratamento refinado de erros
app.get('/api/asaas/check-payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const apiKey = process.env.ASAAS_API_KEY;

    if (paymentId.startsWith('sim_pay_')) {
      return res.json({
        success: true,
        simulated: true,
        status: 'CONFIRMED'
      });
    }

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Chave do Asaas ausente no servidor.',
        message: 'Chave do Asaas ausente no servidor.' 
      });
    }

    const response = await fetch(`https://sandbox.asaas.com/api/v3/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'access_token': apiKey
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Impossível verificar pagamento na API do Asaas (${response.status}): ${errText}`);
    }

    const data = await response.json();
    return res.json({
      success: true,
      simulated: false,
      status: data.status,
      billingType: data.billingType
    });
  } catch (error: any) {
    console.error('Erro ao verificar pagamento:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      message: error.message 
    });
  }
});

// Listar histórico de pagamentos do cliente Asaas ou usuário ID do Supabase
app.get('/api/asaas/payments/:customerId', async (req, res) => {
  try {
    let { customerId } = req.params;
    const apiKey = process.env.ASAAS_API_KEY;

    if (!apiKey || apiKey.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Chave do Asaas ausente no servidor.',
        message: 'Chave do Asaas ausente no servidor.'
      });
    }

    if (!customerId || customerId === 'undefined' || customerId.trim() === '') {
      return res.json({ success: true, payments: [] });
    }

    const headers = {
      'Content-Type': 'application/json',
      'access_token': apiKey
    };

    // Se não for um ID do Asaas (que começa com cus_), vamos obter do Supabase ou buscar no Asaas
    if (!customerId.startsWith('cus_')) {
      let resolvedCustomerId = '';
      if (supabaseClient) {
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('asaas_customer_id, email')
          .eq('id', customerId)
          .maybeSingle();
        
        if (profile?.asaas_customer_id) {
          resolvedCustomerId = profile.asaas_customer_id;
        } else if (profile?.email) {
          // Busca no Asaas pelo e-mail
          const searchUrl = `https://sandbox.asaas.com/api/v3/customers?email=${encodeURIComponent(profile.email)}`;
          const searchResponse = await fetch(searchUrl, { method: 'GET', headers });
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.data && searchData.data.length > 0) {
              resolvedCustomerId = searchData.data[0].id;
              
              // Salva de volta no banco para agilizar próximas vezes
              await supabaseClient
                .from('profiles')
                .update({ asaas_customer_id: resolvedCustomerId })
                .eq('id', customerId);
            }
          }
        }
      }
      customerId = resolvedCustomerId;
    }

    if (!customerId) {
      return res.json({ success: true, payments: [] });
    }

    const response = await fetch(`https://sandbox.asaas.com/api/v3/payments?customer=${customerId}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Impossível listar pagamentos na API do Asaas (${response.status}): ${errText}`);
    }

    const data = await response.json();
    
    // Simplificar lista de cobranças para o frontend
    const payments = (data.data || []).map((p: any) => ({
      id: p.id,
      dateCreated: p.dateCreated,
      dueDate: p.dueDate,
      paymentDate: p.paymentDate,
      value: p.value,
      billingType: p.billingType,
      status: p.status, // CONFIRMED, RECEIVED, OVERDUE, PENDING, etc.
      invoiceUrl: p.invoiceUrl,
      bankSlipUrl: p.bankSlipUrl,
      transactionReceiptUrl: p.transactionReceiptUrl
    }));

    return res.json({
      success: true,
      payments
    });
  } catch (error: any) {
    console.error('Erro ao listar pagamentos do Asaas:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Novo Endpoint: Salvar pedidos de clientes do catálogo (Público) de forma segura burlar RLS
app.post('/api/catalog/order', async (req: express.Request, res: express.Response) => {
  try {
    const { storeId, cart, name, customerName, customerLastName, customerCpf, customerPhone, customerEmail, paymentMethod, pixSettings, randomCents } = req.body;

    if (!supabaseClient) {
      return res.status(500).json({
        success: false,
        message: 'Cliente Supabase não inicializado no servidor.'
      });
    }

    if (!storeId || !cart || cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros storeId e cart são obrigatórios.'
      });
    }

    // Calcular totais
    const total = cart.reduce((sum: number, p: any) => sum + (p.price * p.quantity), 0);
    let finalTotalWithCents = total;
    if (paymentMethod === 'pix') {
      const cents = Number(randomCents) || 0;
      if (pixSettings?.rule === 'pix_identified') {
        finalTotalWithCents = total + cents;
      } else if (pixSettings?.rule === 'pix_promotional') {
        finalTotalWithCents = Math.max(0, total - cents);
      }
    }
    // Formatar com 2 casas decimais
    finalTotalWithCents = Number(finalTotalWithCents.toFixed(2));

    const costTotal = cart.reduce((sum: number, item: any) => {
      const itemCost = Number(item.costPrice || item.cost_price) || 0;
      return sum + (itemCost * item.quantity);
    }, 0);

    const profitValue = Number((finalTotalWithCents - costTotal).toFixed(2));
    const profit = isNaN(profitValue) ? 0 : profitValue;

    // Define expiração (30 minutos a partir de agora)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const orderId = `${Date.now()}`;

    const constructedName = `${customerName || ''} ${customerLastName || ''}`.trim();
    const finalCustomerName = constructedName || name || 'Cliente do Catálogo';
    let saleCustomerName = finalCustomerName.toUpperCase();

    // 0. Salvar ou atualizar cliente na tabela 'customers' (Prevenção de Duplicidade)
    if (storeId) {
      try {
        const cleanDigits = (str?: string) => (str || '').replace(/\D/g, '');
        const cleanEmailStr = (customerEmail || '').trim().toLowerCase();
        const cleanPhoneStr = (customerPhone || '').trim();
        const cleanPhoneDigits = cleanDigits(customerPhone);
        const cleanCpfDigits = cleanDigits(customerCpf);

        // Buscar todos os clientes existentes do lojista
        const { data: existingStoreCustomers } = await supabaseClient
          .from('customers')
          .select('*')
          .eq('user_id', storeId);

        let existingCust: any = null;

        if (existingStoreCustomers && existingStoreCustomers.length > 0) {
          existingCust = existingStoreCustomers.find((c: any) => {
            const cPhoneDigits = cleanDigits(c.phone);
            const cCpfDigits = cleanDigits(c.cpf);
            const cEmailLower = (c.email || '').trim().toLowerCase();

            const matchPhone = cleanPhoneDigits.length >= 8 && cPhoneDigits.length >= 8 && cleanPhoneDigits === cPhoneDigits;
            const matchEmail = cleanEmailStr.length > 0 && cEmailLower.length > 0 && cleanEmailStr === cEmailLower;
            const matchCpf = cleanCpfDigits.length >= 11 && cCpfDigits.length >= 11 && cleanCpfDigits === cCpfDigits;

            return matchPhone || matchEmail || matchCpf;
          });
        }

        if (existingCust) {
          const norm = (str?: string) => (str || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const inputNorm = norm(finalCustomerName);
          const dbNameNorm = norm(existingCust.name);
          const dbFullNameNorm = norm(`${existingCust.name || ''} ${existingCust.last_name || ''}`);

          const isSameName = 
            inputNorm === dbNameNorm || 
            inputNorm === dbFullNameNorm ||
            (inputNorm.length > 2 && dbNameNorm.length > 2 && (inputNorm.includes(dbNameNorm) || dbNameNorm.includes(inputNorm)));

          if (!isSameName) {
            console.log(`[Catálogo] Bloqueado: e-mail/telefone/CPF já cadastrado para ${existingCust.name} mas fornecido para ${finalCustomerName}`);
            return res.status(400).json({
              message: `Este e-mail ou telefone já está cadastrado para outro cliente (${existingCust.name.toUpperCase()})!`
            });
          }

          saleCustomerName = (existingCust.name || finalCustomerName).toUpperCase();

          console.log(`[Catálogo] Cliente existente identificado (ID: ${existingCust.id}, Nome em banco: ${existingCust.name}). Atualizando dados de contato se fornecidos...`);
          await supabaseClient
            .from('customers')
            .update({
              phone: cleanPhoneStr || existingCust.phone || undefined,
              cpf: customerCpf || existingCust.cpf || undefined,
              email: customerEmail || existingCust.email || undefined,
            })
            .eq('id', existingCust.id);
        } else {
          console.log(`[Catálogo] Novo cliente identificado. Cadastrando na tabela customers...`);
          await supabaseClient
            .from('customers')
            .insert([{
              user_id: storeId,
              name: finalCustomerName.toUpperCase(),
              last_name: customerLastName || '',
              phone: cleanPhoneStr || '',
              cpf: customerCpf || '',
              email: customerEmail || '',
              total_spent: 0
            }]);
        }
      } catch (custErr) {
        console.error('Erro ao salvar/atualizar cliente na base customers:', custErr);
      }
    }

    // 1. Criar a venda no banco usando bypass do RLS (Service Role)
    const { data: saleData, error: saleError } = await supabaseClient
      .from('sales')
      .insert([{
        id: orderId,
        user_id: storeId,
        subtotal: total,
        total: finalTotalWithCents,
        discount: 0,
        surcharge: 0,
        profit,
        customer_name: saleCustomerName,
        payment_method: paymentMethod,
        payment_option_type: paymentMethod === 'pix' ? (pixSettings?.rule || 'valor_real') : null,
        status: paymentMethod === 'pix' ? 'awaiting_payment' : 'completed',
        timestamp: new Date().toISOString(),
        expires_at: expiresAt
      }])
      .select('id')
      .single();

    if (saleError) {
      console.error('Erro ao salvar venda no Supabase (Catalog API):', saleError);
      throw saleError;
    }

    // 2. Criar itens da venda
    const saleItems = cart.map((item: any) => ({
      user_id: storeId,
      sale_id: orderId,
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price_at_sale: item.price,
      cost_price_at_sale: item.costPrice || item.cost_price || 0
    }));

    const { error: itemsError } = await supabaseClient
      .from('sale_items')
      .insert(saleItems);

    if (itemsError) {
      console.error('Erro ao salvar itens da venda no Supabase (Catalog API):', itemsError);
      throw itemsError;
    }

    // 3. Baixar estoque
    for (const item of cart) {
      const { data: pData } = await supabaseClient.from('products').select('stock').eq('id', item.id).single();
      if (pData) {
        const newStock = Math.max(0, pData.stock - item.quantity);
        await supabaseClient.from('products').update({ stock: newStock }).eq('id', item.id);
      }
    }

    return res.json({
      success: true,
      orderId,
      expiresAt
    });

  } catch (error: any) {
    console.error('Erro ao criar pedido do catálogo no servidor:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao processar pedido no servidor.'
    });
  }
});

// Cancelar pedido e devolver estoque
app.post('/api/catalog/cancel-order', async (req: express.Request, res: express.Response) => {
  try {
    const { orderId, storeId } = req.body;

    if (!supabaseClient) {
      return res.status(500).json({
        success: false,
        message: 'Cliente Supabase não inicializado no servidor.'
      });
    }

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetro orderId é obrigatório.'
      });
    }

    console.log(`Iniciando cancelamento do pedido #${orderId} para restaurar estoque...`);

    // 1. Buscar os itens da venda para saber a quantidade e o produto para devolver ao estoque
    const { data: items, error: itemsError } = await supabaseClient
      .from('sale_items')
      .select('product_id, quantity')
      .eq('sale_id', orderId);

    if (itemsError) {
      console.error('Erro ao buscar itens da venda para cancelamento:', itemsError);
    } else if (items && items.length > 0) {
      // 2. Devolver estoque
      for (const item of items) {
        if (item.product_id) {
          const { data: pData } = await supabaseClient
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();
          if (pData) {
            const newStock = pData.stock + item.quantity;
            await supabaseClient
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.product_id);
            console.log(`Estoque do produto ${item.product_id} atualizado de ${pData.stock} para ${newStock}`);
          }
        }
      }
    }

    // 3. Deletar a venda (faria CASCADE delete em sale_items)
    const { error: deleteError } = await supabaseClient
      .from('sales')
      .delete()
      .eq('id', orderId);

    if (deleteError) {
      console.error('Erro ao deletar venda:', deleteError);
      throw deleteError;
    }

    return res.json({
      success: true,
      message: 'Pedido cancelado e estoque devolvido com sucesso.'
    });

  } catch (error: any) {
    console.error('Erro ao cancelar pedido no servidor:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao cancelar pedido no servidor.'
    });
  }
});

// Webhook
app.post('/api/asaas/webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Webhook do Asaas recebido:', JSON.stringify(event));

    if (event && (event.event === 'PAYMENT_CONFIRMED' || event.event === 'PAYMENT_RECEIVED')) {
      const paymentData = event.payment;
      if (!paymentData) {
        console.warn('paymentData ausente no corpo do webhook.');
        return res.status(400).json({ success: false, error: 'paymentData ausente.' });
      }

      const userId = paymentData.externalReference;
      if (userId) {
        console.log(`Reconciliando pagamento do usuário ${userId}. Atualizando no banco...`);
        if (supabaseClient) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + 30);
          const ISOExpiry = expiryDate.toISOString();

          const { data, error } = await supabaseClient
            .from('profiles')
            .update({ 
              subscription_status: 'active',
              subscription_expiry: ISOExpiry,
              expires_at: ISOExpiry
            })
            .eq('id', userId);

          if (error) {
            console.error(`Erro ao atualizar perfil do usuário ${userId} por webhook:`, error);
            throw error;
          }

          console.log(`Sucesso na ativação do usuário: ${userId}.`);
        } else {
          console.warn('supabaseClient não pôde ser inicializado no backend. Chaves do Supabase ausentes.');
        }
      } else {
        console.warn('externalReference (userId) não encontrado no evento de pagamento do Asaas.');
      }
    }
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default app;
