import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import config from '../apps-in-toss.config.ts';

test('release shell disables operating-system back and forward gestures', () => {
  assert.equal(config.webView?.allowsBackForwardNavigationGestures, false);
});

test('release shell disables pinch zoom', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /maximum-scale=1/);
  assert.match(html, /user-scalable=no/);
});
