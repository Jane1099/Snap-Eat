import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const reply = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed' }, 405);
  try {
    const token = req.headers.get('Authorization')?.replace(/^Bearer /, '');
    if (!token) return reply({ error: 'Sign in to delete your account.' }, 401);
    const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return reply({ error: 'Invalid session. Please sign in again.' }, 401);
    const body = await req.json();
    if (body.confirm !== 'DELETE') return reply({ error: 'Deletion must be explicitly confirmed.' }, 400);
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    console.info('[delete-account] Starting account cleanup', { userId: user.id });
    while (true) {
      const { data: files, error: listError } = await admin.storage.from('food-photos').list(user.id, { limit: 100 });
      if (listError) throw listError;
      if (!files?.length) break;
      const { error: removeError } = await admin.storage.from('food-photos').remove(files.map(file => `${user.id}/${file.name}`));
      if (removeError) throw removeError;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    console.info('[delete-account] Account deleted', { userId: user.id });
    return reply({ deleted: true });
  } catch (error) {
    console.error('[delete-account] Cleanup failed', { message: error instanceof Error ? error.message : 'Unknown error' });
    return reply({ error: 'Could not finish account deletion. Please retry; some photos may already have been removed.' }, 500);
  }
});
