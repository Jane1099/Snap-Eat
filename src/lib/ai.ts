import { supabase } from '@/integrations/supabase/client';
export async function askAI(body: Record<string, unknown>) {
 const { data, error } = await supabase.functions.invoke('mind-eat-ai', { body });
 if(error) { let message=error.message; if(error.context instanceof Response) { try { const result=await error.context.json(); message=result.error || message; } catch {} } throw new Error(message); }
 if(data?.error)throw new Error(data.error); return data;
}
export async function uploadFoodPhoto(file: File, userId: string) {
 const path = `${userId}/${crypto.randomUUID()}.jpg`;
 const { error } = await supabase.storage.from('food-photos').upload(path, file, { contentType: 'image/jpeg' });
 if (error) throw error;
 return path;
}
