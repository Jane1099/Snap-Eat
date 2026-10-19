import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Moon, Palette, RotateCcw, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { applyThemeColor, DEFAULT_THEME_COLOR, DISPLAY_MODE_KEY, getThemeColor, isThemeColor, THEME_COLOR_KEY } from '@/lib/theme';
import { toast } from 'sonner';

const presets = [
  { name: 'Emerald', value: '#10b981' }, { name: 'Ocean', value: '#0284c7' },
  { name: 'Violet', value: '#8b5cf6' }, { name: 'Rose', value: '#e11d48' },
  { name: 'Tangerine', value: '#f97316' }, { name: 'Teal', value: '#0d9488' },
];

export default function Settings() {
  const [color, setColor] = useState(getThemeColor);
  const [hex, setHex] = useState(color);
  const [light, setLight] = useState(document.documentElement.classList.contains('light'));
  const updateColor = (value: string) => {
    if (!isThemeColor(value)) return;
    const next = value.toLowerCase();
    setColor(next); setHex(next); applyThemeColor(next);
    try { localStorage.setItem(THEME_COLOR_KEY, next); }
    catch { toast.error('Colour applied, but this browser could not save your preference.'); }
  };

  return <div className="mx-auto max-w-2xl">
    <Link to="/profile" className="mb-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"><ArrowLeft size={15} />Back to profile & goals</Link>
    <p className="eyebrow text-primary">MAKE IT YOURS</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1><p className="mb-7 mt-2 text-sm text-muted-foreground">A little more you. Personalize how Snap Eat looks.</p>
    <section className="panel space-y-6 rounded-3xl p-5 sm:p-7" aria-labelledby="appearance-title">
      <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Palette size={23} /></div><div><h2 id="appearance-title" className="text-lg font-semibold">App Appearance</h2><p className="mt-1 text-xs text-muted-foreground">Changes apply instantly and save on this browser.</p></div></div>
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/30 p-4"><div className="flex items-center gap-3">{light ? <Sun size={20} className="text-primary" /> : <Moon size={20} className="text-primary" />}<div><label htmlFor="light-mode" className="text-sm font-medium">Light mode</label><p className="mt-1 text-xs text-muted-foreground">{light ? 'Bright and fresh' : 'Calm and dark'}</p></div></div><Switch id="light-mode" checked={light} className="data-[state=checked]:bg-primary" onCheckedChange={next => { document.documentElement.classList.toggle('light', next); setLight(next); applyThemeColor(color); try { localStorage.setItem(DISPLAY_MODE_KEY, next ? 'light' : 'dark'); } catch { toast.error('Appearance applied, but this browser could not save it.'); } }} /></div>
      <div>
        <h3 className="text-sm font-semibold">Theme Color</h3><p className="mt-1 text-xs leading-relaxed text-muted-foreground">Pick any colour for buttons, progress bars, active tabs and highlights.</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-border p-4">
          <label className="relative block h-16 w-16 shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-border shadow-sm" style={{ backgroundColor: color }}><span className="sr-only">Choose a custom theme colour</span><input type="color" value={color} onInput={event => updateColor(event.currentTarget.value)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" /></label>
          <div className="min-w-0 flex-1"><label htmlFor="theme-hex" className="text-xs font-medium">Custom hex colour</label><Input id="theme-hex" className="mt-2 h-10 rounded-xl bg-background font-mono" value={hex} maxLength={7} placeholder="#10b981" spellCheck={false} aria-invalid={!isThemeColor(hex)} aria-describedby="theme-hex-help" onChange={event => { const value = event.target.value; setHex(value); if (isThemeColor(value)) updateColor(value); }} /><p id="theme-hex-help" className={`mt-2 text-[11px] ${isThemeColor(hex) ? 'text-muted-foreground' : 'text-destructive'}`}>{isThemeColor(hex) ? 'Tap the swatch to open the full colour picker.' : 'Use # followed by six hexadecimal digits.'}</p></div>
        </div>
        <fieldset className="mt-5"><legend className="mb-3 text-xs font-medium text-muted-foreground">Or try a favourite</legend><div className="flex flex-wrap gap-3">{presets.map(preset => <button type="button" key={preset.value} aria-label={preset.name} aria-pressed={color === preset.value} onClick={() => updateColor(preset.value)} className={`flex h-11 w-11 items-center justify-center rounded-full border-4 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${color === preset.value ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: preset.value }}>{color === preset.value && <Check size={17} className="text-white" strokeWidth={3} />}</button>)}</div></fieldset>
      </div>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4"><p className="mb-3 text-xs font-semibold text-primary">YOUR LIVE PREVIEW</p><div className="flex flex-wrap items-center gap-3"><span className="action rounded-xl px-4 py-2 text-xs">Button preview</span><span className="rounded-full bg-primary/15 px-3 py-2 text-xs font-medium text-primary">Active tab</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-2/3 rounded-full bg-primary" /></div></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><p role="status" className="text-xs text-muted-foreground">Saved locally · no account changes needed</p><Button type="button" variant="outline" className="rounded-xl border-border bg-secondary/30 text-xs hover:bg-secondary" onClick={() => updateColor(DEFAULT_THEME_COLOR)}><RotateCcw size={14} />Reset colour</Button></div>
    </section>
  </div>;
}
