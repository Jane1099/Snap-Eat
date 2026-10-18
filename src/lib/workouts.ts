import { z } from 'zod';
import { ExerciseDefinition, ExerciseType, exerciseCatalog } from '@/lib/exercises';

export type WorkingSet = { reps: number; weight: number };
export type WorkoutItem = ExerciseDefinition & { itemId: string; sets: WorkingSet[]; duration: number; distance: number; intensity: 'Low' | 'Moderate' | 'High'; restSeconds: number };
export const workoutItemSchema = z.object({
  name: z.string().trim().min(1).max(150), type: z.enum(['Strength', 'Cardio', 'Mobility', 'Sports']),
  met: z.number().finite().min(1).max(20), muscle: z.string().max(150), equipment: z.string().max(150), description: z.string().max(1000),
  sets: z.array(z.object({ reps: z.number().int().min(1).max(1000), weight: z.number().finite().min(0).max(1000) })).max(40),
  duration: z.number().finite().min(0).max(600), distance: z.number().finite().min(0).max(1000),
  intensity: z.enum(['Low', 'Moderate', 'High']), restSeconds: z.number().int().min(0).max(600),
}).refine(item => item.type === 'Strength' ? item.sets.length > 0 : item.duration > 0, 'Check sets or duration.');
export const workoutSchema = z.array(workoutItemSchema).min(1).max(60);
export const importedRoutinesSchema = z.object({ routines: z.array(z.object({ name: z.string().min(1).max(120), items: workoutSchema })).min(1).max(7) });
export type ImportedRoutine = { name: string; items: WorkoutItem[] };
export function makeWorkoutItem(exercise: ExerciseDefinition): WorkoutItem {
  return { ...exercise, itemId: crypto.randomUUID(), sets: exercise.type === 'Strength' ? Array.from({ length: 3 }, () => ({ reps: 10, weight: 0 })) : [], duration: 30, distance: 0, intensity: 'Moderate', restSeconds: 60 };
}
export function cloneWorkout(items: WorkoutItem[]): WorkoutItem[] {
  return items.map(item => ({ ...item, itemId: crypto.randomUUID(), sets: item.sets.map(set => ({ ...set })) }));
}
export function entryWorkout(data: Record<string, any>): WorkoutItem[] {
  if (Array.isArray(data.items)) return cloneWorkout(data.items);
  const definition = exerciseCatalog.find(e => e.name.toLowerCase() === String(data.name).toLowerCase());
  const type: ExerciseType = ['Cardio', 'Strength', 'Mobility', 'Sports'].includes(data.type) ? data.type : 'Mobility';
  const item = makeWorkoutItem(definition || { name: data.name || 'Activity', type, met: data.met || (type === 'Strength' ? 5 : 3.5), muscle: 'Full body', equipment: 'Unspecified', description: 'Imported from an older log.' });
  item.duration = Number(data.duration) || 30; item.distance = Number(data.distance) || 0;
  item.intensity = ['Low', 'Moderate', 'High'].includes(data.intensity) ? data.intensity : 'Moderate';
  if (item.type === 'Strength') item.sets = Array.from({ length: Math.min(40, Math.max(1, Number(data.sets) || 3)) }, () => ({ reps: Number(data.reps) || 10, weight: Number(data.weight) || 0 }));
  return [item];
}
export function workoutEstimate(item: WorkoutItem, bodyWeight: number) {
  const effort = item.intensity === 'Low' ? 0.8 : item.intensity === 'High' ? 1.25 : 1;
  if (item.type === 'Strength') {
    const reps = item.sets.reduce((sum, set) => sum + set.reps, 0);
    const activeMinutes = reps * 3 / 60;
    const restMinutes = Math.max(0, item.sets.length - 1) * item.restSeconds / 60;
    const averageLoad = reps ? item.sets.reduce((sum, set) => sum + set.weight * set.reps, 0) / reps : 0;
    // A bounded load proxy, not a validated energy-from-tonnage formula.
    const loadFactor = 1 + Math.min(0.2, averageLoad / Math.max(1, bodyWeight) * 0.15);
    const met = Math.min(8, Math.max(3, item.met * effort * loadFactor));
    const calories = (met * activeMinutes + 1.5 * restMinutes) * 3.5 * bodyWeight / 200;
    return { calories: Number(calories.toFixed(1)), minutes: Number((activeMinutes + restMinutes).toFixed(1)), met, volume: item.sets.reduce((sum, set) => sum + set.reps * set.weight, 0) };
  }
  let met = item.met;
  const speed = item.duration > 0 ? item.distance / item.duration * 60 : 0;
  const name = item.name.toLowerCase();
  if (speed > 0 && /run|jogg|walk|hiking/.test(name)) {
    met = /walk|hiking/.test(name) ? Math.min(8, Math.max(2, 1.5 + speed * 0.5)) : Math.min(18, Math.max(4, speed));
  } else if (speed > 0 && /cycl|bike|biking/.test(name)) met = Math.min(16, Math.max(3, 2 + speed * 0.25));
  else if (speed > 0 && /swim/.test(name)) met = Math.min(12, Math.max(4, 3 + speed * 2));
  met = Math.max(1, Math.min(20, met * effort));
  return { calories: Number((met * 3.5 * bodyWeight / 200 * item.duration).toFixed(1)), minutes: item.duration, met, volume: 0 };
}
export function workoutData(items: WorkoutItem[], bodyWeight: number, name: string, planned = false) {
  const calculated = items.map(item => {
    const estimate = workoutEstimate(item, bodyWeight);
    return { ...item, calories: estimate.calories, minutes: estimate.minutes, volume: estimate.volume, estimated_met: estimate.met };
  });
  const calories = Number(calculated.reduce((sum, item) => sum + item.calories, 0).toFixed(1));
  return { name, type: 'Workout', status: planned ? 'planned' : 'completed', items: calculated,
    weight_at_log: bodyWeight, duration: Number(calculated.reduce((sum, item) => sum + item.minutes, 0).toFixed(1)),
    estimated_calories: calories,
    calories: planned ? 0 : calories,
    intensity: 'Itemized', calculation: 'MET estimate; strength time and load are approximate',
  };
}
