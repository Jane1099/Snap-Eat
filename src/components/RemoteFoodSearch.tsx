import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ChevronRight } from 'lucide-react';
import { askAI } from '@/lib/ai';
import { Food, foodSchema } from '@/lib/food';

export default function RemoteFoodSearch({ onSelect }: { onSelect: (food: Food) => void }) {
  const [source, setSource] = useState('search');
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const { data = [], isFetching, error } = useQuery({
    queryKey: ['remote-food-search', source, query],
    enabled: query.length >= 2,
    retry: false,
    queryFn: async (): Promise<Food[]> => {
      const response = await askAI({ task: source, query });
      return (response.foods || []).filter((food: unknown) => foodSchema.safeParse(food).success) as Food[];
    },
  });
  return <section className="panel mt-6 p-5">
    <h2 className="text-base font-semibold">Explore beyond the Indian catalog</h2>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Search packaged foods with Open Food Facts, or common global foods with USDA. Values are per 100 g; review the portion before logging.</p>
    <form className="mt-4 flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); setQuery(input.trim()); }}>
      <select aria-label="Food database" className="field w-full sm:w-44" value={source} onChange={e => { setSource(e.target.value); setQuery(''); }}>
        <option value="search">Packaged foods</option><option value="usda">Global foods (USDA)</option>
      </select>
      <input aria-label="Search external food database" className="field min-w-0 flex-1" required minLength={2} maxLength={100} placeholder="Search a food or brand…" value={input} onChange={e => setInput(e.target.value)} />
      <button className="action" disabled={isFetching} aria-label="Search foods">{isFetching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}</button>
    </form>
    {error && <p role="alert" className="mt-4 text-xs text-amber-400">{error.message}</p>}
    {query && !isFetching && !error && !data.length && <p className="mt-4 text-xs text-muted-foreground">No matching foods with usable nutrition data. Try another term or manual entry.</p>}
    <div className="mt-4 divide-y divide-border">{data.map((food, index) => <button key={`${food.id}-${index}`} className="flex w-full items-center gap-3 py-3 text-left" onClick={() => onSelect(food)}>
      <div className="min-w-0 flex-1"><p className="text-sm font-medium">{food.name}</p><p className="mt-1 text-xs text-muted-foreground">{food.serving} · {food.protein}g protein</p></div>
      <span className="text-xs text-primary">{Math.round(food.calories)} kcal</span><ChevronRight size={16} className="text-muted-foreground" />
    </button>)}</div>
  </section>;
}
