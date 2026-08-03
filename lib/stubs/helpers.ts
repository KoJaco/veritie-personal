// Helper functions for generating stub data

export function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substring(2, 9)}`;
}

export function randomDate(daysFromNow: number, baseDate = new Date()): string {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
}

export function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomBoolean(probability = 0.5): boolean {
  return Math.random() < probability;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
