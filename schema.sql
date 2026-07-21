-- ==========================================
-- RESET TOTAL E CORREÇÃO DEFINITIVA
-- ==========================================
-- 1. Limpeza Total
DROP TABLE IF EXISTS sale_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;

-- 2. Tabela de Perfis (Essencial para o SaaS)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT, -- <--- Adicionado
  role TEXT NOT NULL DEFAULT 'customer',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  subscription_expiry TIMESTAMPTZ,
  store_name TEXT DEFAULT 'Minha Loja',
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_sale_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, store_name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'store_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. Tabela de Produtos
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Vendas
CREATE TABLE sales (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  surcharge DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  customer_name TEXT,
  payment_method TEXT NOT NULL,
  payment_option_type TEXT,
  status TEXT DEFAULT 'completed',
  expires_at TIMESTAMPTZ
);

-- ==========================================
-- LÓGICA DE CANCELAMENTO AUTOMÁTICO (CRON)
-- ==========================================

-- 1. Função que cancela pedidos expirados e devolve o estoque
CREATE OR REPLACE FUNCTION public.cancel_expired_pix_sales()
RETURNS void AS $$
DECLARE
    sale_record RECORD;
    item_record RECORD;
BEGIN
    -- Loop por vendas 'awaiting_payment' que já expiraram
    FOR sale_record IN 
        SELECT id, user_id FROM public.sales 
        WHERE status = 'awaiting_payment' 
        AND expires_at < NOW()
    LOOP
        -- 1. Devolve o estoque para cada item da venda
        FOR item_record IN 
            SELECT product_id, quantity FROM public.sale_items 
            WHERE sale_id = sale_record.id
        LOOP
            UPDATE public.products 
            SET stock = stock + item_record.quantity 
            WHERE id = item_record.product_id;
        END LOOP;

        -- 2. Altera o status da venda para 'canceled'
        UPDATE public.sales 
        SET status = 'canceled' 
        WHERE id = sale_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Agendamento do Cron Job (Requer extensão pg_cron ativada no Supabase)
-- SELECT cron.schedule('*/10 * * * *', 'SELECT cancel_expired_pix_sales()');

-- 5. Itens da Venda
CREATE TABLE sale_items (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sale_id TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id TEXT,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  price_at_sale DECIMAL(10,2) NOT NULL,
  cost_price_at_sale DECIMAL(10,2) NOT NULL
);

-- 6. Configurações
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

INSERT INTO app_settings (key, value) VALUES 
('admin_password', '"admin"'::jsonb),
('subscription_price', '14.90'::jsonb),
('global_announcement', '""'::jsonb);

-- ==========================================
-- POLÍTICAS DE SEGURANÇA (RLS) - SEM RECURSÃO
-- ==========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- Regras para PROFILES (Evita o loop infinito)
-- Inserção: Permitir que o usuário crie seu próprio perfil
CREATE POLICY "profiles_insert_self" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Seleção e Update: Apenas o dono ou o Admin Mestre (via JWT para não consultar a tabela)
CREATE POLICY "profiles_owner_all" ON profiles FOR ALL USING (
  auth.uid() = id OR 
  auth.jwt() ->> 'email' = 'backup02atelietetemimos@gmail.com'
);

-- Regras para Outras Tabelas (Sempre filtradas por user_id)
CREATE POLICY "products_owner_all" ON products FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sales_owner_all" ON sales FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sale_items_owner_all" ON sale_items FOR ALL USING (auth.uid() = user_id);

-- Ativar Realtime
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE products, sales;
COMMIT;

-- 7. Garantir seu acesso de Admin IMEDIATAMENTE e limpar outros
UPDATE profiles SET role = 'customer' WHERE email != 'backup02atelietetemimos@gmail.com';
UPDATE profiles SET role = 'admin', subscription_status = 'active' WHERE email = 'backup02atelietetemimos@gmail.com';

-- 8. Tabela de Lojas (Stores)
CREATE TABLE IF NOT EXISTS stores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name TEXT NOT NULL,
  whatsapp TEXT DEFAULT '',
  is_open BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores_owner_all" ON stores FOR ALL USING (auth.uid() = user_id);
