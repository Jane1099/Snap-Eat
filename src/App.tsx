import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { HealthProvider, useHealth } from '@/lib/health';
import AppShell from '@/components/AppShell';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import LogFood from '@/pages/LogFood';
import FoodDiary from '@/pages/FoodDiary';
import Exercise from '@/pages/Exercise';
import Measurements from '@/pages/Measurements';
import AICoach from '@/pages/AICoach';
import WeeklyReport from '@/pages/WeeklyReport';
import Favorites from '@/pages/Favorites';
import Notifications from '@/pages/Notifications';
import Splash from '@/pages/Splash';
import NotFound from '@/pages/NotFound';
import PWAStatus from '@/components/PWAStatus';

const queryClient = new QueryClient();
function PrivateLayout({ onboarding = false }: { onboarding?: boolean }) {
  const { session, ready, profile, profileLoading, profileError } = useHealth();
  if (!ready || (session && profileLoading)) return <div className="flex min-h-screen items-center justify-center text-primary">Opening your wellness space…</div>;
  if (!session) return <Navigate to="/auth" replace />;
  if (profileError) return <div className="mx-auto mt-12 max-w-md rounded-2xl border border-border bg-card p-6"><h1 className="text-xl font-semibold">Your profile couldn’t be loaded.</h1><p className="mt-3 text-sm text-muted-foreground">Check your connection and retry. Your saved goals have not been changed.</p><button className="action mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['profile'] })}>Retry</button></div>;
  if (!onboarding && !profile.onboarded) return <Navigate to="/onboarding" replace />;
  return <AppShell><Outlet /></AppShell>;
}
function Home() {
  const { session, ready } = useHealth();
  if (!ready) return <div className="p-8 text-primary">Loading Mind Eat…</div>;
  return session ? <Navigate to="/dashboard" replace /> : <AppShell><Index /></AppShell>;
}
export default function App() {
  return <QueryClientProvider client={queryClient}><HealthProvider><TooltipProvider><Toaster /><Sonner /><BrowserRouter><PWAStatus /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/splash" element={<Splash />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/auth/callback" element={<Auth />} />
    <Route path="/auth/reset-password" element={<Auth />} />
    <Route element={<PrivateLayout onboarding />}><Route path="/onboarding" element={<Profile onboarding />} /></Route>
    <Route element={<PrivateLayout />}>
      <Route path="/dashboard" element={<Index />} />
      <Route path="/food-log" element={<FoodDiary />} />
      <Route path="/food-log/:mealType" element={<FoodDiary />} />
      <Route path="/log-food" element={<LogFood />} />
      <Route path="/food-detail/:foodId" element={<LogFood />} />
      <Route path="/exercise" element={<Exercise />} />
      <Route path="/measurements" element={<Measurements />} />
      <Route path="/ai-coach" element={<AICoach />} />
      <Route path="/weekly-report" element={<WeeklyReport />} />
      <Route path="/favorites" element={<Favorites />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/profile" element={<Profile />} />
    </Route>
    <Route path="*" element={<NotFound />} />
  </Routes></BrowserRouter></TooltipProvider></HealthProvider></QueryClientProvider>;
}
