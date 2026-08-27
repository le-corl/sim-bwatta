import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createSurprisePanelPlan,
  getSurprisePanelProbability,
  SURPRISE_PANEL_CONTENTS,
  SURPRISE_PANEL_INDEXES,
} from '../src/game/surprisePanels.ts';
import { ROLL_VISUAL_CONFIG } from '../src/game/rollVisualConfig.ts';

function randomSequence(...values: number[]) {
  let index = 0;
  return () => values[Math.min(index++, values.length - 1)] ?? 0;
}

test('the first completed run always receives one random surprise panel', () => {
  const plan = createSurprisePanelPlan([], randomSequence(0.99, 0.99));

  assert.ok(plan !== null);
  assert.equal(plan.content.id, SURPRISE_PANEL_CONTENTS.at(-1)?.id);
  assert.equal(plan.panelIndex, SURPRISE_PANEL_INDEXES.at(-1));
});

test('a surprise panel forces the next completed round into cooldown', () => {
  assert.equal(createSurprisePanelPlan([true], () => 0), null);
});

test('eligible later rounds use the configured 35 percent boundary', () => {
  const appears = createSurprisePanelPlan([false], randomSequence(0.349, 0, 0));
  const absent = createSurprisePanelPlan([false], () => 0.35);

  assert.ok(appears !== null);
  assert.equal(absent, null);
  assert.equal(getSurprisePanelProbability(), ROLL_VISUAL_CONFIG.surprisePanelChancePercent / 100);
});

test('surprise content and safe panel slots are unique and complete', () => {
  assert.equal(new Set(SURPRISE_PANEL_CONTENTS.map((content) => content.id)).size, SURPRISE_PANEL_CONTENTS.length);
  assert.equal(new Set(SURPRISE_PANEL_INDEXES).size, SURPRISE_PANEL_INDEXES.length);
  assert.ok(SURPRISE_PANEL_CONTENTS.every((content) => content.id.length > 0));
  assert.ok(SURPRISE_PANEL_INDEXES.every((index) => index >= 4 && index <= 15 && ![7, 8, 9, 10, 11, 12].includes(index)));
});
