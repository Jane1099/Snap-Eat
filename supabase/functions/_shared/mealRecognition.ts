export const recognitionResponseSchema = {
  type: 'object', required: ['items', 'error'],
  properties: {
    error: { type: ['string', 'null'] },
    items: {
      type: 'array',
      items: {
        type: 'object', required: ['name', 'serving', 'quantity', 'calories', 'protein', 'carbs', 'fat', 'confidence'],
        properties: {
          name: { type: 'string' },
          serving: { type: 'string' },
          quantity: { type: 'number' },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          fiber: { type: ['number', 'null'] },
          sugar: { type: ['number', 'null'] },
          sodium: { type: ['number', 'null'] },
          confidence: { type: 'number' },
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
