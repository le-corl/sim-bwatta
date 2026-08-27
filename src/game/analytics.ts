import { IS_WEB_PWA } from '../platform/runtime.ts';

type AnalyticsParam = string | number | boolean | null | undefined;

export type GameAnalyticsEvent = 'roll_start' | 'roll_complete' | 'refill_locked' | 'refill_return';

export function createAnalyticsPayload(event: GameAnalyticsEvent, params: Record<string, AnalyticsParam>) {
  return {
    log_name: `sim_bwatta_${event}`,
    log_type: 'event' as const,
    params: {
      analytics_schema_version: 1,
      ...params,
    },
  };
}

export async function logGameEvent(event: GameAnalyticsEvent, params: Record<string, AnalyticsParam>): Promise<void> {
  if (IS_WEB_PWA) {
    return;
  }

  try {
    const { Analytics } = await import('@apps-in-toss/web-framework');
    await Analytics.log(createAnalyticsPayload(event, params));
  } catch {
    // Analytics must never block gameplay, local saves, or the refill schedule.
  }
}
