import lv1 from '@/imports/lv1.png';
import lv2 from '@/imports/lv2.png';
import lv3 from '@/imports/lv3.png';
import lv4 from '@/imports/lv4.png';
import lv5 from '@/imports/lv5.png';
import lv6 from '@/imports/lv6.png';
import lv7 from '@/imports/lv7.png';
import lv8 from '@/imports/lv8.png';
import lv9 from '@/imports/lv9.png';
import lv10 from '@/imports/lv10.png';

export const avatars: Record<number, string> = {
  1: lv1,
  2: lv2,
  3: lv3,
  4: lv4,
  5: lv5,
  6: lv6,
  7: lv7,
  8: lv8,
  9: lv9,
  10: lv10,
};

export const LEVEL_THRESHOLDS = [0, 25, 75, 150, 300, 600, 1000, 1500, 2000, 3000, Infinity];

export function getLevel(points: number): number {
  if (points >= 3000) return 10;
  if (points >= 2000) return 9;
  if (points >= 1500) return 8;
  if (points >= 1000) return 7;
  if (points >= 600) return 6;
  if (points >= 300) return 5;
  if (points >= 150) return 4;
  if (points >= 75) return 3;
  if (points >= 25) return 2;
  return 1;
}

export function getLevelProgress(points: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[10]!;
  if (nextThreshold === Infinity) return 100;
  return Math.min(100, Math.round(((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
}

export function getNextLevelPoints(level: number): number {
  return LEVEL_THRESHOLDS[level] === Infinity ? LEVEL_THRESHOLDS[9]! : (LEVEL_THRESHOLDS[level] ?? 9999);
}
