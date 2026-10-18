import { z } from 'zod';
import { Food, foodSchema, nutritionKeys } from '@/lib/food';

export const mealItemSchema = foodSchema.extend({ quantity: z.number().finite().min(0.01).max(100), confidence: z.number().min(0).max(1).optional() });
export const recognizedItemsSchema = z.array(mealItemSchema).min(1).max(40);
export type MealItem = Food & { itemId: string; quantity: number };
export function makeMealItem(food: Food, quantity = 1): MealItem {
  return { ...food, itemId: crypto.randomUUID(), quantity };
}
export function loggedMealItems(data: Record<string, any>): MealItem[] {
  if (Array.isArray(data.items)) return data.items.map(item => ({ ...item, itemId: item.itemId || crypto.randomUUID() }));
  // Legacy entries already contain scaled nutrition; treat their logged portion as one unit.
  return [makeMealItem({ ...data } as Food)];
}
export function mealData(items: MealItem[]) {
  const totals: Record<string, number> = {};
  for (const key of nutritionKeys) {
    if (items.length && items.every(item => item[key] != null)) {
      totals[key] = items.reduce((sum, item) => sum + Number(item[key]) * item.quantity, 0);
    }
  }
  return {
    ...totals,
    calories: totals.calories || 0, protein: totals.protein || 0, carbs: totals.carbs || 0, fat: totals.fat || 0,
    name: items.map(item => item.name).join(' + '),
    serving: `${items.length} ${items.length === 1 ? 'item' : 'items'} · ${items.map(item => `${item.quantity} × ${item.serving}`).join('; ')}`,
    items,
  };
}
export function validMeal(items: MealItem[]) {
  return recognizedItemsSchema.safeParse(items).success;
}
