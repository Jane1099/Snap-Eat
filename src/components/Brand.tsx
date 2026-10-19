import { Leaf } from 'lucide-react';

export default function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5" aria-label="Snap Eat">
    <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-primary text-primary-foreground"><Leaf size={24} strokeWidth={2.4} /></div>
    {!compact && <span className="text-[23px] font-bold tracking-[-1px]">Snap <span className="text-primary">Eat</span></span>}
  </div>;
}
