import assert from 'node:assert/strict';
import test from 'node:test';

import { calculatePullSample, clampForwardProgress, getRollDiameterScale, getRollVisualState, getSwipeAccelerationMultiplier, getSwipeWeightMultiplier } from '../src/game/rollPhysics.ts';
import { ROLL_VISUAL_CONFIG } from '../src/game/rollVisualConfig.ts';

test('upward and jitter movement never create progress', () => {
  assert.equal(calculatePullSample(-120, 16).pullUnits, 0);
  assert.equal(calculatePullSample(1, 16).pullUnits, 0);
  assert.equal(clampForwardProgress(42, -20), 42);
});

test('a faster swipe produces more pull for the same distance', () => {
  const slow = calculatePullSample(100, 80);
  const fast = calculatePullSample(100, 16);

  assert.ok(fast.velocity > slow.velocity);
  assert.ok(fast.acceleration > slow.acceleration);
  assert.ok(fast.pullUnits > slow.pullUnits);
});

test('acceleration and progress are capped', () => {
  const extreme = calculatePullSample(1_000, 1, 50, 50);

  assert.equal(extreme.acceleration, 3.2);
  assert.equal(clampForwardProgress(34, 40, 36), 36);
  assert.equal(clampForwardProgress(99, 20), 100);
});

test('swipe weight 50 preserves current sensitivity and 1 to 100 changes required pulls', () => {
  assert.equal(getSwipeWeightMultiplier(50), 1);
  assert.equal(getSwipeWeightMultiplier(100), 2);
  assert.ok(getSwipeWeightMultiplier(1) < 1);
  assert.ok(calculatePullSample(100, 80, 1).pullUnits < calculatePullSample(100, 80, 50).pullUnits);
  assert.ok(calculatePullSample(100, 80, 100).pullUnits > calculatePullSample(100, 80, 50).pullUnits);
});

test('swipe acceleration 50 preserves current boost and 1 to 100 changes fast-pull force', () => {
  assert.equal(getSwipeAccelerationMultiplier(50), 1);
  assert.equal(getSwipeAccelerationMultiplier(100), 2);
  assert.ok(getSwipeAccelerationMultiplier(1) < 1);
  assert.ok(calculatePullSample(100, 16, 50, 1).acceleration < calculatePullSample(100, 16, 50, 50).acceleration);
  assert.ok(calculatePullSample(100, 16, 50, 100).acceleration > calculatePullSample(100, 16, 50, 50).acceleration);
});

test('roll diameter shrinks linearly from 11cm to 4cm ratio', () => {
  assert.equal(getRollDiameterScale(0), 1);
  assert.equal(getRollDiameterScale(100), ROLL_VISUAL_CONFIG.coreDiameterPx / ROLL_VISUAL_CONFIG.fullRollDiameterPx);
  assert.equal(getRollDiameterScale(-20), 1);
  assert.equal(getRollDiameterScale(130), ROLL_VISUAL_CONFIG.coreDiameterPx / ROLL_VISUAL_CONFIG.fullRollDiameterPx);
  assert.ok(getRollDiameterScale(50) < 1);
  assert.ok(getRollDiameterScale(50) > ROLL_VISUAL_CONFIG.coreDiameterPx / ROLL_VISUAL_CONFIG.fullRollDiameterPx);
});

test('paper starts at the fixed front tangent and stays there', () => {
  assert.equal(getRollVisualState(0).sheetTop, 88);
  assert.equal(getRollVisualState(50).sheetTop, 88);
  assert.equal(getRollVisualState(100).sheetTop, 88);
});

test('positive paper start angles move the tangent upward along the shrinking roll', () => {
  assert.ok(getRollVisualState(0, 30).sheetTop < getRollVisualState(0, 0).sheetTop);
  assert.ok(getRollVisualState(0, 30).sheetTop < getRollVisualState(100, 30).sheetTop);
  assert.equal(getRollVisualState(50, -120).sheetTop, getRollVisualState(50, -90).sheetTop);
});

test('roll rotation, paper travel and visible length share one progress source', () => {
  assert.deepEqual(getRollVisualState(0), {
    sheetTop: 88,
    sheetLength: 170,
    guideLength: 170,
    paperOffset: 0,
    faceRotationDegrees: 0,
    paperOpacity: 1,
  });
  assert.deepEqual(getRollVisualState(100), {
    sheetTop: 88,
    sheetLength: 170 + ROLL_VISUAL_CONFIG.paperPanelHeightPx * ROLL_VISUAL_CONFIG.visualPanelPasses,
    guideLength: 300,
    paperOffset: ROLL_VISUAL_CONFIG.paperPanelHeightPx * ROLL_VISUAL_CONFIG.visualPanelPasses,
    faceRotationDegrees: -360 * ROLL_VISUAL_CONFIG.visualRollTurns,
    paperOpacity: 0,
  });
  assert.deepEqual(getRollVisualState(130), getRollVisualState(100));
});

test('paper panels can pass faster than the roll turns without losing progress sync', () => {
  const half = getRollVisualState(50);

  assert.ok(ROLL_VISUAL_CONFIG.visualPanelPasses > ROLL_VISUAL_CONFIG.visualRollTurns);
  assert.equal(half.paperOffset, ROLL_VISUAL_CONFIG.paperPanelHeightPx * ROLL_VISUAL_CONFIG.visualPanelPasses * 0.5);
  assert.equal(half.sheetLength - 170, half.paperOffset);
  assert.equal(half.guideLength, 235);
  assert.equal(half.faceRotationDegrees, -360 * ROLL_VISUAL_CONFIG.visualRollTurns * 0.5);
});

test('white paper layer is nearly gone before completion', () => {
  assert.equal(getRollVisualState(88).paperOpacity, 1);
  assert.ok(getRollVisualState(99).paperOpacity < 0.1);
  assert.equal(getRollVisualState(100).paperOpacity, 0);
});
