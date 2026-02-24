const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Checking Supabase...');
    
    try {
        const { count: prodCount, error: prodError } = await supabase
            .from('products')
            .select('*', { count: 'exact', head: true });
        
        if (prodError) console.error('Products error:', prodError);
        else console.log('Products count:', prodCount);

        const { count: catCount, error: catError } = await supabase
            .from('categories')
            .select('*', { count: 'exact', head: true });
            
        if (catError) console.error('Categories error:', catError);
        else console.log('Categories count:', catCount);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

check();
