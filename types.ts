
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  description: string;
  imageUrl?: string;
  barcode?: string;
}

export interface Customer {
  id: string;
  name: string;
  contact: string;
  cpf: string;
  createdAt: string;
  totalSpent: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id: string;
  timestamp: number;
  total: number;
  subtotal: number; 
  discount: number; 
  surcharge: number; // Valor da taxa/acréscimo em R$
  profit: number;   
  customerName?: string; 
  items: CartItem[];
  paymentMethod: 'credit' | 'debit' | 'cash' | 'pix';
  paymentOptionType?: 'pix_identified' | 'pix_promotional' | 'valor_real';
  status?: 'completed' | 'canceled' | 'pending' | 'awaiting_payment';
  expiresAt?: string;
}

export type ViewState = 'dashboard' | 'pos' | 'inventory' | 'history' | 'customers' | 'settings' | 'admin' | 'subscription' | 'catalog';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'customer';
  subscription_status: 'active' | 'inactive' | 'trial' | 'canceled' | 'expired';
  subscription_expiry: string | null;
  store_name?: string;
  last_seen_at?: string;
  last_sale_at?: string;
  created_at: string;
  // Atributos de controle de monetização adicionados
  subscriptionStatus?: 'trial' | 'active' | 'canceled' | 'expired';
  trialEndDate?: string;
  stripeCustomerId?: string;
  asaasCustomerId?: string;
}
