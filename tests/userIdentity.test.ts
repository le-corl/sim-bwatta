import assert from 'node:assert/strict';
import test from 'node:test';

import { syncGameUserIdentityWith } from '../src/game/userIdentity.ts';

test('stores a valid game user hash', async () => {
  let storedHash: string | null = null;

  const didSync = await syncGameUserIdentityWith({
    getUserKey: async () => ({ type: 'HASH', hash: ' user-hash ' }),
    storeUserKey: async (hash) => {
      storedHash = hash;
    },
  });

  assert.equal(didSync, true);
  assert.equal(storedHash, 'user-hash');
});

test('does not store an empty game user hash', async () => {
  let storeCalls = 0;

  const didSync = await syncGameUserIdentityWith({
    getUserKey: async () => ({ type: 'HASH', hash: '   ' }),
    storeUserKey: async () => {
      storeCalls += 1;
    },
  });

  assert.equal(didSync, false);
  assert.equal(storeCalls, 0);
});

test('fails safely when the game user API is unavailable', async () => {
  const didSync = await syncGameUserIdentityWith({
    getUserKey: async () => {
      throw new Error('unsupported');
    },
    storeUserKey: async () => {
      throw new Error('should not store');
    },
  });

  assert.equal(didSync, false);
});
