export const MISSION_DURATION_SECONDS = 90;

export function getMissionSecondsLeft(endTimeMs: number, nowMs: number) {
  if (!Number.isFinite(endTimeMs) || !Number.isFinite(nowMs)) {
    return 0;
  }

  return Math.max(0, Math.ceil((endTimeMs - nowMs) / 1_000));
}

export function formatMissionTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, '0')}`;
}
