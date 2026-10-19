import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Send, Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useHealth, today, totals } from '@/lib/health';
import { askAI } from '@/lib/ai';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

const prompts = ['Analyze my diet this week', 'Why is my weight stagnant?', 'Give me a meal plan for today', 'What exercises should I do today?', 'Am I on track for my goal?'];
function MessageText({ text }: { text: string }) {
  return <div className="space-y-2 text-sm leading-relaxed">{text.split('\n').map((line, i) => <p key={i}>{line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => part.startsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part)}</p>)}</div>;
}
export default function AICoach() {
  const { entries, profile, add } = useHealth();
  const [input, setInput] = useState(''); const [busy, setBusy] = useState(false); const [clear, setClear] = useState(false);
  const bottom = useRef<HTMLDivElement>(null); const qc = useQueryClient();
  const messages = entries.filter(e => e.kind === 'chat');
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return d.toLocaleDateString('en-CA'); });
  const logged = days.filter(d => entries.some(e => e.kind === 'food' && e.entry_date === d));
  const average = logged.length ? Math.round(logged.reduce((sum, d) => sum + totals(entries, d).calories, 0) / logged.length) : null;
  const workoutDays = days.filter(d => entries.some(e => e.kind === 'exercise' && e.entry_date === d)).length;
  useEffect(() => bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), [messages.length, busy]);
  const send = async (text: string) => {
    if (busy || !text.trim()) return;
    setBusy(true); setInput('');
    try {
      const response = await askAI({ task: 'coach', message: text.trim() });
      if (await add('chat', { role: 'user', text: text.trim() })) await add('chat', { role: 'assistant', text: response.text });
    } catch (error) { setInput(text); toast.error((error as Error).message); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-4xl"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="eyebrow text-primary">GUIDANCE THAT GETS YOU</p><h1 className="mt-2 flex items-center gap-3 text-3xl font-semibold tracking-tight"><Sparkles className="text-primary" />Snap Eat AI Coach</h1><p className="mt-2 text-sm text-muted-foreground">Your meals, movement, and goals — in one conversation.</p></div><button aria-label="Start new chat" className="quiet" disabled={busy} onClick={() => setClear(true)}><Plus size={17} /><span className="hidden sm:inline">New chat</span></button></div>
    <details className="panel mb-4 p-4"><summary className="cursor-pointer text-xs text-muted-foreground">Your context · {average === null ? 'No meals logged yet' : `${average} kcal average on ${logged.length} logged days`} · {workoutDays} workout days</summary><p className="mt-3 text-xs leading-relaxed text-muted-foreground">Your coach uses your profile, recent food and exercise logs, measurements, and conversation history. Your goal is {profile.goal.toLowerCase()} at {profile.calorie_goal} kcal/day. Missing logs are treated as unknown.</p></details>
    <Link to="/weekly-report" className="mb-5 flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4"><span className="flex items-center gap-3 text-sm"><Sparkles size={18} className="text-primary" />Take a moment to review your week</span><ArrowRight size={16} className="text-primary" /></Link>
    <section className="panel overflow-hidden"><div className="max-h-[55vh] min-h-[320px] space-y-5 overflow-y-auto p-4 sm:p-6">{!messages.length && <div className="py-9 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary"><Sparkles size={32} /></div><h2 className="text-xl font-semibold">A little clarity for your next step.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">Ask about a balanced Indian meal, your training routine, or your recent progress. Guidance is personalized to what you’ve logged.</p></div>}
      {messages.map(m => <div key={m.id} className={`flex ${m.data.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[90%] rounded-2xl p-4 sm:max-w-[80%] ${m.data.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-secondary/50'}`}>{m.data.role !== 'user' && <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary"><Sparkles size={14} />Snap Eat</p>}<MessageText text={String(m.data.text)} /><p className="mt-3 text-[10px] opacity-70">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>)}
      {busy && <p className="flex items-center gap-2 text-xs text-primary"><Loader2 size={16} className="animate-spin" />Your coach is reflecting on your question…</p>}<div ref={bottom} /></div>
      <div className="border-t border-border p-4"><div className="mb-3 flex gap-2 overflow-x-auto pb-2">{prompts.map(p => <button key={p} disabled={busy} className="shrink-0 rounded-full border border-border px-3 py-2 text-[11px] text-muted-foreground hover:border-primary/50 hover:text-primary disabled:opacity-50" onClick={() => send(p)}>{p}</button>)}</div><form className="flex gap-2" onSubmit={e => { e.preventDefault(); send(input); }}><input className="field" placeholder="Ask your AI Coach…" aria-label="Message to your coach" maxLength={3000} value={input} onChange={e => setInput(e.target.value)} disabled={busy} /><button className="action" disabled={busy || !input.trim()} aria-label="Send message"><Send size={18} /></button></form><p className="mt-3 text-center text-[10px] text-muted-foreground">AI can make mistakes. Wellness guidance, not medical advice.</p></div>
    </section><Dialog open={clear} onOpenChange={setClear}><DialogContent className="max-w-sm rounded-3xl"><DialogHeader><DialogTitle>Start a fresh conversation?</DialogTitle></DialogHeader><p className="text-sm text-muted-foreground">This deletes your saved chat history. Your tracking logs remain unchanged.</p><button className="action" disabled={busy} onClick={async () => { setBusy(true); const { error } = await supabase.from('health_entries').delete().eq('kind', 'chat'); if (error) toast.error(error.message); else { await qc.invalidateQueries({ queryKey: ['entries'] }); setClear(false); } setBusy(false); }}>Clear conversation</button></DialogContent></Dialog>
  </div>;
}
