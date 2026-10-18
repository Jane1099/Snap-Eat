import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, Plus, Loader2 } from 'lucide-react';
import { exerciseCatalog, findExercises, ExerciseDefinition } from '@/lib/exercises';
import { askWorkoutAI } from '@/lib/workoutAI';
import { useHealth } from '@/lib/health';

export default function ExerciseSearch({ onAdd, disabled }: { onAdd: (exercise: ExerciseDefinition) => void; disabled: boolean }) {
  const [search, setSearch] = useState(''); const [category, setCategory] = useState('All'); const [debounced, setDebounced] = useState('');
  const { entries } = useHealth();
  useEffect(() => { const timer = setTimeout(() => setDebounced(search.trim()), 900); return () => clearTimeout(timer); }, [search]);
  const local = findExercises(search, category);
  const saved = entries.filter(e => e.kind === 'exercise').flatMap(e => e.data.items || []).filter(e => e.source === 'Gemini estimate' && e.name.toLowerCase().includes(search.trim().toLowerCase()) && (category === 'All' || e.type === category));
  const matches = [...local, ...saved].filter((exercise, index, all) => all.findIndex(e => e.name.toLowerCase() === exercise.name.toLowerCase()) === index);
  const ai = useQuery({ queryKey: ['exercise-ai-search', debounced], enabled: !disabled && debounced === search.trim() && debounced.length >= 3 && !matches.length, staleTime: 3600000, retry: false,
    queryFn: async () => (await askWorkoutAI({ task: 'search', text: debounced }))[0].items,
  });
  const generated = !matches.length && debounced === search.trim() ? (ai.data || []).filter(exercise => category === 'All' || exercise.type === category) : [];
  return <section className="panel p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Add an exercise</h2><span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] text-primary">{exerciseCatalog.length} local movements + AI</span></div><div className="relative mt-4"><Search size={17} className="absolute left-3 top-3.5 text-muted-foreground" /><input aria-label="Search exercises" maxLength={150} disabled={disabled} className="field pl-10" placeholder="Jogging, Romanian deadlift, reverse leg curl…" value={search} onChange={e => setSearch(e.target.value)} /></div><div className="my-3 flex flex-wrap gap-2">{['All', 'Cardio', 'Strength', 'Mobility', 'Sports'].map(type => <button type="button" key={type} disabled={disabled} className={`rounded-full px-3 py-1.5 text-xs ${category === type ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`} onClick={() => setCategory(type)}>{type}</button>)}</div>
    {ai.isFetching && !matches.length && <p role="status" className="mb-3 flex items-center gap-2 text-xs text-primary"><Loader2 size={14} className="animate-spin" />Looking up this movement with Gemini…</p>}
    {ai.error && !matches.length && <p role="alert" className="mb-3 text-xs text-amber-400">{ai.error.message}</p>}
    {!matches.length && !generated.length && !ai.isFetching && <p className="mb-3 text-xs text-muted-foreground">{search.length < 3 ? 'Type at least three characters for AI lookup.' : 'No local matches. Gemini will check this exercise; try All if it belongs to another category.'}</p>}
    <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{[...matches, ...generated].map(exercise => <button type="button" disabled={disabled} key={exercise.name} className="flex items-start gap-3 rounded-xl border border-border p-3 text-left hover:border-primary/40 hover:bg-primary/5" onClick={() => onAdd(exercise)}><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{exercise.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{exercise.type} · {exercise.muscle}</p>{exercise.source === 'Gemini estimate' && <p className="mt-1 flex items-center gap-1 text-[10px] text-amber-400"><Sparkles size={10} />AI suggestion · review details</p>}</div><Plus size={15} className="mt-1 shrink-0 text-primary" /></button>)}</div>
  </section>;
}
