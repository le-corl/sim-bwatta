import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatRemainingDuration,
  getCooldownDurationMs,
  getProductDayStartMs,
  getRefillState,
} from '../src/game/refillSchedule.ts';

const MINUTE_MS = 60_000;

function at(day: number, hour: number, minute = 0) {
  return new Date(2026, 7, day, hour, minute).getTime();
}

function entry(id: string, completedAtMs: number) {
  return { id, completedAt: new Date(completedAtMs).toISOString() };
}

test('product day changes at local 06:00', () => {
  assert.equal(getProductDayStartMs(at(26, 5, 59)), at(25, 6));
  assert.equal(getProductDayStartMs(at(26, 6)), at(26, 6));
});

test('first two rolls are consecutive and later cooldowns follow the ladder', () => {
  assert.equal(getCooldownDurationMs(0), 0);
  assert.equal(getCooldownDurationMs(1), 0);
  assert.equal(getCooldownDurationMs(2), 5 * MINUTE_MS);
  assert.equal(getCooldownDurationMs(3), 30 * MINUTE_MS);
  assert.equal(getCooldownDurationMs(4), 2 * 60 * MINUTE_MS);
  assert.equal(getCooldownDurationMs(5), 5 * 60 * MINUTE_MS);
  assert.equal(getCooldownDurationMs(8), 5 * 60 * MINUTE_MS);
});

test('second completion locks the next roll for five minutes', () => {
  const nowMs = at(26, 9, 2);
  const state = getRefillState([
    entry('first', at(26, 8, 55)),
    entry('second', at(26, 9)),
  ], nowMs);

  assert.equal(state.completedCount, 2);
  assert.equal(state.nextRoundNumber, 3);
  assert.equal(state.stage, '5m');
  assert.equal(state.remainingMs, 3 * MINUTE_MS);
  assert.equal(state.isLocked, true);
});

test('expired cooldown keeps its stage for return analytics without blocking play', () => {
  const state = getRefillState([
    entry('first', at(26, 8)),
    entry('second', at(26, 8, 5)),
  ], at(26, 8, 11));

  assert.equal(state.stage, '5m');
  assert.equal(state.availableAtMs, at(26, 8, 10));
  assert.equal(state.remainingMs, 0);
  assert.equal(state.isLocked, false);
});

test('06:00 reset unlocks a late cooldown and starts a new product day', () => {
  const entries = [
    entry('one', at(26, 1)),
    entry('two', at(26, 1, 5)),
    entry('three', at(26, 1, 40)),
    entry('four', at(26, 3, 40)),
    entry('five', at(26, 5, 30)),
  ];
  const beforeReset = getRefillState(entries, at(26, 5, 40));
  const afterReset = getRefillState(entries, at(26, 6));

  assert.equal(beforeReset.stage, '5h');
  assert.equal(beforeReset.availableAtMs, at(26, 6));
  assert.equal(beforeReset.remainingMs, 20 * MINUTE_MS);
  assert.equal(afterReset.completedCount, 0);
  assert.equal(afterReset.isLocked, false);
});

test('old and future completions do not change the current product-day count', () => {
  const nowMs = at(26, 12);
  const state = getRefillState([
    entry('old', at(25, 5)),
    entry('today', at(26, 8)),
    entry('future', at(26, 13)),
  ], nowMs);

  assert.equal(state.completedCount, 1);
  assert.equal(state.completedProductDayCount, 2);
  assert.equal(state.isLocked, false);
});

test('remaining time formatting keeps seconds for short waits', () => {
  assert.equal(formatRemainingDuration(279_100), '4분 40초 남음');
  assert.equal(formatRemainingDuration(7_260_000), '2시간 1분 남음');
});
