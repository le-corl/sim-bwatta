export type AppTarget = 'toss' | 'web-pwa';

export function resolveAppTarget(mode: string | undefined): AppTarget {
  return mode === 'web-pwa' ? 'web-pwa' : 'toss';
}

export const APP_TARGET = resolveAppTarget(import.meta.env?.MODE);
export const IS_WEB_PWA = APP_TARGET === 'web-pwa';
export const IS_DEVELOPMENT = import.meta.env?.DEV === true;

export function getWebAppUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}
