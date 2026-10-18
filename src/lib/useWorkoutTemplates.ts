import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useHealth } from '@/lib/health';
import { WorkoutItem, workoutSchema } from '@/lib/workouts';
export type WorkoutTemplate = { id: string; name: string; items: WorkoutItem[]; weekdays: number[] };
export function useWorkoutTemplates() {
  const { session } = useHealth(); const qc = useQueryClient();
  const query = useQuery({ queryKey: ['workout-templates', session?.user.id], enabled: !!session, queryFn: async () => {
    const { data, error } = await supabase.from('workout_templates').select('id,name,items,weekdays').eq('user_id', session!.user.id).order('created_at');
    if (error) throw error; return (data || []) as WorkoutTemplate[];
  } });
  const save = async (name: string, items: WorkoutItem[], weekdays: number[] = []) => {
    if (!session || !name.trim() || name.trim().length > 120 || !workoutSchema.safeParse(items).success) throw new Error('Give your template a name and check all exercises.');
    const { error } = await supabase.from('workout_templates').insert({ user_id: session.user.id, name: name.trim(), items, weekdays });
    if (error) throw error; await qc.invalidateQueries({ queryKey: ['workout-templates'] });
  };
  const updateDays = async (id: string, weekdays: number[]) => {
    if (!session) return;
    const { error } = await supabase.from('workout_templates').update({ weekdays }).eq('id', id).eq('user_id', session.user.id);
    if (error) throw error; await qc.invalidateQueries({ queryKey: ['workout-templates'] });
  };
  const remove = async (id: string) => {
    if (!session) return;
    const { error } = await supabase.from('workout_templates').delete().eq('id', id).eq('user_id', session.user.id);
    if (error) throw error; await qc.invalidateQueries({ queryKey: ['workout-templates'] });
  };
  return { ...query, templates: query.data || [], save, updateDays, remove };
}
