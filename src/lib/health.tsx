import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Entry = { id: string; kind: string; entry_date: string; data: Record<string, any>; created_at: string };
export type ReminderSettings = { meals?: boolean; breakfast?: string; lunch?: string; dinner?: string; snacks?: string; water?: boolean; water_frequency?: number; measurements?: boolean; measurement_day?: number; insights?: boolean; units?: 'metric' | 'imperial'; dietary_preferences?: string[]; timezone?: string };
export type Profile = { name: string; age: number; gender: string; weight: number; height: number; activity: number; goal: string; target_weight: number; target_date?: string | null; calorie_goal: number; protein_goal: number; carbs_goal: number; fat_goal: number; water_goal: number; diet: string; onboarded: boolean; settings?: ReminderSettings };
export const defaults: Profile = { name: '', age: 28, gender: 'male', weight: 75, height: 175, activity: 1.55, goal: 'Weight loss', target_weight: 70, calorie_goal: 2000, protein_goal: 120, carbs_goal: 250, fat_goal: 60, water_goal: 2500, diet: 'Vegetarian', onboarded: false, settings: {} };
export const today = () => new Date().toLocaleDateString('en-CA');
type HealthContext = {
  session: Session | null; ready: boolean; profile: Profile; profileLoading: boolean; profileError: string | null;
  entries: Entry[]; loading: boolean;
  add: (kind: string, data: Record<string, any>, date?: string) => Promise<boolean>;
  remove: (id: string) => Promise<void>; saveProfile: (profile: Profile) => Promise<boolean>;
};
const Context = createContext<HealthContext | null>(null);
export function HealthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null); const [ready, setReady] = useState(false); const qc = useQueryClient();
  useEffect(() => {
    let active = true; let eventReceived = false;
    supabase.auth.getSession().then(({ data, error }) => { if (!active || eventReceived) return; if (error) toast.error(error.message); setSession(data.session); setReady(true); });
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      eventReceived = true; setSession(next); setReady(true);
      if (event === 'SIGNED_OUT') qc.clear();
      if (event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/auth/reset-password') window.location.replace(new URL('/auth/reset-password', window.location.origin).href);
    });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [qc]);
  const profileQuery = useQuery({ queryKey: ['profile', session?.user.id], enabled: !!session, queryFn: async () => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', session!.user.id).maybeSingle(); if (error) throw error;
    return (data || defaults) as Profile;
  } });
  const entriesQuery = useQuery({ queryKey: ['entries', session?.user.id], enabled: !!session, queryFn: async () => {
    const result: Entry[] = []; let offset = 0;
    while (true) {
      const { data, error } = await supabase.from('health_entries').select('*').eq('user_id', session!.user.id).order('created_at').order('id').range(offset, offset + 999);
      if (error) throw error; result.push(...(data as Entry[])); if (data.length < 1000) break; offset += 1000;
    }
    return result;
  } });
  useEffect(() => {
    if (!session) return;
    const channel = supabase.channel(`health-${session.user.id}`).on('postgres_changes', { event: '*', schema: 'public', table: 'health_entries', filter: `user_id=eq.${session.user.id}` }, () => qc.invalidateQueries({ queryKey: ['entries'] })).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [session?.user.id, qc]);
  useEffect(() => { if (entriesQuery.error) toast.error(entriesQuery.error.message); if (profileQuery.error) toast.error(profileQuery.error.message); }, [entriesQuery.error, profileQuery.error]);
  const add = async (kind: string, data: Record<string, any>, date = today()) => {
    if (!session) { toast.error('Sign in to save your health data.'); return false; }
    if (!navigator.onLine) { toast.error('Reconnect to save. Offline changes are not queued.'); return false; }
    const { error } = await supabase.from('health_entries').insert({ user_id: session.user.id, kind, data, entry_date: date });
    if (error) { toast.error(error.message); return false; } await qc.invalidateQueries({ queryKey: ['entries'] }); return true;
  };
  const remove = async (id: string) => { const { error } = await supabase.from('health_entries').delete().eq('id', id); if (error) toast.error(error.message); else await qc.invalidateQueries({ queryKey: ['entries'] }); };
  const saveProfile = async (profile: Profile) => {
    if (!session) return false;
    const { error } = await supabase.from('profiles').upsert({ ...profile, settings: { ...profile.settings, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }, id: session.user.id, calorie_goal: Math.round(profile.calorie_goal), protein_goal: Math.round(profile.protein_goal), carbs_goal: Math.round(profile.carbs_goal), fat_goal: Math.round(profile.fat_goal), water_goal: Math.round(profile.water_goal) });
    if (error) { toast.error(error.message); return false; } await qc.invalidateQueries({ queryKey: ['profile'] }); toast.success('Profile saved'); return true;
  };
  return <Context.Provider value={{ session, ready, profile: profileQuery.data || defaults, profileLoading: profileQuery.isLoading, profileError: profileQuery.error?.message || null, entries: entriesQuery.data || [], loading: entriesQuery.isLoading, add, remove, saveProfile }}>{children}</Context.Provider>;
}
export function useHealth() { const context = useContext(Context); if (!context) throw new Error('useHealth must be used within HealthProvider.'); return context; }
export function totals(entries: Entry[], date: string) {
  const day = entries.filter(e => e.entry_date === date); const foods = day.filter(e => e.kind === 'food');
  const sum = (key: string) => foods.reduce((s, e) => s + Number(e.data[key] || 0), 0);
  const burned = Number(day.filter(e => e.kind === 'exercise' && e.data.status !== 'planned').reduce((s, e) => s + Number(e.data.calories || 0), 0).toFixed(1));
  return { calories: sum('calories'), protein: sum('protein'), carbs: sum('carbs'), fat: sum('fat'), burned, water: day.filter(e => e.kind === 'water').reduce((s, e) => s + Number(e.data.ml || 0), 0) };
}
export function tdee(p: Profile) { return Math.round((10 * p.weight + 6.25 * p.height - 5 * p.age + (p.gender === 'female' ? -161 : p.gender === 'male' ? 5 : -78)) * p.activity); }
