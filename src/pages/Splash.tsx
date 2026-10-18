import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Brand from '@/components/Brand';
import { useHealth } from '@/lib/health';

export default function Splash() {
  const { session, ready, profile, profileLoading } = useHealth();
  const [delayFinished, setDelayFinished] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = window.setTimeout(() => setDelayFinished(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!delayFinished || !ready || (session && profileLoading)) return;
    navigate(!session ? '/auth' : profile.onboarded ? '/dashboard' : '/onboarding', { replace: true });
  }, [delayFinished, ready, session, profileLoading, profile.onboarded, navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="page-enter"><Brand /></div>
      <p className="mt-6 text-sm text-muted-foreground">Eat with intention. Live with purpose.</p>
      <div role="status" className="mt-10 flex items-center gap-2 text-xs text-primary">
        <Loader2 size={18} className="animate-spin motion-reduce:animate-none" />
        <span>Opening your wellness space…</span>
      </div>
    </main>
  );
}
