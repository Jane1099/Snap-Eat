import { Link } from 'react-router-dom';
import { ArrowUpRight, Beef, Droplets, GlassWater, Wheat } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DailyNutritionCardProps {
  calories: number;
  burned: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;
  calorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatGoal: number;
  waterGoal: number;
}

export default function DailyNutritionCard(props: DailyNutritionCardProps) {
  const net = props.calories - props.burned;
  const remaining = props.calorieGoal - net;
  const progress = Math.min(Math.max(net / props.calorieGoal, 0), 1);
  const macros = [
    { name: 'Protein', value: props.protein, goal: props.proteinGoal, unit: 'g', icon: Beef, color: 'bg-purple-500', iconColor: 'text-purple-500' },
    { name: 'Carbs', value: props.carbs, goal: props.carbsGoal, unit: 'g', icon: Wheat, color: 'bg-amber-500', iconColor: 'text-amber-500' },
    { name: 'Fat', value: props.fat, goal: props.fatGoal, unit: 'g', icon: Droplets, color: 'bg-primary', iconColor: 'text-primary' },
    { name: 'Water', value: props.water / 1000, goal: props.waterGoal / 1000, unit: 'L', icon: GlassWater, color: 'bg-blue-500', iconColor: 'text-blue-500' },
  ];

  return <section aria-label="Daily calories and nutrition" className="overflow-hidden rounded-[28px] border border-primary/20 bg-primary shadow-sm">
    <div className="p-5 text-primary-foreground sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-semibold sm:text-sm">Daily Calorie Goal</h2>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-4xl font-bold tracking-tight tabular-nums sm:text-5xl">{Math.abs(Math.round(remaining)).toLocaleString()}</span>
            <span className="text-sm font-medium">kcal {remaining < 0 ? 'over goal' : 'left'}</span>
          </p>
        </div>
        <div className="relative h-20 w-20 shrink-0" role="img" aria-label={`${Math.round(progress * 100)} percent of net calorie goal`}>
          <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="5" />
            <circle cx="40" cy="40" r="33" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray={`${progress * 207.35} 207.35`} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-base font-bold tabular-nums">{Math.round(progress * 100)}%</span><span className="mt-0.5 text-[8px] font-medium">net goal</span></div>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-4 gap-1 divide-x divide-primary-foreground/15">
        {[{ label: 'Goal', value: props.calorieGoal }, { label: 'Consumed', value: props.calories }, { label: 'Burned', value: props.burned }, { label: 'Net calories', value: net }].map(stat => <div key={stat.label} className="text-center"><p className="text-[10px] font-medium sm:text-xs">{stat.label}</p><p className="mt-1.5 text-sm font-bold tabular-nums sm:text-lg">{Math.round(stat.value).toLocaleString()}</p></div>)}
      </div>
      <p className="mt-3 text-center text-[10px] font-medium">Net = consumed − burned · all values in kcal</p>
    </div>
    <div className="rounded-t-[28px] bg-card p-5 text-card-foreground sm:p-6">
      <div className="mb-5 flex items-center justify-between"><h2 className="text-base font-semibold">Macros Today</h2><Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"><Link to="/profile" aria-label="Edit nutrition goals"><ArrowUpRight size={17} /></Link></Button></div>
      <div className="space-y-5">
        {macros.map(macro => <div key={macro.name}>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs sm:text-sm"><span className="flex items-center gap-2 font-medium"><macro.icon size={16} className={macro.iconColor} />{macro.name}</span><span className="tabular-nums"><span className="font-semibold">{macro.unit === 'L' ? macro.value.toFixed(2) : Math.round(macro.value)}{macro.unit}</span><span className="text-muted-foreground"> / {macro.goal}{macro.unit}</span></span></div>
          <div role="progressbar" aria-label={`${macro.name} daily goal`} aria-valuemin={0} aria-valuemax={macro.goal} aria-valuenow={Math.min(macro.value, macro.goal)} aria-valuetext={`${macro.value.toFixed(1)} ${macro.unit} of ${macro.goal} ${macro.unit}`} className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full transition-[width] duration-300 motion-reduce:transition-none ${macro.color}`} style={{ width: `${Math.min(macro.value / macro.goal * 100, 100)}%` }} /></div>
        </div>)}
      </div>
    </div>
  </section>;
}
