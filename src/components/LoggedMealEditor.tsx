import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Save } from 'lucide-react';
import { Entry, useHealth } from '@/lib/health';
import { loggedMealItems, mealData, validMeal } from '@/lib/meals';
import { nutritionKeys } from '@/lib/food';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MealItemsEditor from '@/components/MealItemsEditor';
import { toast } from 'sonner';

export default function LoggedMealEditor({ entry, onClose }: { entry: Entry; onClose: () => void }) {
  const [items, setItems] = useState(() => loggedMealItems(entry.data));
  const [busy, setBusy] = useState(false);
  const { session } = useHealth();
  const qc = useQueryClient();
  const save = async () => {
    if (!session || !validMeal(items)) { toast.error('Add at least one food and check all item quantities.'); return; }
    setBusy(true);
    try {
      const data = { ...entry.data };
      for (const key of nutritionKeys) delete data[key];
      delete data.quantity;
      const { error } = await supabase.from('health_entries').update({ data: { ...data, ...mealData(items) } }).eq('id', entry.id).eq('user_id', session.user.id).eq('kind', 'food').select('id').single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['entries'] });
      toast.success('Meal items and nutrition totals updated'); onClose();
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); }
  };
  return <Dialog open onOpenChange={open => { if (!open && !busy) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-3xl border-primary/15 p-4 sm:p-6"><DialogHeader><DialogTitle className="text-xl">Edit your meal</DialogTitle><DialogDescription>{entry.data.meal} · {entry.entry_date}. Changes are only applied when you save.</DialogDescription></DialogHeader>
    {!Array.isArray(entry.data.items) && <p className="rounded-xl bg-amber-400/10 p-3 text-xs text-amber-400">This older log has no saved breakdown, so its logged portion is shown as one item. You can replace it with individual foods.</p>}
    <MealItemsEditor items={items} onChange={setItems} busy={busy} onBusyChange={setBusy} />
    <div className="flex gap-3"><button type="button" className="quiet" disabled={busy} onClick={onClose}>Cancel</button><button type="button" className="action flex-1" disabled={busy || !validMeal(items)} onClick={save}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}Save meal changes</button></div>
  </DialogContent></Dialog>;
}
