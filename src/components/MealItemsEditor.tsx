import { useState } from 'react';
import { Minus, Plus, Trash2, Search, Pencil } from 'lucide-react';
import { MealItem, makeMealItem, mealData } from '@/lib/meals';
import { emptyFood } from '@/lib/food';
import RemoteFoodSearch from '@/components/RemoteFoodSearch';
import ManualFoodForm from '@/components/ManualFoodForm';
import { Button } from '@/components/ui/button';

export default function MealItemsEditor({ items, onChange, busy = false }: { items: MealItem[]; onChange: (items: MealItem[]) => void; busy?: boolean }) {
  const [adding, setAdding] = useState<'search' | 'manual' | null>(null);
  const total = mealData(items);
  const quantity = (id: string, value: number) => onChange(items.map(item => item.itemId === id ? { ...item, quantity: value } : item));
  const control = 'h-10 w-10 rounded-xl border border-primary/20 bg-primary/10 p-0 text-primary hover:bg-primary/20';
  return <div className="space-y-4">
    <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">{items.length} items · adjust each estimated portion</p><div className="flex gap-2"><Button type="button" variant="outline" disabled={busy || items.length >= 40} className="rounded-xl border-primary/20 bg-primary/5 text-xs text-primary" onClick={() => setAdding(adding === 'search' ? null : 'search')}><Search size={14} />Add item</Button><Button type="button" variant="outline" disabled={busy || items.length >= 40} className="rounded-xl text-xs" onClick={() => setAdding(adding === 'manual' ? null : 'manual')}><Pencil size={14} />Manual</Button></div></div>
    {adding === 'search' && !busy && <RemoteFoodSearch onSelect={food => { onChange([...items, makeMealItem(food)]); setAdding(null); }} />}
    {adding === 'manual' && !busy && <ManualFoodForm food={emptyFood} editing={false} busy={false} saveCustom={false} onSaveCustom={() => {}} submitLabel="Add item to meal" hideSaveCustom onSubmit={async food => { onChange([...items, makeMealItem(food)]); setAdding(null); }} />}
    {!items.length && <div className="rounded-2xl border border-dashed border-primary/30 p-8 text-center text-sm text-muted-foreground">No items left. Add a food before saving this meal.</div>}
    {items.map(item => <article key={item.itemId} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex justify-between gap-3"><div className="min-w-0"><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-xs text-muted-foreground">{item.serving} per unit · {item.quantity || 0} × this portion</p>{item.confidence !== undefined && <p className="mt-1 text-[10px] text-amber-400">AI identification estimate · {Math.round(item.confidence * 100)}% (not calibrated)</p>}</div><Button type="button" variant="ghost" disabled={busy} aria-label={`Delete ${item.name}`} className="h-9 w-9 shrink-0 rounded-xl p-0 text-muted-foreground hover:bg-red-400/10 hover:text-red-400" onClick={() => onChange(items.filter(other => other.itemId !== item.itemId))}><Trash2 size={16} /></Button></div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4"><div><p className="text-xl font-semibold text-primary">{Math.round(item.calories * item.quantity)} <span className="text-xs font-normal">kcal</span></p><div className="mt-2 flex flex-wrap gap-3 text-[11px]"><span>Protein <b className="text-primary">{(item.protein * item.quantity).toFixed(1)}g</b></span><span>Carbs <b className="text-amber-400">{(item.carbs * item.quantity).toFixed(1)}g</b></span><span>Fat <b className="text-indigo-400">{(item.fat * item.quantity).toFixed(1)}g</b></span></div></div>
      <div className="flex items-center gap-2"><Button type="button" disabled={busy || item.quantity <= 0.01} aria-label={`Decrease ${item.name} quantity`} className={control} onClick={() => quantity(item.itemId, Math.max(0.01, Math.round((item.quantity - 0.25) * 100) / 100))}><Minus size={16} /></Button><input aria-label={`${item.name} quantity`} type="number" min="0.01" max="100" step="any" className="field w-20 text-center" disabled={busy} value={item.quantity || ''} onChange={e => quantity(item.itemId, Math.max(0, Math.min(100, Number(e.target.value))))} /><Button type="button" disabled={busy || item.quantity >= 100} aria-label={`Increase ${item.name} quantity`} className={control} onClick={() => quantity(item.itemId, Math.min(100, Math.round((item.quantity + 0.25) * 100) / 100))}><Plus size={16} /></Button></div></div>
    </article>)}
    <div aria-live="polite" className="rounded-2xl border border-primary/25 bg-primary/10 p-5"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Meal total</h3><p className="text-2xl font-semibold text-primary">{Math.round(total.calories)} <span className="text-xs">kcal</span></p></div><div className="mt-3 grid grid-cols-3 gap-2 text-xs"><p>Protein <b className="block mt-1 text-primary">{total.protein.toFixed(1)}g</b></p><p>Carbs <b className="block mt-1 text-amber-400">{total.carbs.toFixed(1)}g</b></p><p>Fat <b className="block mt-1 text-indigo-400">{total.fat.toFixed(1)}g</b></p></div></div>
    <p className="text-[10px] leading-relaxed text-muted-foreground">Quantities multiply the portion shown on each card. Recipes, oil and actual weights can vary. Review all AI estimates before saving.</p>
  </div>;
}
