import { IS_DEVELOPMENT, IS_WEB_PWA } from '../platform/runtime.ts';

export type DiaryEntry = {
  id: string;
  completedAt: string;
  coreMessage: string;
  isGolden: boolean;
  missionCount: number;
  missionTitles: string[];
  hadSurprise?: boolean;
};

const DIARY_STORAGE_KEY = 'sim-bwatta:diary:v1';

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const entry = value as Partial<DiaryEntry>;

  return (
    typeof entry.id === 'string' &&
    typeof entry.completedAt === 'string' &&
    !Number.isNaN(Date.parse(entry.completedAt)) &&
    typeof entry.coreMessage === 'string' &&
    typeof entry.isGolden === 'boolean' &&
    typeof entry.missionCount === 'number' &&
    Array.isArray(entry.missionTitles) &&
    entry.missionTitles.every((title) => typeof title === 'string') &&
    (entry.hadSurprise === undefined || typeof entry.hadSurprise === 'boolean')
  );
}

export function parseDiary(rawValue: string | null): DiaryEntry[] {
  if (rawValue === null) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isDiaryEntry).sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt));
  } catch {
    return [];
  }
}

export function appendDiaryEntry(entries: DiaryEntry[], nextEntry: DiaryEntry): DiaryEntry[] {
  return [nextEntry, ...entries.filter((entry) => entry.id !== nextEntry.id)].sort(
    (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt),
  );
}

async function getStoredValue() {
  if (IS_WEB_PWA) {
    return window.localStorage.getItem(DIARY_STORAGE_KEY);
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    return await Storage.getItem(DIARY_STORAGE_KEY);
  } catch (error) {
    if (IS_DEVELOPMENT) {
      return window.localStorage.getItem(DIARY_STORAGE_KEY);
    }

    throw error;
  }
}

async function setStoredValue(value: string) {
  if (IS_WEB_PWA) {
    window.localStorage.setItem(DIARY_STORAGE_KEY, value);
    return;
  }

  try {
    const { Storage } = await import('@apps-in-toss/web-framework');
    await Storage.setItem(DIARY_STORAGE_KEY, value);
  } catch (error) {
    if (IS_DEVELOPMENT) {
      window.localStorage.setItem(DIARY_STORAGE_KEY, value);
      return;
    }

    throw error;
  }
}

export async function loadDiary(): Promise<DiaryEntry[]> {
  return parseDiary(await getStoredValue());
}

export async function saveDiaryEntry(entry: DiaryEntry): Promise<DiaryEntry[]> {
  const entries = appendDiaryEntry(await loadDiary(), entry);
  await setStoredValue(JSON.stringify(entries));
  return entries;
}

export async function clearDiary(): Promise<void> {
  await setStoredValue('[]');
}
