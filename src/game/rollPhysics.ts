import { ROLL_VISUAL_CONFIG } from './rollVisualConfig.ts';

export type PullSample = {
  downwardDistance: number;
  velocity: number;
  acceleration: number;
  pullUnits: number;
};

const JITTER_THRESHOLD_PX = 1.5;
const MIN_SAMPLE_MS = 8;
const MAX_SAMPLE_MS = 80;
const VELOCITY_GAIN = 1.35;
const MAX_ACCELERATION = 3.2;
const ROLL_AXIS_Y = 88;
const BASE_SHEET_LENGTH = 170;
const MAX_GUIDE_LENGTH = 300;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function getSwipeWeightMultiplier(weight = ROLL_VISUAL_CONFIG.swipeWeight) {
  const safeWeight = clamp(Number.isFinite(weight) ? weight : 50, 1, 100);
  return 2 ** ((safeWeight - 50) / 50);
}

export function getSwipeAccelerationMultiplier(acceleration = ROLL_VISUAL_CONFIG.swipeAcceleration) {
  const safeAcceleration = clamp(Number.isFinite(acceleration) ? acceleration : 50, 1, 100);
  return 2 ** ((safeAcceleration - 50) / 50);
}

export function calculatePullSample(
  deltaY: number,
  deltaTimeMs: number,
  swipeWeight = ROLL_VISUAL_CONFIG.swipeWeight,
  swipeAcceleration = ROLL_VISUAL_CONFIG.swipeAcceleration,
): PullSample {
  if (!Number.isFinite(deltaY) || !Number.isFinite(deltaTimeMs)) {
    return { downwardDistance: 0, velocity: 0, acceleration: 1, pullUnits: 0 };
  }

  const downwardDistance = deltaY > JITTER_THRESHOLD_PX ? deltaY : 0;
  if (downwardDistance === 0) {
    return { downwardDistance: 0, velocity: 0, acceleration: 1, pullUnits: 0 };
  }

  const sampleTime = clamp(deltaTimeMs, MIN_SAMPLE_MS, MAX_SAMPLE_MS);
  const velocity = downwardDistance / sampleTime;
  const accelerationMultiplier = getSwipeAccelerationMultiplier(swipeAcceleration);
  const maxAcceleration = 1 + (MAX_ACCELERATION - 1) * accelerationMultiplier;
  const acceleration = clamp(1 + velocity * VELOCITY_GAIN * accelerationMultiplier, 1, maxAcceleration);

  return {
    downwardDistance,
    velocity,
    acceleration,
    pullUnits: downwardDistance * acceleration * getSwipeWeightMultiplier(swipeWeight),
  };
}

export function clampForwardProgress(current: number, delta: number, stopAt = 100) {
  const safeCurrent = clamp(current, 0, stopAt);
  const forwardDelta = Number.isFinite(delta) ? Math.max(0, delta) : 0;
  return clamp(safeCurrent + forwardDelta, safeCurrent, stopAt);
}

export function getRollDiameterScale(progress: number) {
  const safeProgress = clamp(Number.isFinite(progress) ? progress : 0, 0, 100);
  const coreScale = ROLL_VISUAL_CONFIG.coreDiameterPx / ROLL_VISUAL_CONFIG.fullRollDiameterPx;
  return coreScale + (1 - safeProgress / 100) * (1 - coreScale);
}

export function getRollVisualState(progress: number, paperStartAngleDegrees = ROLL_VISUAL_CONFIG.paperStartAngleDegrees) {
  const safeProgress = clamp(Number.isFinite(progress) ? progress : 0, 0, 100);
  const ratio = safeProgress / 100;
  const rollDiameter = ROLL_VISUAL_CONFIG.fullRollDiameterPx * getRollDiameterScale(safeProgress);
  const safeStartAngle = clamp(Number.isFinite(paperStartAngleDegrees) ? paperStartAngleDegrees : 0, -90, 90);
  const startAngleRadians = safeStartAngle * (Math.PI / 180);
  const paperTravel = ROLL_VISUAL_CONFIG.paperPanelHeightPx * ROLL_VISUAL_CONFIG.visualPanelPasses * ratio;
  const paperOpacity = clamp((100 - safeProgress) / (100 - ROLL_VISUAL_CONFIG.paperFadeStartProgress), 0, 1);

  return {
    sheetTop: ROLL_AXIS_Y - (rollDiameter / 2) * Math.sin(startAngleRadians),
    sheetLength: BASE_SHEET_LENGTH + paperTravel,
    guideLength: BASE_SHEET_LENGTH + ratio * (MAX_GUIDE_LENGTH - BASE_SHEET_LENGTH),
    paperOffset: paperTravel,
    faceRotationDegrees: ratio === 0 ? 0 : -ROLL_VISUAL_CONFIG.visualRollTurns * 360 * ratio,
    paperOpacity,
  };
}
