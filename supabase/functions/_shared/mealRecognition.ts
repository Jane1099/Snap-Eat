export const recognitionResponseSchema = {
  type: 'OBJECT', required: ['items', 'error'],
  properties: {
    error: { type: 'STRING', nullable: true, description: 'Null on success, otherwise reason no food is identifiable.' },
    items: {
      type: 'ARRAY', maxItems: 40,
      description: 'Separate visible foods, never a combined plate. Empty if no identifiable food.',
      items: {
        type: 'OBJECT', required: ['name', 'serving', 'quantity', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
        properties: {
          name: { type: 'STRING', description: 'Individual dish name, at most 150 characters.' },
          serving: { type: 'STRING', description: 'One base unit with estimated weight, e.g. 1 idli · 40 g or 1 bowl · 150 g. At most 100 characters.' },
          quantity: { type: 'NUMBER', description: 'Number of base serving units visible in the photo, > 0 and <= 100. May be fractional.' },
          calories: { type: 'NUMBER', description: 'Estimated kcal for ONE base unit, before multiplying by quantity.' },
          protein: { type: 'NUMBER', description: 'Grams for ONE base unit.' },
          carbs: { type: 'NUMBER', description: 'Grams for ONE base unit.' },
          fat: { type: 'NUMBER', description: 'Grams for ONE base unit.' },
          fiber: { type: 'NUMBER', nullable: true, description: 'Grams per base unit or null if unknown.' },
          sugar: { type: 'NUMBER', nullable: true, description: 'Grams per base unit or null if unknown.' },
          sodium: { type: 'NUMBER', nullable: true, description: 'Milligrams per base unit or null if unknown.' },
          confidence: { type: 'NUMBER', description: 'Identification estimate 0–1; not calibrated.' },
        },
      },
    },
  },
};

export function normalizeRecognizedItems(rawItems: unknown) {
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > 40) return null;
  const items: Record<string, string | number>[] = [];
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') return null;
    const item: Record<string, string | number> = {};
    for (const [field, max] of [['name', 150], ['serving', 100]] as const) {
      const value = raw[field];
      if (typeof value !== 'string' || !value.trim() || value.trim().length > max) return null;
      item[field] = value.trim();
    }
    for (const [field, min, max, required] of [
      ['quantity', 0.01, 100, true], ['calories', 0, 10000, true], ['protein', 0, 1000, true],
      ['carbs', 0, 2000, true], ['fat', 0, 1000, true], ['confidence', 0, 1, true],
      ['fiber', 0, 1000, false], ['sugar', 0, 2000, false], ['sodium', 0, 50000, false],
    ] as const) {
      const value = raw[field];
      if (value == null && !required) continue;
      const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
      if (!Number.isFinite(number) || number < min || number > max) return null;
      item[field] = number;
    }
    items.push(item);
  }
  return items;
}
