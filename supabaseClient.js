require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey && supabaseUrl.trim() !== '' && supabaseKey.trim() !== '') {
  try {
    supabase = createClient(supabaseUrl.trim(), supabaseKey.trim());
    console.log('⚡ [Supabase] Connected to remote Supabase instance:', supabaseUrl);
  } catch (err) {
    console.error('❌ [Supabase] Initialization error:', err.message);
  }
} else {
  console.log('ℹ️  [Database] Supabase credentials not found in .env. Running with local persistent data engine.');
  console.log('👉 To connect to Supabase: Add SUPABASE_URL and SUPABASE_KEY into .env and run supabase_schema.sql in Supabase SQL Editor.');
}

module.exports = supabase;
