import { supabase } from '@/integrations/supabase/client';
export async function invokeAccountDeletion() {
  const { data, error } = await supabase.functions.invoke('delete-account', { body: { confirm: 'DELETE' } });
  if (error) {
    let message = error.message;
    if (error.context instanceof Response) { try { message = (await error.context.json()).error || message; } catch {} }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
}
