import { useState } from 'react';
import { z } from 'zod';
import { ArrowLeft, Sparkles, WandSparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MealItem, mealItemSchema } from '@/lib/meals';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
const resultItems = z.array(mealItemSchema.extend({ itemId: z.string().uuid() })).max(40);
export default function AIMealPanel({ items, onApply, onBack, onBusyChange }: { items: MealItem[]; onApply: (items: MealItem[], assumptions: string[]) => void; onBack?: () => void; onBusyChange: (busy: boolean) => void }) {
  const [text, setText] = useState(''); const [busy, setBusy] = useState(false); const [notes, setNotes] = useState<string[]>([]);
  const create = items.length === 0;
  const update = async () => {
    setBusy(true); onBusyChange(true); setNotes([]);
    try {
      const { data, error } = await supabase.functions.invoke('mind-eat-meal-edit', { body: { text, items } });
      if (error) { let message = error.message; if (error.context instanceof Response) { try { message = (await error.context.json()).error || message; } catch {} } throw new Error(message); }
      if (data?.error) throw new Error(data.error);
      if (!resultItems.safeParse(data?.items).success) throw new Error('AI returned incomplete nutrition. Please try again or edit manually.');
      const assumptions = Array.isArray(data.assumptions) ? data.assumptions.filter((note: unknown) => typeof note === 'string') as string[] : [];
      if (!data.changed) { setNotes(assumptions.length ? assumptions : ['Please specify which foods and portions you want to add or change.']); return; }
      onApply(data.items as MealItem[], assumptions);
      toast.success(create ? 'Meal created. Review the estimates before logging.' : 'Meal updated. Review the estimates before saving.');
    } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); onBusyChange(false); }
  };
  return <section className="space-y-5 rounded-3xl border border-primary/20 bg-card p-5 sm:p-7">
    {onBack && <button type="button" disabled={busy} className="flex items-center gap-2 text-sm text-muted-foreground" onClick={onBack}><ArrowLeft size={17} />Back to meal</button>}
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={27} /></div><div><p className="eyebrow text-primary">{create ? 'DESCRIBE. REVIEW. LOG.' : 'MAKE IT YOUR MEAL'}</p><h2 className="mt-2 text-2xl font-semibold">{create ? 'Add food with AI' : 'Edit with AI'}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{create ? 'Describe what you ate, including portions and how it was prepared.' : 'Tell us what you would like to add, remove or change in this meal.'}</p></div>
    <label className="block"><span className="sr-only">{create ? 'Meal description' : 'AI meal edit instruction'}</span><textarea autoFocus disabled={busy} maxLength={2000} className="field min-h-44 resize-y rounded-2xl border-primary/40 bg-primary/5 p-5 text-base leading-relaxed placeholder:text-muted-foreground" value={text} onChange={e => setText(e.target.value)} placeholder={create ? '2 boiled eggs, 1 slice of whole-wheat toast and 150 g cooked rice…' : 'Tell us what you would like to add, remove or change in this meal…'} /></label>
    <div className="rounded-2xl bg-secondary/60 p-4 text-sm italic text-primary">{create ? 'Example: Omelette with 2 eggs and 1 tsp oil, plus 1 slice of toast.' : 'Example: Add one boiled egg, remove the toast, and change rice to 150 g.'}</div>
    {notes.length > 0 && <div role="status" className="rounded-2xl bg-amber-400/10 p-4 text-xs text-amber-400">{notes.map((note, i) => <p className="mb-1" key={i}>{note}</p>)}</div>}
    <p className="text-xs leading-relaxed text-muted-foreground">Calories are estimates, not measurements. For better accuracy, specify grams, pieces, oil/butter and cooking method. Labels or weighed recipes are more reliable.</p>
    <Button type="button" className="h-12 w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90" disabled={busy || text.trim().length < 3} onClick={update}>{busy ? <Loader2 size={18} className="animate-spin" /> : <WandSparkles size={18} />}{busy ? 'Updating your meal…' : create ? 'Create meal' : 'Update result'}</Button>
  </section>;
}
