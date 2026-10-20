import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const native = Capacitor.isNativePlatform();
export const supabase = createClient('https://khjmjnuawghmvdjmuurt.supabase.co', 'sb_publishable_37R7w6MVIOsepJq8id6Daw_zeLvic3Z', {
  auth: { flowType: native ? 'pkce' : 'implicit', detectSessionInUrl: !native },
});
