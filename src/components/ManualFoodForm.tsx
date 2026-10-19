import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Food, foodSchema, nutrients } from '@/lib/food';
import { Plus, Save } from 'lucide-react';

export default function ManualFoodForm({ food, editing, busy, saveCustom, onSaveCustom, onSubmit, submitLabel, hideSaveCustom = false }: { food: Food; editing: boolean; busy: boolean; saveCustom: boolean; onSaveCustom: (value: boolean) => void; onSubmit: (food: Food) => Promise<void>; submitLabel?: string; hideSaveCustom?: boolean }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Food>({ resolver: zodResolver(foodSchema), defaultValues: food });
  useEffect(() => reset(food), [food, reset]);
  const error = (key: keyof Food) => errors[key]?.message ? <p className="mt-1 text-xs text-red-400">{String(errors[key]?.message)}</p> : null;
  return <form className="panel p-6" onSubmit={handleSubmit(data => onSubmit({ ...food, ...data }))}>
    <h2 className="mb-5 text-xl font-semibold">{editing ? 'Edit your custom food' : 'A meal your way'}</h2>
    <div className="grid grid-cols-2 gap-4">
      {(['name', 'serving'] as const).map(key => <label key={key} className="col-span-2 text-xs text-muted-foreground sm:col-span-1">{key === 'name' ? 'Food name' : 'Serving (e.g. 1 bowl · 200 g)'}<input className="field mt-2" {...register(key)} />{error(key)}</label>)}
      {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => <label key={key} className="text-xs capitalize text-muted-foreground">{key} ({key === 'calories' ? 'kcal' : 'g'})<input className="field mt-2" type="number" step="any" min="0" {...register(key, { valueAsNumber: true })} />{error(key)}</label>)}
    </div>
    <details className="mt-5 rounded-xl border border-border p-4"><summary className="cursor-pointer text-sm">Additional nutrition (optional)</summary><p className="my-3 text-xs text-muted-foreground">Leave unknown values blank. Use label or reliable serving-based data.</p><div className="grid grid-cols-2 gap-4">{nutrients.map(n => <label key={n.key} className="text-xs text-muted-foreground">{n.label} ({n.unit})<input className="field mt-2" type="number" min="0" max={n.max} step="any" {...register(n.key, { setValueAs: value => value === '' ? undefined : Number(value) })} />{error(n.key)}</label>)}</div></details>
    {!editing && !hideSaveCustom && <label className="my-5 flex items-center gap-2 text-sm"><input type="checkbox" checked={saveCustom} onChange={e => onSaveCustom(e.target.checked)} className="accent-[hsl(var(--primary))]" />Save to my custom foods</label>}
    <button disabled={busy} className="action mt-5 w-full">{editing ? <Save size={17} /> : <Plus size={17} />}{busy ? 'Saving…' : submitLabel || (editing ? 'Save custom food' : 'Log food')}</button>
  </form>;
}
