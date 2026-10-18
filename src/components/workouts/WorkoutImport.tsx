import { useState } from 'react';
import { Upload, FileText, Sparkles, Loader2, Plus, Save } from 'lucide-react';
import { askWorkoutAI } from '@/lib/workoutAI';
import { preprocessMealPhoto } from '@/lib/mealPhoto';
import { ImportedRoutine, WorkoutItem } from '@/lib/workouts';
import { toast } from 'sonner';
export default function WorkoutImport({ onImport, onSave, disabled, onBusyChange }: { onImport: (items: WorkoutItem[], name: string) => void; onSave: (name: string, items: WorkoutItem[]) => Promise<void>; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [routines, setRoutines] = useState<ImportedRoutine[]>([]);
  const parse = async (file?: File) => {
    setBusy(true); onBusyChange(true); setRoutines([]);
    try {
      const result = await askWorkoutAI(file ? { task: 'image', image: (await preprocessMealPhoto(file)).dataUrl } : { task: 'text', text });
      setRoutines(result);
      if (result.length === 1) { onImport(result[0].items, result[0].name); toast.success('Exercises added to your draft. Review sets, loads and defaults.'); }
      else toast.success('Split detected. Choose the routine you want to load.');
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); onBusyChange(false); }
  };
  const saveAll = async () => {
    setBusy(true); onBusyChange(true);
    let saved = 0;
    try { for (const routine of routines) { await onSave(routine.name, routine.items); saved++; } toast.success(`${saved} routines saved as templates`); setRoutines([]); }
    catch (error) { setRoutines(routines.slice(saved)); toast.error(`${saved} templates saved. ${(error as Error).message}`); }
    finally { setBusy(false); onBusyChange(false); }
  };
  return <section className="panel p-4 sm:p-5"><h2 className="flex items-center gap-2 font-semibold"><Sparkles size={17} className="text-primary" />Bring your routine with you</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Paste a workout or upload a Push/Pull/Legs screenshot. Gemini extracts separate movements and days; nothing is logged until you save.</p><textarea aria-label="Workout text to parse" disabled={disabled || busy} className="field mt-4 min-h-24" maxLength={10000} placeholder="Barbell press 3x12, chest press 3x8, jogging 20 min…" value={text} onChange={e => setText(e.target.value)} /><div className="mt-3 flex flex-wrap gap-2"><button type="button" className="action" disabled={disabled || busy || text.trim().length < 3} onClick={() => parse()}>{busy ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}Parse text</button><label className={`quiet ${disabled || busy ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}><Upload size={15} />Upload routine<input aria-label="Upload workout routine image" disabled={disabled || busy} type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) parse(file); e.target.value = ''; }} /></label></div>{busy && <p role="status" className="mt-3 text-xs text-primary">Processing your routine…</p>}<p className="mt-3 text-[10px] text-muted-foreground">Images are sent for analysis, not stored. Missing loads default to 0 kg; unspecified sets, reps or time need your review.</p>
    {routines.length > 0 && <div className="mt-4 space-y-2">{routines.map((routine, i) => <div key={`${routine.name}-${i}`} className="rounded-xl border border-primary/20 bg-primary/5 p-3"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-semibold">{routine.name}</p><p className="mt-1 text-xs text-muted-foreground">{routine.items.length} exercises · {routine.items.map(item => item.name).join(', ')}</p></div><button type="button" className="quiet shrink-0" disabled={busy || disabled} onClick={() => onImport(routine.items, routine.name)}><Plus size={14} />Load</button></div></div>)}<button type="button" className="quiet w-full" disabled={busy || disabled} onClick={saveAll}><Save size={14} />Save detected routines as templates</button></div>}
  </section>;
}
