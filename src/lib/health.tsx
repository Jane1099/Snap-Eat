import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Entry = { id: string; kind: string; entry_date: string; data: Record<string, any>; created_at: string };
export type Profile = { name: string; age: number; gender: string; weight: number; height: number; activity: number; goal: string; target_weight: number; calorie_goal: number; protein_goal: number; carbs_goal: number; fat_goal: number; water_goal: number; diet: string; onboarded: boolean };
export const defaults: Profile = { name: '', age: 28, gender: 'male', weight: 75, height: 175, activity: 1.55, goal: 'Weight loss', target_weight: 70, calorie_goal: 2000, protein_goal: 120, carbs_goal: 250, fat_goal: 60, water_goal: 2500, diet: 'Vegetarian', onboarded: false };
export const today = () => new Date().toLocaleDateString('en-CA');
const Context = createContext<any>(null);
export function HealthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => { if (error) toast.error(error.message); setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, next) => { setSession(next); setReady(true); if (event === 'SIGNED_OUT') qc.clear(); if (event === 'PASSWORD_RECOVERY') window.location.assign('/auth/reset-password'); });
    return () => data.subscription.unsubscribe();
  }, [qc]);
  const profileQuery = useQuery({ queryKey: ['profile', session?.user.id], enabled: !!session, queryFn: async () => { const { data, error } = await supabase.from('profiles').select('*').eq('id', session!.user.id).maybeSingle(); if (error) throw error; return (data || defaults) as Profile; } });
  const entriesQuery = useQuery({ queryKey: ['entries', session?.user.id], enabled: !!session, queryFn: async () => { const { data, error } = await supabase.from('health_entries').select('*').order('created_at', { ascending: true }); if (error) throw error; return data as Entry[]; } });
  useEffect(() => { if (!session) return; const channel = supabase.channel(`health-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'health_entries', filter: `user_id=eq.${session.user.id}` }, () => qc.invalidateQueries({ queryKey: ['entries'] })).subscribe(); return () => { supabase.removeChannel(channel); }; }, [session?.user.id, qc]);
  useEffect(() => { if (entriesQuery.error) toast.error(entriesQuery.error.message); if (profileQuery.error) toast.error(profileQuery.error.message); }, [entriesQuery.error, profileQuery.error]);
  const add = async (kind: string, data: Record<string, any>, date = today()) => { if (!session) { toast.error('Sign in to save your health data.'); return false; } const { error } = await supabase.from('health_entries').insert({ user_id: session.user.id, kind, data, entry_date: date }); if (error) { toast.error(error.message); return false; } await qc.invalidateQueries({ queryKey: ['entries'] }); return true; };
  const remove = async (id: string) => { const { error } = await supabase.from('health_entries').delete().eq('id', id); if (error) toast.error(error.message); else await qc.invalidateQueries({ queryKey: ['entries'] }); };
  const saveProfile = async (profile: Profile) => { if (!session) return false; const { error } = await supabase.from('profiles').upsert({ ...profile, id: session.user.id }); if (error) { toast.error(error.message); return false; } await qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile saved'); return true; };
  return <Context.Provider value={{ session, ready, profile: profileQuery.data || defaults, profileLoading: profileQuery.isLoading, entries: entriesQuery.data || [], loading: entriesQuery.isLoading, add, remove, saveProfile }}>{children}</Context.Provider>;
}
export const useHealth = () => useContext(Context) as { session: Session | null; ready: boolean; profile: Profile; profileLoading: boolean; entries: Entry[]; loading: boolean; add: (kind: string, data: Record<string, any>, date?: string) => Promise<boolean>; remove: (id: string) => Promise<void>; saveProfile: (p: Profile) => Promise<boolean> };
export function totals(entries: Entry[], date: string) { const day = entries.filter(e => e.entry_date === date); const foods = day.filter(e => e.kind === 'food'); const sum = (key: string) => foods.reduce((s,e) => s + Number(e.data[key] || 0), 0); return { calories: sum('calories'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat'), burned: day.filter(e=>e.kind==='exercise').reduce((s,e)=>s+Number(e.data.calories || 0),0), water: day.filter(e=>e.kind==='water').reduce((s,e)=>s+Number(e.data.ml || 0),0) }; }
export function tdee(p: Profile) { return Math.round((10 * p.weight + 6.25 * p.height - 5 * p.age + (p.gender === 'female' ? -161 : 5)) * p.activity); }
