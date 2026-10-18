import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Search, ScanBarcode, Pencil, ArrowLeft, Plus, Heart, Loader2, Sparkles, ChevronRight, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useHealth, today } from '@/lib/health';
import { askAI, uploadFoodPhoto } from '@/lib/ai';
import { preprocessMealPhoto } from '@/lib/mealPhoto';
import { Food, emptyFood, foodSchema, scaleFood } from '@/lib/food';
import BarcodeCamera from '@/components/BarcodeCamera';
import MealCamera from '@/components/MealCamera';
import ManualFoodForm from '@/components/ManualFoodForm';
import FoodNutrition from '@/components/FoodNutrition';
import RemoteFoodSearch from '@/components/RemoteFoodSearch';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
export type { Food } from '@/lib/food';

export default function LogFood() {
  const [params, setParams] = useSearchParams(); const { foodId } = useParams(); const nav = useNavigate(); const qc = useQueryClient();
  const { session, entries, add } = useHealth(); const mode = params.get('mode') || 'search';
  const [query, setQuery] = useState(''); const [filter, setFilter] = useState('All'); const [selected, setSelected] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState(1); const [meal, setMeal] = useState(params.get('meal') || 'Lunch'); const [manual, setManual] = useState<Food>(emptyFood);
  const [editingId, setEditingId] = useState<string | null>(null); const [saveCustom, setSaveCustom] = useState(false); const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(''); const [preview, setPreview] = useState(''); const [camera, setCamera] = useState(false); const [liveMeal, setLiveMeal] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const { data: foods = [], isLoading, error } = useQuery({ queryKey: ['foods'], queryFn: async () => { const { data, error } = await supabase.from('foods').select('*'); if (error) throw error; return data as Food[]; } });
  const customs = entries.filter(e => e.kind === 'favorite' && e.data.custom).map(e => ({ ...e.data, id: e.id, category: 'Custom' } as Food));
  useEffect(() => { if (error) toast.error(error.message); }, [error]);
  useEffect(() => {
    setEditingId(null);
    if (foodId) { const entry = [...foods, ...customs].find(f => f.id === foodId); if (entry) setSelected(entry); }
  }, [foodId, foods]);
  const choose = (food: Food) => { setSelected(food); setQuantity(1); setEditingId(null); setRecent(values => [food.name, ...values.filter(v => v !== food.name)].slice(0, 5)); };
  const switchMode = (next: string) => { setSelected(null); setEditingId(null); setCamera(false); setLiveMeal(false); params.set('mode', next); setParams(params); };
  const lookup = useCallback(async (value: string) => { setCode(value); setCamera(false); setBusy(true); try { const result = await askAI({ task: 'barcode', code: value }); choose(result.food); } catch (error) { toast.error((error as Error).message); } finally { setBusy(false); } }, []);
  const photo = async (file: File) => {
    if (!session) return; setBusy(true); setPreview('');
    let path: string | undefined;
    try {
      const processed = await preprocessMealPhoto(file);
      setPreview(processed.dataUrl);
      path = await uploadFoodPhoto(processed.file, session.user.id);
      const result = await askAI({ task: 'recognize', path }); const parsed = foodSchema.safeParse(result?.food);
      if (!parsed.success) {
        console.warn('[meal-recognition] Invalid nutrition response', { fields: parsed.error.issues.map(issue => issue.path.join('.')) });
        throw new Error('The AI returned incomplete nutrition data. Please try the photo again or enter the meal manually.');
      }
      choose({ ...(parsed.data as Food), category: 'AI estimate', confidence: result.food.confidence, photo_path: path });
    } catch (error) { if (path) await supabase.storage.from('food-photos').remove([path]); toast.error((error as Error).message); } finally { setBusy(false); }
  };
  const log = async (food: Food, multiplier = 1) => {
    const parsed = foodSchema.safeParse(food); if (!parsed.success) { toast.error('Check the food name, serving and nutrition values.'); return; }
    setBusy(true);
    if (editingId) {
      const { error } = await supabase.from('health_entries').update({ data: { ...food, ...parsed.data, custom: true, category: 'Custom' } }).eq('id', editingId).eq('kind', 'favorite');
      if (error) toast.error(error.message); else { await qc.invalidateQueries({ queryKey: ['entries'] }); toast.success('Custom food updated'); nav('/favorites'); }
    } else if (await add('food', { ...scaleFood({ ...food, ...parsed.data }, multiplier), meal }, params.get('date') || today())) {
      if (saveCustom && mode === 'manual') await add('favorite', { ...food, custom: true, category: 'Custom' });
      toast.success(`${food.name} added to ${meal.toLowerCase()}`); nav('/dashboard');
    }
    setBusy(false);
  };
  const editSelected = () => {
    if (!selected) return;
    const custom = entries.find(e => e.kind === 'favorite' && e.data.custom && e.id === selected.id);
    setEditingId(custom?.id || null); setManual(selected); setSelected(null); params.set('mode', 'manual'); setParams(params);
  };
  const filtered = [...foods, ...customs].filter(f => f.name.toLowerCase().includes(query.toLowerCase()) && (filter === 'All' || f.category === filter));
  return <div className="mx-auto max-w-4xl">
    <Link to="/dashboard" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft size={15} />Back to dashboard</Link>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow text-primary">MAKE EVERY MEAL COUNT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{foodId ? 'Food details' : 'What’s on your plate?'}</h1><p className="mt-2 text-sm text-muted-foreground">Your familiar favorites, a little better understood.</p></div><select aria-label="Meal category" className="field w-36" value={meal} onChange={e => setMeal(e.target.value)}>{['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map(m => <option key={m}>{m}</option>)}</select></div>
    {!foodId && <div className="mb-6 grid grid-cols-4 gap-1 rounded-xl border border-border bg-card p-1.5">{[{ key: 'camera', icon: Camera, label: 'Camera' }, { key: 'search', icon: Search, label: 'Search' }, { key: 'barcode', icon: ScanBarcode, label: 'Barcode' }, { key: 'manual', icon: Pencil, label: 'Manual' }].map(tab => <button disabled={busy} key={tab.key} onClick={() => switchMode(tab.key)} className={`flex items-center justify-center gap-2 rounded-lg py-3 text-xs font-medium ${mode === tab.key ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}><tab.icon size={16} /><span className="text-[10px] sm:text-xs">{tab.label}</span></button>)}</div>}
    {selected ? <section className="panel p-6"><div className="flex justify-between gap-3"><div><span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] text-primary">{selected.category || 'Indian'}</span><h2 className="mt-4 text-2xl font-semibold">{selected.name}</h2><p className="mt-2 text-sm text-muted-foreground">{selected.serving}</p></div><button disabled={busy} aria-label="Add to favorites" className="quiet h-fit" onClick={async () => { if (await add('favorite', selected)) toast.success('Added to favorites'); }}><Heart size={18} /></button></div>
      {preview && mode === 'camera' && <img src={preview} alt="Your meal" className="mt-5 h-44 w-full rounded-xl object-cover" />}
      {selected.confidence !== undefined && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-400">AI estimate · {Math.round(selected.confidence * 100)}% identification confidence. This is not a calibrated certainty score. Review portion and nutrition before saving.</p>}
      <div className="my-7"><div className="mb-4 flex items-center justify-between text-sm"><label htmlFor="quantity">Portion multiplier</label><input id="quantity" className="field w-20 text-center" type="number" min="0.25" max="5" step="0.25" value={quantity} onChange={e => setQuantity(Math.max(.25, Math.min(5, Number(e.target.value))))} /></div><Slider value={[quantity]} min={.25} max={5} step={.25} onValueChange={v => setQuantity(v[0])} /></div>
      <FoodNutrition food={selected} quantity={quantity} />
      <div className="flex flex-wrap gap-3"><button className="quiet" disabled={busy} onClick={editSelected}>{selected.category === 'Custom' ? 'Edit custom food' : 'Edit manually'}</button><button className="action flex-1" disabled={busy} onClick={() => log(selected, quantity)}><Plus size={17} />Log food</button>{!foodId && <button className="w-full text-center text-xs text-muted-foreground" onClick={() => setSelected(null)} disabled={busy}>Try another food</button>}</div>
    </section> : <>
      {mode === 'search' && <><div className="relative"><Search size={19} className="absolute left-4 top-3.5 text-muted-foreground" /><input className="field py-3 pl-12" placeholder="Search dal, roti, biryani, and more…" value={query} onChange={e => setQuery(e.target.value)} /></div>{recent.length > 0 && !query && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[10px] text-muted-foreground">Recent</span>{recent.map(name => <button key={name} className="rounded-full border border-border px-3 py-1 text-[11px]" onClick={() => setQuery(name)}>{name}</button>)}</div>}<div className="my-4 flex gap-2">{['All', 'Indian', 'Custom'].map(f => <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-4 py-1.5 text-xs ${filter === f ? 'border-primary/30 bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}>{f}</button>)}<Link to="/favorites" className="ml-auto flex items-center gap-1 text-xs text-primary"><Heart size={14} />Favorites</Link></div><p className="mb-3 text-xs text-muted-foreground">{query ? 'Search results' : 'Everyday favorites'} · serving-based nutrition estimates</p><div className="panel divide-y divide-border">{isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading foods…</p> : filtered.length ? filtered.map(f => <button key={f.id} onClick={() => choose(f)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-secondary/40"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">{f.name.includes('roti') ? '🫓' : f.name.includes('rice') ? '🍚' : f.name.includes('Banana') ? '🍌' : '🥣'}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">{f.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{f.serving} · {f.protein}g protein</p></div><span className="text-sm font-semibold">{f.calories}<span className="ml-1 text-[10px] font-normal text-muted-foreground">kcal</span></span><ChevronRight size={16} className="text-muted-foreground" /></button>) : <p className="p-6 text-sm text-muted-foreground">No matches. Try a different search or enter your food manually.</p>}</div></>}
      {mode === 'camera' && <section className="panel overflow-hidden">{liveMeal ? <MealCamera onCapture={photo} onClose={() => setLiveMeal(false)} /> : <img src={preview || '/assets/indian-thali.png'} alt={preview ? 'Your meal' : 'An Indian thali'} className="h-64 w-full object-cover" />}<div className="p-6"><h2 className="flex items-center gap-2 text-xl font-semibold"><Sparkles className="text-primary" size={20} />Your meal, in a snap.</h2><p className="my-3 text-sm leading-relaxed text-muted-foreground">Take a clear overhead photo. AI estimates the foods and portion, then you review and adjust.</p>{busy ? <p role="status" className="flex items-center justify-center gap-2 rounded-xl bg-primary/10 p-4 text-sm text-primary"><Loader2 size={18} className="animate-spin" />Analyzing your food…</p> : <div className="flex flex-wrap gap-3"><button className="action flex-1" onClick={() => setLiveMeal(true)}><Camera size={18} />Open camera</button><label className="quiet cursor-pointer"><Upload size={17} />Upload photo<input type="file" accept="image/*" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) photo(file); e.target.value = ''; }} /></label></div>}<p className="mt-3 text-center text-[10px] text-muted-foreground">Estimates, not exact measurements. Review before logging.</p></div></section>}
      {mode === 'barcode' && <section className="panel space-y-5 p-6"><h2 className="text-xl font-semibold">Scan packaged food</h2>{camera ? <BarcodeCamera onCode={lookup} /> : <button disabled={busy} onClick={() => setCamera(true)} className="flex h-48 w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 text-primary"><ScanBarcode size={45} /><span className="text-sm">Open camera scanner</span></button>}<p className="text-xs text-muted-foreground">Or enter the barcode. Open Food Facts nutrition is per 100 g; adjust portions before logging.</p><form className="flex gap-3" onSubmit={e => { e.preventDefault(); lookup(code); }}><input className="field" inputMode="numeric" pattern="[0-9]{8,14}" required placeholder="8–14 digit barcode" value={code} onChange={e => setCode(e.target.value)} /><button className="action" disabled={busy} aria-label="Look up barcode">{busy ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}</button></form></section>}
      {mode === 'manual' && <ManualFoodForm food={manual} editing={!!editingId} busy={busy} saveCustom={saveCustom} onSaveCustom={setSaveCustom} onSubmit={log} />}
    </>}
    {!selected && mode === 'search' && <RemoteFoodSearch onSelect={choose} />}
  </div>;
}
