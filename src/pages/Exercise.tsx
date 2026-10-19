import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Flame, Dumbbell, CalendarDays, Plus, Save, Loader2, X, Clock, Layers } from 'lucide-react';
import { useHealth, today, totals, Entry } from '@/lib/health';
import { supabase } from '@/integrations/supabase/client';
import { makeWorkoutItem, cloneWorkout, entryWorkout, workoutData, workoutSchema, WorkoutItem } from '@/lib/workouts';
import { useWorkoutTemplates } from '@/lib/useWorkoutTemplates';
import ExerciseSearch from '@/components/workouts/ExerciseSearch';
import WorkoutItemsEditor from '@/components/workouts/WorkoutItemsEditor';
import WorkoutImport from '@/components/workouts/WorkoutImport';
import WorkoutTemplates, { weekDays } from '@/components/workouts/WorkoutTemplates';
import WorkoutHistory from '@/components/workouts/WorkoutHistory';
import { toast } from 'sonner';

export default function Exercise() {
  const { entries, profile, session, add, remove } = useHealth(); const qc = useQueryClient(); const templates = useWorkoutTemplates();
  const [date, setDate] = useState(today()); const [name, setName] = useState('My workout'); const [items, setItems] = useState<WorkoutItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [planOnly, setPlanOnly] = useState(false);
  const [tab, setTab] = useState<'build' | 'history' | 'templates'>('build');
  const summary = workoutData(items, profile.weight, name, planOnly || date > today());
  const valid = workoutSchema.safeParse(items).success;
  const logged = entries.filter(entry => entry.kind === 'exercise' && entry.entry_date === date && entry.data.status !== 'planned');
  const append = (next: WorkoutItem[], routineName: string) => {
    if (items.length + next.length > 60) { toast.error('A session supports up to 60 movements. Save this session before adding another routine.'); return; }
    setItems([...items, ...cloneWorkout(next)]); if (!items.length) setName(routineName); setTab('build');
  };
  const clear = () => { setItems([]); setName('My workout'); setEditingId(null); setPlanOnly(false); };
  const edit = (entry: Entry) => {
    setItems(entryWorkout(entry.data)); setName(entry.data.name); setDate(entry.entry_date); setEditingId(entry.id);
    setPlanOnly(entry.entry_date > today()); setTab('build');
    toast.info(entry.data.status === 'planned' ? 'Review actual exercises and loads, then save as completed. Future dates remain planned.' : 'Editing this session. Changes are applied when you save.');
  };
  const save = async () => {
    if (!session || !valid || !name.trim() || name.trim().length > 120) { toast.error('Check session name, sets, reps and duration.'); return; }
    setBusy(true);
    try {
      const data = workoutData(items, profile.weight, name.trim(), planOnly || date > today());
      if (editingId) {
        const old = entries.find(entry => entry.id === editingId);
        const { error } = await supabase.from('health_entries').update({ data: { ...data, ...(old?.data.template_id ? { template_id: old.data.template_id } : {}) }, entry_date: date }).eq('id', editingId).eq('user_id', session.user.id).eq('kind', 'exercise').select('id').single();
        if (error) throw error; await qc.invalidateQueries({ queryKey: ['entries'] });
      } else if (!await add('exercise', data, date)) return;
      toast.success(data.status === 'planned' ? 'Workout planned. Calories count only after completion.' : 'Workout saved. Dashboard burn totals updated.'); clear(); setTab('history');
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); }
  };
  const planWeek = async () => {
    if (!session) return;
    const monday = new Date(date + 'T12:00:00'); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
    const rows: { user_id: string; kind: string; entry_date: string; data: Record<string, any> }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday); day.setDate(day.getDate() + i); const key = day.toLocaleDateString('en-CA');
      for (const template of templates.templates.filter(template => template.weekdays.includes(day.getDay()))) {
        if (entries.some(entry => entry.kind === 'exercise' && entry.entry_date === key && entry.data.template_id === template.id)) continue;
        if (!workoutSchema.safeParse(template.items).success) throw new Error(`Check the ${template.name} template before planning.`);
        rows.push({ user_id: session.user.id, kind: 'exercise', entry_date: key, data: { ...workoutData(cloneWorkout(template.items), profile.weight, template.name, true), template_id: template.id } });
      }
    }
    if (!rows.length) { toast.info('No new assigned sessions to add to this week.'); return; }
    const { error } = await supabase.from('health_entries').insert(rows); if (error) throw error;
    await qc.invalidateQueries({ queryKey: ['entries'] }); toast.success(`${rows.length} sessions planned for the selected week`);
  };
  const selectedDay = new Date(date + 'T12:00:00');
  const monday = new Date(selectedDay); monday.setDate(monday.getDate() - (monday.getDay() + 6) % 7);
  return <div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4"><div><p className="eyebrow text-amber-400">BUILD STRENGTH. FIND YOUR RHYTHM.</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Your training, item by item.</h1><p className="mt-2 text-sm text-muted-foreground">From a morning jog to your next leg day.</p></div><label className="flex items-center gap-2 rounded-xl border border-border bg-card p-3 text-xs"><CalendarDays size={16} className="text-primary" /><input aria-label="Workout date" type="date" className="bg-transparent outline-none" disabled={busy} value={date} onChange={e => setDate(e.target.value || today())} /></label></div>
    <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-4">{[{ icon: Flame, label: 'Logged burn', value: `${Math.round(totals(entries, date).burned)} kcal`, color: 'text-amber-400' }, { icon: Layers, label: 'Completed sessions', value: String(logged.length), color: 'text-primary' }, { icon: Dumbbell, label: 'Draft movements', value: String(items.length), color: 'text-indigo-400' }].map(metric => <div key={metric.label} className="panel p-3 sm:p-5"><metric.icon size={20} className={metric.color} /><p className="mt-3 text-[10px] text-muted-foreground">{metric.label}</p><p className="mt-1 text-base font-semibold sm:text-2xl">{metric.value}</p></div>)}</div>
    <div className="mb-5 grid grid-cols-7 gap-1 rounded-2xl border border-border bg-card p-2">{weekDays.map((day, i) => {
      const d = new Date(monday); d.setDate(d.getDate() + i); const key = d.toLocaleDateString('en-CA'); const sessions = entries.filter(entry => entry.kind === 'exercise' && entry.entry_date === key);
      return <button type="button" key={day.n} disabled={busy} className={`rounded-xl py-3 text-center ${key === date ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'}`} onClick={() => setDate(key)}><span className="block text-[10px]">{day.label}</span><span className="mt-1 block text-sm font-semibold">{d.getDate()}</span><span className={`mx-auto mt-2 block h-1 w-4 rounded-full ${sessions.some(entry => entry.data.status !== 'planned') ? 'bg-amber-400' : sessions.length ? 'bg-primary' : 'bg-border'}`} /></button>;
    })}</div>
    <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-border bg-card p-1">{[{ key: 'build', label: 'Build session' }, { key: 'history', label: 'History & copy' }, { key: 'templates', label: 'Weekly splits' }].map(option => <button key={option.key} type="button" disabled={busy} className={`rounded-lg py-3 text-xs ${tab === option.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`} onClick={() => setTab(option.key as typeof tab)}>{option.label}</button>)}</div>
    {tab === 'build' && <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-4"><div className="panel p-4"><div className="mb-2 flex items-center justify-between gap-3"><label htmlFor="session-name" className="text-xs text-muted-foreground">{editingId ? 'Editing saved session' : 'Session name'}</label><button type="button" disabled={busy || !items.length} className="flex items-center gap-1 text-xs text-muted-foreground" onClick={clear}><X size={13} />{editingId ? 'Cancel edit' : 'Clear draft'}</button></div><input id="session-name" disabled={busy} className="field" maxLength={120} value={name} onChange={e => setName(e.target.value)} /></div><WorkoutItemsEditor items={items} onChange={setItems} bodyWeight={profile.weight} disabled={busy} />
      <section aria-live="polite" className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-5"><div className="flex items-center justify-between gap-3"><div><p className="eyebrow">CUMULATIVE SESSION ESTIMATE</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock size={12} />{summary.duration} min · {items.length} movements</p></div><p className="text-3xl font-semibold text-amber-400">{summary.estimated_calories}<span className="ml-1 text-xs">kcal</span></p></div><p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">Based on your {profile.weight} kg profile weight and approximate MET values. Strength time assumes 3 seconds per rep plus entered rests; load adds a bounded intensity proxy. Cardio distance adjusts speed-based estimates where applicable. These are not measured calories.</p>{items.length > 0 && !valid && <p className="mt-3 text-xs text-red-400">Each strength movement needs at least one set, whole-number reps and valid loads. Other activities need a duration above zero.</p>}<label className="mt-4 flex items-center gap-2 text-xs"><input type="checkbox" className="accent-[hsl(var(--primary))]" disabled={busy || date > today()} checked={planOnly || date > today()} onChange={e => setPlanOnly(e.target.checked)} />Plan only — don’t count calories yet</label><button type="button" className="action mt-4 w-full" disabled={busy || !valid || !name.trim()} onClick={save}>{busy ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}{planOnly || date > today() ? 'Save planned session' : editingId ? 'Save completed session' : 'Log workout session'}</button></section></div>
      <div className="space-y-4"><ExerciseSearch disabled={busy || items.length >= 60} onAdd={exercise => setItems([...items, makeWorkoutItem(exercise)])} /><WorkoutImport disabled={busy} onBusyChange={setBusy} onImport={append} onSave={(routineName, routineItems) => templates.save(routineName, routineItems)} /><button type="button" className="quiet w-full" disabled={busy} onClick={() => setTab('history')}><Plus size={14} />Copy from a previous workout</button></div></div>}
    {tab === 'history' && <WorkoutHistory date={date} entries={entries} disabled={busy} onCopy={append} onEdit={edit} onRemove={remove} />}
    {tab === 'templates' && <div className="mx-auto max-w-2xl"><WorkoutTemplates items={items} disabled={busy} onLoad={append} onPlan={planWeek} /></div>}
    {tab !== 'build' && items.length > 0 && <button type="button" className="action mt-5 w-full" onClick={() => setTab('build')}><Dumbbell size={16} />Return to draft · {items.length} movements · {summary.estimated_calories} kcal estimated</button>}
  </div>;
}
