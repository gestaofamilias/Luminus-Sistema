
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jaokslrbtejdcwnzynni.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_sjvI7V3qomuUX4B4nIZZBw_B5lIWc3P';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
