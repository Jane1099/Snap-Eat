import { z } from 'zod';
export const nutrients = [
  { key: 'fiber', label: 'Fiber', unit: 'g', max: 1000 },
  { key: 'sugar', label: 'Sugar', unit: 'g', max: 2000 },
  { key: 'saturated_fat', label: 'Saturated fat', unit: 'g', max: 1000 },
  { key: 'sodium', label: 'Sodium', unit: 'mg', max: 50000 },
  { key: 'cholesterol', label: 'Cholesterol', unit: 'mg', max: 10000 },
  { key: 'vitamin_a', label: 'Vitamin A', unit: 'µg', max: 100000 },
  { key: 'vitamin_c', label: 'Vitamin C', unit: 'mg', max: 10000 },
  { key: 'vitamin_d', label: 'Vitamin D', unit: 'µg', max: 10000 },
  { key: 'vitamin_b12', label: 'Vitamin B12', unit: 'µg', max: 10000 },
  { key: 'iron', label: 'Iron', unit: 'mg', max: 1000 },
  { key: 'calcium', label: 'Calcium', unit: 'mg', max: 50000 },
  { key: 'potassium', label: 'Potassium', unit: 'mg', max: 50000 },
] as const;
export type NutrientKey = typeof nutrients[number]['key'];
export type Food = { id?: string; name: string; category?: string; region?: string; aliases?: string[]; source?: string; serving: string; calories: number; protein: number; carbs: number; fat: number; confidence?: number; photo_path?: string } & Partial<Record<NutrientKey, number>>;
export const foodSchema = z.object({
  name: z.string().trim().min(1, 'Give your food a name.').max(150), serving: z.string().trim().min(1, 'Enter a serving size.').max(100),
  calories: z.number().min(0).max(10000), protein: z.number().min(0).max(1000), carbs: z.number().min(0).max(2000), fat: z.number().min(0).max(1000),
  ...Object.fromEntries(nutrients.map(n => [n.key, z.number().min(0).max(n.max).optional()])),
});
export const emptyFood: Food = { name: '', serving: '100 g', calories: 0, protein: 0, carbs: 0, fat: 0 };
export const nutritionKeys = ['calories', 'protein', 'carbs', 'fat', ...nutrients.map(n => n.key)] as const;
export function scaleFood(food: Record<string, any>, multiplier: number) {
  const data = { ...food, quantity: multiplier, serving: `${multiplier} × ${food.serving}` };
  for (const key of nutritionKeys) if (food[key] != null) data[key] = Number(food[key]) * multiplier;
  return data;
}
