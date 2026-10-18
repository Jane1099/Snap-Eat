import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHealth } from '@/lib/health';
import { Food, nutrients } from '@/lib/food';

export function useFoodCatalog() {
  const { session, entries } = useHealth();
  const query = useQuery({ queryKey: ['foods', session?.user.id], enabled: !!session, queryFn: async () => {
    const { data, error } = await supabase.from('foods').select('*').order('name');
    if (error) throw error;
    return (data || []).map(row => {
      const food = { ...row } as Food;
      for (const n of nutrients) if (food[n.key] == null) delete food[n.key];
      return food;
    });
  } });
  const customs = entries.filter(e => e.kind === 'favorite' && e.data.custom).map(e => ({ ...e.data, id: e.id, category: 'Custom' } as Food));
  return { ...query, foods: [...(query.data || []), ...customs] };
}
export function matchesFood(food: Food, query: string) {
  const searchable = [food.name, food.region || '', ...(food.aliases || [])].join(' ').toLowerCase();
  return query.trim().toLowerCase().split(/\s+/).every(word => searchable.includes(word));
}
