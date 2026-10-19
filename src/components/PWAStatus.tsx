import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { WifiOff, Download, RefreshCw, X } from 'lucide-react';
import { useReminders } from '@/lib/useReminders';

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
export default function PWAStatus() {
  const [online, setOnline] = useState(() => navigator.onLine); const [install, setInstall] = useState<InstallPrompt | null>(null); const [dismissed, setDismissed] = useState(false);
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW();
  useReminders();
  useEffect(() => {
    const update = () => setOnline(navigator.onLine); const prompt = (event: Event) => { event.preventDefault(); setInstall(event as InstallPrompt); }; const installed = () => setInstall(null);
    window.addEventListener('online', update); window.addEventListener('offline', update); window.addEventListener('beforeinstallprompt', prompt); window.addEventListener('appinstalled', installed);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); window.removeEventListener('beforeinstallprompt', prompt); window.removeEventListener('appinstalled', installed); };
  }, []);
  if (online && !needRefresh && (!install || dismissed)) return null;
  return <div role="status" aria-live="polite" className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-lg items-center gap-3 rounded-2xl border border-primary/30 bg-card px-4 py-3 shadow-lg">
    {!online ? <><WifiOff size={18} className="shrink-0 text-amber-400" /><p className="text-xs">You're offline. The app shell and cached food catalog are available. Reconnect to load or save private tracking data.</p></> : needRefresh ? <><RefreshCw size={18} className="shrink-0 text-primary" /><p className="flex-1 text-xs">A fresh version is ready. Save any edits before updating.</p><button className="action px-3 py-2 text-xs" onClick={() => updateServiceWorker(true)}>Update</button><button aria-label="Dismiss update" onClick={() => setNeedRefresh(false)}><X size={16} /></button></> : <><Download size={18} className="shrink-0 text-primary" /><p className="flex-1 text-xs">Keep Snap Eat one tap away.</p><button className="action px-3 py-2 text-xs" onClick={async () => { await install?.prompt(); const choice = await install?.userChoice; if (choice?.outcome === 'accepted') setInstall(null); else setDismissed(true); }}>Install</button><button aria-label="Dismiss installation" onClick={() => setDismissed(true)}><X size={16} /></button></>}
  </div>;
}
