import assert from 'node:assert/strict';
import test from 'node:test';

import { formatMissionTime, getMissionSecondsLeft } from '../src/game/missionTimer.ts';

test('mission time starts at 90 seconds and counts down by wall clock', () => {
  const now = 1_000_000;
  const end = now + 90_000;

  assert.equal(getMissionSecondsLeft(end, now), 90);
  assert.equal(getMissionSecondsLeft(end, now + 1_100), 89);
});

test('mission time never becomes negative', () => {
  assert.equal(getMissionSecondsLeft(1_000, 2_000), 0);
});

test('mission time uses minute and second display', () => {
  assert.equal(formatMissionTime(90), '1:30');
  assert.equal(formatMissionTime(5), '0:05');
  assert.equal(formatMissionTime(-1), '0:00');
});
