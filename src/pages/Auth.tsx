import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Auth as SupabaseAuth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { supabase } from '@/integrations/supabase/client';
import { useHealth } from '@/lib/health';
import Brand from '@/components/Brand';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Leaf, Globe, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const nativeRedirect = 'com.janethomas.snapeat://';
const exchangedNativeCodes = new Set<string>();

export default function AuthPage() {
  const { session, profile, profileLoading, profileError } = useHealth(); const nav = useNavigate(); const location = useLocation();
  const reset = location.pathname === '/auth/reset-password'; const callback = location.pathname === '/auth/callback';
  const [view, setView] = useState<'sign_in' | 'sign_up'>('sign_in'); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [email, setEmail] = useState(''); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const native = Capacitor.isNativePlatform();
  const redirectTo = native ? nativeRedirect : new URL('/auth/callback', window.location.origin).href;
  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
      if (error) throw error;
      if (!data.url) throw new Error('Google sign-in did not return a login URL. Please try again.');
      if (Capacitor.isNativePlatform()) await Browser.open({ url: data.url });
      else window.location.assign(data.url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open Google sign-in.');
    } finally { setBusy(false); }
  };
  useEffect(() => { if (session && !profileLoading && !profileError && !reset) nav(profile.onboarded ? '/dashboard' : '/onboarding', { replace: true }); }, [session, profile.onboarded, profileLoading, profileError, reset, nav]);
  useEffect(() => {
    if (!callback && !reset) return;
    const params = new URLSearchParams(window.location.search); const error = params.get('error_description'); if (error) toast.error(error);
    const code = params.get('code'); if (code) supabase.auth.exchangeCodeForSession(code).then(({ error }) => { if (error) toast.error(error.message); });
  }, [callback, reset]);
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;
    const handleDeepLink = async ({ url }: { url: string }) => {
      if (!active) return;
      let link: URL;
      try { link = new URL(url); } catch { return; }
      if (link.protocol !== 'com.janethomas.snapeat:') return;
      // Android custom tabs may not support programmatic closing; still exchange the code.
      await Browser.close().catch(() => undefined);
      if (!active) return;
      const oauthError = link.searchParams.get('error_description') || link.searchParams.get('error');
      if (oauthError) { toast.error(oauthError); return; }
      const code = link.searchParams.get('code');
      if (!code) { toast.error('The sign-in link has no authorization code. Please try Google sign-in again.'); return; }
      if (exchangedNativeCodes.has(code)) return;
      exchangedNativeCodes.add(code);
      setBusy(true);
      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Could not complete Google sign-in.');
      } finally { if (active) setBusy(false); }
    };
    const listener = App.addListener('appUrlOpen', handleDeepLink);
    void listener.then(async () => {
      if (!active) return;
      const launch = await App.getLaunchUrl();
      if (launch?.url) await handleDeepLink(launch);
    }).catch(error => { if (active) toast.error(error instanceof Error ? error.message : 'Could not listen for the sign-in callback.'); });
    return () => { active = false; void listener.then(handle => handle.remove()).catch(() => undefined); };
  }, []);
  return <div className="grid min-h-screen lg:grid-cols-2"><div className="relative hidden overflow-hidden bg-card lg:block"><img src="/assets/indian-thali.png" alt="Balanced Indian meal" className="absolute inset-0 h-full w-full object-cover opacity-40" /><div className="relative flex h-full flex-col justify-between p-14"><Brand /><div><span className="eyebrow text-primary">YOUR HEALTH. YOUR WAY.</span><h1 className="mt-5 max-w-md text-5xl font-semibold leading-[1.15] tracking-tight">Eat with intention.<br />Live with purpose.</h1><p className="mt-6 max-w-sm text-sm leading-relaxed text-white/80">Food that feels like home. Tracking that fits your life. Meet your new mindful companion.</p></div><p className="flex items-center gap-2 text-xs text-white/80"><ShieldCheck size={16} />Private by design. Your health data belongs to you.</p></div></div><div className="flex flex-col p-6 sm:p-12"><Link to="/" className="mb-12 flex items-center gap-2 text-xs text-muted-foreground"><ArrowLeft size={15} />Back to overview</Link><div className="mx-auto my-auto w-full max-w-sm"><div className="mb-8 lg:hidden"><Brand /></div><div className="mb-6 w-fit rounded-2xl bg-primary/10 p-3 text-primary"><Leaf size={25} /></div><h2 className="text-3xl font-semibold tracking-tight">{reset ? 'Reset your password' : 'A healthier chapter starts here.'}</h2><p className="mb-8 mt-3 text-sm text-muted-foreground">{reset ? session ? 'Choose a new password for your account.' : 'We’ll email you a secure recovery link.' : 'Sign in or create your personal wellness space.'}</p>
    {reset ? session ? <form onSubmit={async e => { e.preventDefault(); if (password !== confirm) { toast.error('Passwords must match.'); return; } setBusy(true); const { error } = await supabase.auth.updateUser({ password }); setBusy(false); if (error) toast.error(error.message); else { toast.success('Password updated'); nav('/dashboard'); } }}><label className="text-sm">New password<input className="field my-3" type="password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" /></label><label className="text-sm">Confirm password<input className="field my-3" type="password" minLength={8} required value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" /></label><button disabled={busy} className="action w-full">Update password</button></form> : <form onSubmit={async e => { e.preventDefault(); setBusy(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: new URL('/auth/reset-password', window.location.origin).href }); setBusy(false); if (error) toast.error(error.message); else setSent(true); }}><label className="text-sm">Email<input className="field my-3" type="email" required value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" /></label><button disabled={busy} className="action w-full">Send recovery link</button>{sent && <p role="status" className="mt-4 text-sm text-primary">Check your inbox for the recovery link if this email has an account.</p>}<Link className="mt-5 block text-center text-xs text-primary" to="/auth">Back to sign in</Link></form> : <>
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">{([{ value: 'sign_in', label: 'Log in' }, { value: 'sign_up', label: 'Sign up' }] as const).map(tab => <button key={tab.value} className={`rounded-lg py-2.5 text-sm ${view === tab.value ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`} onClick={() => setView(tab.value)}>{tab.label}</button>)}</div>
      <Button type="button" variant="outline" className="mb-4 h-12 w-full rounded-xl border-border bg-card text-foreground hover:bg-secondary" disabled={busy} onClick={signInWithGoogle}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}Continue with Google</Button>
      <div className="mb-4 flex items-center gap-3 text-[11px] text-muted-foreground"><span className="h-px flex-1 bg-border" />or continue with email<span className="h-px flex-1 bg-border" /></div>
      <SupabaseAuth key={view} supabaseClient={supabase} providers={[]} showLinks={false} redirectTo={redirectTo} view={view} theme="dark" appearance={{ theme: ThemeSupa, variables: { default: { colors: { brand: 'hsl(var(--primary))', brandAccent: 'hsl(var(--primary))', brandButtonText: 'hsl(var(--primary-foreground))', defaultButtonBackground: 'hsl(var(--card))', defaultButtonBackgroundHover: 'hsl(var(--secondary))', inputBackground: 'hsl(var(--background))', inputBorder: 'hsl(var(--input))', inputText: 'hsl(var(--foreground))', inputLabelText: 'hsl(var(--muted-foreground))', messageText: 'hsl(var(--foreground))', anchorTextColor: 'hsl(var(--primary-readable))' }, radii: { borderRadiusButton: '12px', buttonBorderRadius: '12px', inputBorderRadius: '12px' }, fonts: { bodyFontFamily: 'Inter, sans-serif', buttonFontFamily: 'Inter, sans-serif', inputFontFamily: 'Inter, sans-serif' } } } }} />
      {view === 'sign_in' && <Link className="mt-4 block text-center text-xs text-primary" to="/auth/reset-password">Forgot your password?</Link>}
    </>}
    <p className="mt-8 flex items-center justify-center gap-2 text-[11px] text-muted-foreground"><ShieldCheck size={14} />Secure sign-in. Private, cloud-synced health data.</p>
    {profileError && <p className="mt-4 text-xs text-red-400">Your profile could not load. Check your connection and retry.</p>}
    </div></div></div>;
}
