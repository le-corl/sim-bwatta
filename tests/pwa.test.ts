import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { resolveAppTarget } from '../src/platform/runtime.ts';

type ManifestIcon = {
  src?: string;
  sizes?: string;
  purpose?: string;
};

type WebManifest = {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  orientation?: string;
  icons?: ManifestIcon[];
};

test('runtime target defaults to Toss and selects web PWA explicitly', () => {
  assert.equal(resolveAppTarget(undefined), 'toss');
  assert.equal(resolveAppTarget('development'), 'toss');
  assert.equal(resolveAppTarget('web-pwa'), 'web-pwa');
});

test('web manifest contains the Microsoft PWA installability fields', async () => {
  const raw = await readFile(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8');
  const manifest = JSON.parse(raw) as WebManifest;

  assert.equal(manifest.name, '심봤다');
  assert.equal(manifest.short_name, '심봤다');
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.orientation, 'portrait-primary');
  assert.ok(manifest.icons?.some((icon) => icon.sizes === '192x192'));
  assert.ok(manifest.icons?.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(manifest.icons?.some((icon) => icon.sizes === '512x512' && icon.purpose === 'maskable'));
});

test('service worker provides install, activation, and offline fetch handling', async () => {
  const serviceWorker = await readFile(new URL('../public/sw.js', import.meta.url), 'utf8');

  assert.match(serviceWorker, /addEventListener\('install'/);
  assert.match(serviceWorker, /addEventListener\('activate'/);
  assert.match(serviceWorker, /addEventListener\('fetch'/);
  assert.match(serviceWorker, /caches\.match/);
});
