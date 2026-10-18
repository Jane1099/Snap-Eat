import { supabase } from '@/integrations/supabase/client';
import { ImportedRoutine, importedRoutinesSchema, cloneWorkout, WorkoutItem } from '@/lib/workouts';
export async function askWorkoutAI(body: Record<string, unknown>): Promise<ImportedRoutine[]> {
  const { data, error } = await supabase.functions.invoke('mind-eat-workouts', { body });
  if (error) {
    let message = error.message;
    if (error.context instanceof Response) { try { message = (await error.context.json()).error || message; } catch {} }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  const parsed = importedRoutinesSchema.safeParse(data);
  if (!parsed.success) throw new Error('AI returned incomplete workout details. Please try again.');
  return parsed.data.routines.map(routine => ({ name: routine.name, items: cloneWorkout(routine.items.map(item => ({ ...item, source: 'Gemini estimate' } as WorkoutItem))) }));
}
