const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key length:', supabaseKey.length);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching sales:', error);
      return;
    }

    console.log('--- Ultimas 10 Vendas ---');
    sales.forEach(s => {
      console.log(`ID: ${s.id}, UserID: ${s.user_id}, Total: ${s.total}, Status: ${s.status}, Timestamp: ${s.timestamp}, Customer: ${s.customer_name}`);
      console.log('  Itens:', s.sale_items);
    });
  } catch (err) {
    console.error('Catch error:', err);
  }
}

check();
