import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import { askAI } from '@/lib/ai';
import { Food, foodSchema } from '@/lib/food';
import { useFoodCatalog, matchesFood } from '@/lib/useFoodCatalog';

export default function RemoteFoodSearch({ onSelect }: { onSelect: (food: Food) => void }) {
  const [source, setSource] = useState('all');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const catalog = useFoodCatalog();
  useEffect(() => { const timer = setTimeout(() => setQuery(input.trim()), 500); return () => clearTimeout(timer); }, [input]);
  const remote = useQuery({
    queryKey: ['remote-food-search', source === 'usda' ? 'usda' : 'search', query],
    enabled: query.length >= 2 && source !== 'indian' && source !== 'custom',
    retry: false, staleTime: 300000,
    queryFn: async (): Promise<Food[]> => {
      const response = await askAI({ task: source === 'usda' ? 'usda' : 'search', query });
      return (response.foods || []).filter((food: unknown) => foodSchema.safeParse(food).success) as Food[];
    },
  });
  const local = source === 'packaged' || source === 'usda' ? [] : catalog.foods.filter(food => matchesFood(food, input) && (source !== 'custom' || food.category === 'Custom') && (source !== 'indian' || food.category === 'Indian'));
  const remoteFoods = query === input.trim() && !['indian', 'custom'].includes(source) ? remote.data || [] : [];
  const foods = [...local, ...remoteFoods].filter((food, i, list) => list.findIndex(other => other.name.toLowerCase() === food.name.toLowerCase() && other.serving === food.serving) === i);
  return <section className="panel p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold">Find your familiar foods</h2><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Regional Indian recipes, your custom foods, and Open Food Facts. Nutrition estimates vary with preparation.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] text-primary">{catalog.foods.filter(f => f.region).length}+ regional entries</span></div>
    <div className="mt-4 flex flex-wrap gap-2">
      <div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-3.5 text-muted-foreground" /><input aria-label="Search foods" className="field pl-10" maxLength={100} placeholder="Idli, chutney, paneer, golgappa…" value={input} onChange={e => setInput(e.target.value)} /></div>
      <select aria-label="Food database" className="field w-full sm:w-40" value={source} onChange={e => setSource(e.target.value)}><option value="all">All foods</option><option value="indian">Indian recipes</option><option value="custom">My custom foods</option><option value="packaged">Open Food Facts</option><option value="usda">USDA</option></select>
    </div>
    {(catalog.isLoading || remote.isFetching) && <p role="status" className="mt-4 flex items-center gap-2 text-xs text-primary"><Loader2 size={14} className="animate-spin" />{catalog.isLoading ? 'Loading recipes…' : 'Searching external foods…'}</p>}
    {catalog.error && <p role="alert" className="mt-4 text-xs text-amber-400">{catalog.error.message}</p>}
    {remote.error && !['indian', 'custom'].includes(source) && <p role="alert" className="mt-4 text-xs text-amber-400">{remote.error.message} Local recipes are still available.</p>}
    {!catalog.isLoading && !remote.isFetching && !foods.length && <p className="mt-4 text-xs text-muted-foreground">{input.length < 2 ? 'Type at least two characters for external foods.' : 'No matches. Try a different name or add a manual item.'}</p>}
    <div className="mt-4 max-h-96 divide-y divide-border overflow-y-auto">{foods.map((food, index) => <button type="button" key={`${food.id}-${index}`} className="flex w-full items-center gap-3 rounded-lg px-2 py-3 text-left hover:bg-secondary/50" onClick={() => onSelect(food)}>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">🥣</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{food.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{food.serving} · {food.region || food.category} · {food.protein}g protein</p></div><span className="shrink-0 text-xs text-primary">{Math.round(food.calories)} kcal</span><ChevronRight size={14} className="text-muted-foreground" />
    </button>)}</div>
  </section>;
}
