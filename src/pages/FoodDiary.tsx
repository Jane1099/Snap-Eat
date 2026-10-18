import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2, ChevronLeft, ChevronRight, Utensils, Dumbbell, Droplets, Copy, Pencil } from 'lucide-react';
import { useHealth, today, totals, Entry } from '@/lib/health';
import LoggedMealEditor from '@/components/LoggedMealEditor';
import { toast } from 'sonner';

export default function FoodDiary() {
  const { entries, profile, add, remove } = useHealth();
  const [date, setDate] = useState(today());
  const [edit, setEdit] = useState<Entry | null>(null);
  const [busy, setBusy] = useState(false);
  const t = totals(entries, date);
  const day = entries.filter(e => e.entry_date === date);
  const move = (n: number) => { const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() + n); setDate(d.toLocaleDateString('en-CA')); };
  const copy = async () => {
    setBusy(true);
    const d = new Date(date + 'T12:00:00'); d.setDate(d.getDate() - 1);
    const previous = entries.filter(e => e.kind === 'food' && e.entry_date === d.toLocaleDateString('en-CA'));
    if (!previous.length) toast.info('No food entries on the previous day.');
    else { let saved = 0; for (const entry of previous) if (await add('food', entry.data, date)) saved++; toast.success(`${saved} meals copied`); }
    setBusy(false);
  };
  return <div className="mx-auto max-w-4xl">
    <div className="mb-7 flex flex-wrap justify-between gap-4"><div><p className="eyebrow text-primary">A LITTLE MORE AWARE, EVERY DAY</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Your food diary</h1><p className="mt-2 text-sm text-muted-foreground">Good habits begin with noticing.</p></div><div className="flex h-fit items-center gap-3 rounded-xl border border-border bg-card p-3"><button aria-label="Previous day" onClick={() => move(-1)}><ChevronLeft size={17} /></button><input aria-label="Diary date" className="bg-transparent text-xs outline-none" type="date" value={date} max={today()} onChange={e => setDate(e.target.value)} /><button disabled={date >= today()} className="disabled:opacity-30" aria-label="Next day" onClick={() => move(1)}><ChevronRight size={17} /></button></div></div>
    <section className="panel mb-6 p-6"><div className="grid grid-cols-2 gap-5 sm:grid-cols-4">{[{ label: 'Consumed', value: t.calories }, { label: 'Burned', value: t.burned }, { label: 'Net calories', value: t.calories - t.burned }, { label: 'Remaining', value: profile.calorie_goal - t.calories + t.burned }].map(m => <div key={m.label}><p className="eyebrow">{m.label}</p><p className="mt-2 text-2xl font-semibold">{Math.round(m.value)}<span className="ml-1 text-[10px] font-normal text-muted-foreground">kcal</span></p></div>)}</div><div className="mt-6 flex flex-wrap gap-5 border-t border-border pt-4 text-xs text-muted-foreground"><span><b className="text-primary">Protein</b> {Math.round(t.protein)}g</span><span><b className="text-amber-400">Carbs</b> {Math.round(t.carbs)}g</span><span><b className="text-indigo-400">Fat</b> {Math.round(t.fat)}g</span></div></section>
    <div className="space-y-4">{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(meal => {
      const list = day.filter(e => e.kind === 'food' && e.data.meal === meal);
      return <section key={meal} className="panel overflow-hidden"><details open><summary className="cursor-pointer bg-secondary/20 p-4 text-sm font-semibold"><Utensils size={17} className="mr-2 inline text-primary" />{meal}<span className="float-right text-xs font-normal text-muted-foreground">{Math.round(list.reduce((sum, e) => sum + Number(e.data.calories), 0))} kcal</span></summary>
        {list.map(e => <div key={e.id} className="flex items-center gap-3 border-t border-border p-4"><button className="min-w-0 flex-1 text-left" onClick={() => { setEdit(e); }}><p className="text-sm font-medium">{e.data.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{e.data.serving} · P {Math.round(e.data.protein)}g · C {Math.round(e.data.carbs)}g · F {Math.round(e.data.fat)}g</p></button><span className="text-sm">{Math.round(e.data.calories)} <span className="text-[10px] text-muted-foreground">kcal</span></span><button aria-label="Edit meal items" className="p-1 text-muted-foreground" onClick={() => { setEdit(e); }}><Pencil size={14} /></button><button aria-label="Delete food" className="p-1 text-muted-foreground hover:text-red-400" onClick={() => remove(e.id)}><Trash2 size={15} /></button></div>)}
        <Link className="flex items-center justify-center gap-1.5 border-t border-border py-3 text-xs text-primary" to={`/log-food?meal=${meal}&date=${date}`}><Plus size={14} />Add food</Link></details></section>;
    })}</div>
    <div className="mt-5 grid gap-4 sm:grid-cols-2"><section className="panel p-5"><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><Dumbbell size={18} className="text-amber-400" />Exercise · {t.burned} kcal burned</h2>{day.filter(e => e.kind === 'exercise').map(e => <p key={e.id} className="mb-2 text-xs text-muted-foreground">{e.data.name} · {e.data.duration} min</p>)}<Link className="text-xs text-primary" to="/exercise">+ Log exercise</Link></section><section className="panel p-5"><h2 className="flex items-center gap-2 text-sm font-semibold"><Droplets size={18} className="text-sky-400" />Water · {t.water} ml</h2><div className="mt-3 space-y-2">{day.filter(e => e.kind === 'water').map(e => <div key={e.id} className="flex justify-between text-xs text-muted-foreground"><span>{e.data.ml} ml</span><button aria-label="Delete water log" onClick={() => remove(e.id)}><Trash2 size={13} /></button></div>)}</div><button className="mt-3 text-xs text-sky-400" onClick={() => add('water', { ml: 250 }, date)}>+ 250 ml</button></section></div>
    {!day.some(e => e.kind === 'food') && <button className="quiet mt-5" disabled={busy} onClick={copy}><Copy size={15} />Copy yesterday’s meals</button>}
    {edit && <LoggedMealEditor key={edit.id} entry={edit} onClose={() => setEdit(null)} />}
  </div>;
}
