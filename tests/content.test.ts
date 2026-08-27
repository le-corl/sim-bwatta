import assert from 'node:assert/strict';
import test from 'node:test';

import { CORE_MESSAGES } from '../src/game/coreMessages.ts';
import { MISSIONS } from '../src/game/missions.ts';
import { getGoldenCoreProbability, ROLL_VISUAL_CONFIG } from '../src/game/rollVisualConfig.ts';

test('mission content has 15 unique and complete items', () => {
  assert.equal(MISSIONS.length, 15);
  assert.equal(new Set(MISSIONS.map((mission) => mission.id)).size, MISSIONS.length);
  assert.equal(new Set(MISSIONS.map((mission) => mission.title)).size, MISSIONS.length);
  assert.ok(MISSIONS.every((mission) => mission.id.length > 0 && mission.title.length > 0 && mission.detail.length > 0));
});

test('core message content has 15 unique items', () => {
  assert.equal(CORE_MESSAGES.length, 15);
  assert.equal(new Set(CORE_MESSAGES).size, CORE_MESSAGES.length);
  assert.ok(CORE_MESSAGES.every((message) => message.trim().length > 0));
});

test('golden core chance is configured as a clamped percentage out of 100', () => {
  assert.equal(getGoldenCoreProbability(), ROLL_VISUAL_CONFIG.goldenCoreChancePercent / 100);
  assert.equal(getGoldenCoreProbability(-1), 0);
  assert.equal(getGoldenCoreProbability(15), 0.15);
  assert.equal(getGoldenCoreProbability(100), 1);
  assert.equal(getGoldenCoreProbability(101), 1);
});
