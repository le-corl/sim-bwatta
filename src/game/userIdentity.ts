import { IS_WEB_PWA } from '../platform/runtime.ts';

export type GameUserKey = {
  type: 'HASH';
  hash: string;
};

export type GameUserIdentityDependencies = {
  getUserKey: () => Promise<GameUserKey | undefined>;
  storeUserKey: (hash: string) => Promise<void>;
};

const GAME_USER_KEY_STORAGE_KEY = 'sim-bwatta:game-user-key:v1';

export async function syncGameUserIdentityWith({
  getUserKey,
  storeUserKey,
}: GameUserIdentityDependencies): Promise<boolean> {
  try {
    const userKey = await getUserKey();
    const hash = userKey?.type === 'HASH' ? userKey.hash.trim() : '';

    if (hash.length === 0) {
      return false;
    }

    await storeUserKey(hash);
    return true;
  } catch {
    return false;
  }
}

export async function syncGameUserIdentity(): Promise<boolean> {
  if (IS_WEB_PWA) {
    return false;
  }

  try {
    const { Storage, User } = await import('@apps-in-toss/web-framework');

    return await syncGameUserIdentityWith({
      getUserKey: () => User.getAnonymousKey(),
      storeUserKey: (hash) => Storage.setItem(GAME_USER_KEY_STORAGE_KEY, hash),
    });
  } catch {
    return false;
  }
}
