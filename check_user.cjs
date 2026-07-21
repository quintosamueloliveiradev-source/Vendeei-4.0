const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'quintosamueloliveiradev@gmail.com');

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('Profiles matching quintosamueloliveiradev@gmail.com:');
    console.log(profiles);
  } catch (err) {
    console.error(err);
  }
}

checkUser();
