import { NavLink } from 'react-router-dom';
import { Camera, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileNavigationProps {
  items: { to: string; mobile: string; icon: LucideIcon }[];
}

export default function MobileNavigation({ items }: MobileNavigationProps) {
  const renderItem = (item: MobileNavigationProps['items'][number]) => <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}><item.icon size={21} /><span>{item.mobile}</span></NavLink>;

  return <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 items-end gap-1 rounded-t-3xl border-t border-border bg-card px-2 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 shadow-lg lg:hidden">
    {items.slice(0, 2).map(renderItem)}
    <div className="flex min-w-0 flex-col items-center gap-1">
      <Button asChild className="-mt-7 h-[68px] w-[68px] shrink-0 rounded-[24px] border-4 border-card bg-primary p-0 text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"><NavLink to="/log-food?mode=camera" aria-label="Scan food"><Camera size={29} className="!h-7 !w-7" /></NavLink></Button>
      <span className="text-[10px] font-semibold text-primary">Scan food</span>
    </div>
    {items.slice(2).map(renderItem)}
  </nav>;
}
