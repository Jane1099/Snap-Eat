import { Entry, Profile } from './health';

export function bodyFatEstimate(data: Record<string, unknown>, gender: string): number | null {
  const waist = Number(data.waist); const neck = Number(data.neck); const height = Number(data.height); const hips = Number(data.hips);
  if (height <= 0 || waist <= 0 || neck <= 0 || !['male', 'female'].includes(gender)) return null;
  const circumference = gender === 'female' ? waist + hips - neck : waist - neck;
  if (circumference <= 0 || (gender === 'female' && hips <= 0)) return null;
  const estimate = gender === 'female'
    ? 163.205 * Math.log10(circumference / 2.54) - 97.684 * Math.log10(height / 2.54) - 78.387
    : 86.01 * Math.log10(circumference / 2.54) - 70.041 * Math.log10(height / 2.54) + 36.76;
  return Number.isFinite(estimate) && estimate > 0 && estimate < 70 ? Math.round(estimate * 10) / 10 : null;
}

export function progressAssessment(logs: Entry[], profile: Profile, days: number) {
  const end = logs.at(-1);
  if (!end) return 'Log your starting point and measure at a consistent time each week.';
  const cutoff = new Date(`${end.entry_date}T12:00:00`); cutoff.setDate(cutoff.getDate() - days);
  const window = logs.filter(e => new Date(`${e.entry_date}T12:00:00`) >= cutoff);
  const start = window[0];
  const span = (new Date(end.entry_date).getTime() - new Date(start.entry_date).getTime()) / 86400000;
  if (window.length < 2 || span < days * .6) return `Not enough spaced measurements for a ${days === 7 ? 'weekly' : 'monthly'} assessment yet. Keep logging consistently.`;
  const change = Number(end.data.weight) - Number(start.data.weight);
  const changeText = `${change > 0 ? '+' : ''}${change.toFixed(1)} kg across ${Math.round(span)} days`;
  if (Math.abs(change) < .2) return `${changeText}. Your recorded weight is broadly stable. Review meal consistency, sleep and training before changing your targets.`;
  if (profile.goal === 'Maintenance') return `${changeText}. Compare this trend with your usual range. Short-term changes can reflect water and digestion.`;
  const aligned = profile.goal === 'Weight loss' ? change < 0 : change > 0;
  return `${changeText}. ${aligned ? 'The recorded trend is aligned with your goal. Keep habits consistent and recovery in focus.' : 'The recorded trend is opposite to your goal. Check portion logging and your activity pattern before making a modest adjustment.'} This is not a body-composition diagnosis.`;
}
