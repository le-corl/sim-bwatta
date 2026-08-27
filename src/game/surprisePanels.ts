import { ROLL_VISUAL_CONFIG } from './rollVisualConfig.ts';

export type SurprisePanelContent = {
  id: string;
  kind: 'text' | 'stamp' | 'eyes' | 'paw';
  text?: string;
  tiltDegrees: number;
};

export type SurprisePanelPlan = {
  content: SurprisePanelContent;
  panelIndex: number;
};

export const SURPRISE_PANEL_CONTENTS: readonly SurprisePanelContent[] = [
  { id: 'dud', kind: 'stamp', text: '꽝', tiltDegrees: -8 },
  { id: 'saw-you', kind: 'text', text: '봤지?', tiltDegrees: 5 },
  { id: 'why', kind: 'text', text: '왜?', tiltDegrees: -5 },
  { id: 'not-it', kind: 'stamp', text: '아님', tiltDegrees: 7 },
  { id: 'secret', kind: 'stamp', text: '비밀', tiltDegrees: -6 },
  { id: 'censored', kind: 'stamp', text: '검열', tiltDegrees: 4 },
  { id: 'eyes', kind: 'eyes', tiltDegrees: 3 },
  { id: 'paw', kind: 'paw', tiltDegrees: -9 },
  { id: 'one-more', kind: 'text', text: '한 칸 더', tiltDegrees: -3 },
  { id: 'empty', kind: 'text', text: '텅', tiltDegrees: 8 },
] as const;

// 22.2~33.3%, 72.2~83.3%: mission checkpoints and the 88% finish fade are avoided.
export const SURPRISE_PANEL_INDEXES = [4, 5, 6, 13, 14, 15] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function pickRandom<T>(items: readonly T[], random: () => number) {
  const index = Math.min(items.length - 1, Math.floor(clamp(random(), 0, 1) * items.length));
  return items[index] as T;
}

export function getSurprisePanelProbability(percent = ROLL_VISUAL_CONFIG.surprisePanelChancePercent) {
  return clamp(percent, 0, 100) / 100;
}

export function createSurprisePanelPlan(
  completedSurpriseHistory: readonly boolean[],
  random: () => number = Math.random,
): SurprisePanelPlan | null {
  const isFirstCompletedRun = completedSurpriseHistory.length === 0;
  const cooldownRounds = Math.max(0, Math.floor(ROLL_VISUAL_CONFIG.surprisePanelCooldownRounds));
  const isCoolingDown = completedSurpriseHistory.slice(0, cooldownRounds).some(Boolean);

  if (!isFirstCompletedRun && (isCoolingDown || random() >= getSurprisePanelProbability())) {
    return null;
  }

  return {
    content: pickRandom(SURPRISE_PANEL_CONTENTS, random),
    panelIndex: pickRandom(SURPRISE_PANEL_INDEXES, random),
  };
}
