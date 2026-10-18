import { Profile, ReminderSettings as Settings } from '@/lib/health';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
export default function ReminderSettings({ profile, onChange }: { profile: Profile; onChange: (settings: Settings) => void }) {
  const settings = profile.settings || {};
  const update = (key: keyof Settings, value: boolean | string | number) => onChange({ ...settings, [key]: value });
  const toggle = (key: keyof Settings, label: string) => <label className="flex items-center justify-between gap-3 py-3 text-sm"><span>{label}</span><input type="checkbox" className="h-4 w-4 accent-emerald-500" checked={Boolean(settings[key])} onChange={e => update(key, e.target.checked)} /></label>;
  return <section className="panel p-6"><h2 className="mb-2 flex items-center gap-2 font-semibold"><Bell size={18} className="text-primary" />Your gentle reminders</h2><p className="mb-4 text-xs leading-relaxed text-muted-foreground">Reminders appear while Mind Eat is open. Closed-app scheduled push delivery is not enabled yet. Save changes to apply your preferences.</p>
    {toggle('meals', 'Meal logging reminders')}{settings.meals && <div className="grid grid-cols-2 gap-3">{(['breakfast', 'lunch', 'dinner', 'snacks'] as const).map((key, i) => <label key={key} className="text-xs capitalize text-muted-foreground">{key}<input className="field mt-2" type="time" value={String(settings[key] || ['08:00', '13:00', '20:00', '16:00'][i])} onChange={e => update(key, e.target.value)} /></label>)}</div>}
    {toggle('water', 'Hydration reminders')}{settings.water && <label className="block text-xs text-muted-foreground">Frequency<select className="field mt-2" value={settings.water_frequency || 2} onChange={e => update('water_frequency', Number(e.target.value))}>{[1, 2, 3, 4].map(n => <option key={n} value={n}>Every {n} hour{n > 1 ? 's' : ''}</option>)}</select></label>}
    {toggle('measurements', 'Weekly measurement reminder')}{settings.measurements && <label className="block text-xs text-muted-foreground">Reminder day<select className="field mt-2" value={settings.measurement_day ?? 0} onChange={e => update('measurement_day', Number(e.target.value))}>{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => <option key={day} value={i}>{day}</option>)}</select></label>}
    {toggle('insights', 'Weekly review nudge')}
    <button type="button" className="quiet mt-4 text-xs" onClick={async () => { if (!('Notification' in window)) { toast.info('Browser notifications are not supported here. In-app reminders still work.'); return; } const permission = await Notification.requestPermission(); toast.info(permission === 'granted' ? 'Browser alerts allowed while the app is running.' : 'You can still read reminders in the notification center.'); }}>Allow browser alerts</button>
  </section>;
}
