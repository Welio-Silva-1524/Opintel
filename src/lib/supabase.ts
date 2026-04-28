import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;

const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  const url = (import.meta as any).env.VITE_SUPABASE_URL;
  const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the application settings (Environment Variables).'
    );
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

export const supabase = new Proxy({} as any, {
  get(_, prop) {
    const client = getSupabase();
    return client[prop];
  }
});
