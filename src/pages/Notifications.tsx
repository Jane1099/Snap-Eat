import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { useHealth } from '@/lib/health';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
export default function Notifications() {
  const { entries } = useHealth(); const navigate = useNavigate(); const qc = useQueryClient(); const [busy, setBusy] = useState(false);
  const notifications = entries.filter(e => e.kind === 'notification').slice().reverse();
  const markRead = async (ids: string[]) => {
    setBusy(true); for (const id of ids) { const entry = notifications.find(e => e.id === id); if (!entry) continue; const { error } = await supabase.from('health_entries').update({ data: { ...entry.data, read: true } }).eq('id', id); if (error) toast.error(error.message); }
    await qc.invalidateQueries({ queryKey: ['entries'] }); setBusy(false);
  };
  return <div className="mx-auto max-w-3xl"><Link to="/dashboard" className="mb-5 flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft size={15} />Dashboard</Link><div className="mb-7 flex items-center justify-between"><div><p className="eyebrow text-primary">GENTLE NUDGES, NOT NOISE</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Notifications</h1></div><button className="quiet text-xs" disabled={busy || !notifications.some(e => !e.data.read)} onClick={() => markRead(notifications.filter(e => !e.data.read).map(e => e.id))}><CheckCheck size={16} />Mark all read</button></div><section className="panel divide-y divide-border">{notifications.length ? notifications.map(e => <button key={e.id} className="flex w-full items-start gap-4 p-5 text-left hover:bg-secondary/30" onClick={async () => { await markRead([e.id]); navigate(e.data.route || '/dashboard'); }}><div className="rounded-xl bg-primary/10 p-3 text-primary"><Bell size={19} /></div><div className="flex-1"><h2 className="text-sm font-semibold">{e.data.title}</h2><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{e.data.message}</p><p className="mt-3 text-[10px] text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p></div>{!e.data.read && <span className="mt-2 h-2 w-2 rounded-full bg-primary" />}</button>) : <div className="p-12 text-center"><Bell size={38} className="mx-auto mb-5 text-primary" /><h2 className="text-lg font-semibold">A little space to breathe.</h2><p className="mt-3 text-sm text-muted-foreground">You’re all caught up. Enable gentle reminders in your profile.</p><Link className="action mt-6 text-xs" to="/profile">Reminder settings</Link></div>}</section></div>;
}
