export type CompletionRecord = {
  id?: string;
  completedAt: string;
};

export type RefillStage = 'none' | '5m' | '30m' | '2h' | '5h';

export type RefillState = {
  productDayStartMs: number;
  nextResetAtMs: number;
  completedCount: number;
  nextRoundNumber: number;
  completedProductDayCount: number;
  cooldownDurationMs: number;
  cooldownMinutes: number;
  stage: RefillStage;
  lastCompletionId: string | null;
  availableAtMs: number | null;
  remainingMs: number;
  isLocked: boolean;
};

const MINUTE_MS = 60_000;
const PRODUCT_DAY_START_HOUR = 6;

export function getProductDayStartMs(nowMs: number): number {
  const now = new Date(nowMs);
  const boundary = new Date(now.getFullYear(), now.getMonth(), now.getDate(), PRODUCT_DAY_START_HOUR);

  if (nowMs < boundary.getTime()) {
    boundary.setDate(boundary.getDate() - 1);
  }

  return boundary.getTime();
}

export function getNextProductDayStartMs(productDayStartMs: number): number {
  const nextBoundary = new Date(productDayStartMs);
  nextBoundary.setDate(nextBoundary.getDate() + 1);
  return nextBoundary.getTime();
}

export function getCooldownDurationMs(completedCount: number): number {
  if (completedCount < 2) {
    return 0;
  }

  if (completedCount === 2) {
    return 5 * MINUTE_MS;
  }

  if (completedCount === 3) {
    return 30 * MINUTE_MS;
  }

  if (completedCount === 4) {
    return 2 * 60 * MINUTE_MS;
  }

  return 5 * 60 * MINUTE_MS;
}

export function getRefillStage(completedCount: number): RefillStage {
  if (completedCount < 2) {
    return 'none';
  }

  if (completedCount === 2) {
    return '5m';
  }

  if (completedCount === 3) {
    return '30m';
  }

  if (completedCount === 4) {
    return '2h';
  }

  return '5h';
}

export function getCompletedProductDayCount(entries: readonly CompletionRecord[], nowMs: number): number {
  const productDays = new Set<number>();

  entries.forEach((entry) => {
    const completedAtMs = Date.parse(entry.completedAt);

    if (Number.isFinite(completedAtMs) && completedAtMs <= nowMs) {
      productDays.add(getProductDayStartMs(completedAtMs));
    }
  });

  return productDays.size;
}

export function getRefillState(entries: readonly CompletionRecord[], nowMs: number): RefillState {
  const productDayStartMs = getProductDayStartMs(nowMs);
  const nextResetAtMs = getNextProductDayStartMs(productDayStartMs);
  const todayEntries = entries
    .map((entry) => ({ entry, completedAtMs: Date.parse(entry.completedAt) }))
    .filter(({ completedAtMs }) => Number.isFinite(completedAtMs) && completedAtMs >= productDayStartMs && completedAtMs <= nowMs)
    .sort((a, b) => b.completedAtMs - a.completedAtMs);
  const completedCount = todayEntries.length;
  const cooldownDurationMs = getCooldownDurationMs(completedCount);
  const latestCompletion = todayEntries[0];
  const availableAtMs = latestCompletion === undefined || cooldownDurationMs === 0
    ? null
    : Math.min(latestCompletion.completedAtMs + cooldownDurationMs, nextResetAtMs);
  const remainingMs = availableAtMs === null ? 0 : Math.max(0, availableAtMs - nowMs);

  return {
    productDayStartMs,
    nextResetAtMs,
    completedCount,
    nextRoundNumber: completedCount + 1,
    completedProductDayCount: getCompletedProductDayCount(entries, nowMs),
    cooldownDurationMs,
    cooldownMinutes: cooldownDurationMs / MINUTE_MS,
    stage: getRefillStage(completedCount),
    lastCompletionId: latestCompletion?.entry.id ?? null,
    availableAtMs,
    remainingMs,
    isLocked: remainingMs > 0,
  };
}

export function formatRemainingDuration(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}시간 ${minutes}분 남음`;
  }

  return `${minutes}분 ${seconds.toString().padStart(2, '0')}초 남음`;
}
