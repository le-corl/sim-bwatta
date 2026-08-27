import assert from 'node:assert/strict';
import test from 'node:test';

import { createAnalyticsPayload } from '../src/game/analytics.ts';

test('analytics payload uses a stable prefix and schema version', () => {
  assert.deepEqual(createAnalyticsPayload('refill_return', {
    cooldown_minutes: 30,
    seconds_after_unlock: 15,
  }), {
    log_name: 'sim_bwatta_refill_return',
    log_type: 'event',
    params: {
      analytics_schema_version: 1,
      cooldown_minutes: 30,
      seconds_after_unlock: 15,
    },
  });
});
