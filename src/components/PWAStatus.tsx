import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export default function PWAStatus() {
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setOnline(navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  if (online) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-4 top-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-amber-400/40 bg-card px-4 py-3 shadow-lg">
      <WifiOff size={18} className="shrink-0 text-amber-400" />
      <p className="text-xs text-foreground">You're offline. Reconnect to load or save your tracking data.</p>
    </div>
  );
}
