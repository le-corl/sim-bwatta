import assert from 'node:assert/strict';
import test from 'node:test';

import { appendDiaryEntry, parseDiary, type DiaryEntry } from '../src/game/diaryStorage.ts';

const olderEntry: DiaryEntry = {
  id: 'older',
  completedAt: '2026-08-24T12:00:00.000Z',
  coreMessage: '오래된 휴지심',
  isGolden: false,
  missionCount: 1,
  missionTitles: ['기지개'],
};

const newerEntry: DiaryEntry = {
  id: 'newer',
  completedAt: '2026-08-25T12:00:00.000Z',
  coreMessage: '새 휴지심',
  isGolden: true,
  missionCount: 2,
  missionTitles: ['물 마시기', '쓰레기 버리기'],
  hadSurprise: true,
};

test('diary parser rejects malformed storage and filters invalid entries', () => {
  assert.deepEqual(parseDiary('{broken'), []);
  assert.deepEqual(parseDiary(JSON.stringify([olderEntry, { id: 3 }])), [olderEntry]);
  assert.deepEqual(parseDiary(JSON.stringify([{ ...olderEntry, hadSurprise: 'yes' }])), []);
});

test('diary parser returns latest entries first', () => {
  assert.deepEqual(parseDiary(JSON.stringify([olderEntry, newerEntry])), [newerEntry, olderEntry]);
  assert.equal(parseDiary(JSON.stringify([olderEntry]))[0]?.hadSurprise, undefined);
});

test('appending the same round id replaces it without duplication', () => {
  const replacement = { ...olderEntry, coreMessage: '교체된 휴지심' };
  const entries = appendDiaryEntry([olderEntry], replacement);

  assert.equal(entries.length, 1);
  assert.equal(entries[0]?.coreMessage, '교체된 휴지심');
});
