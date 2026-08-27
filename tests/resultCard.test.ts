import assert from 'node:assert/strict';
import test from 'node:test';

import { buildShareMessage, getResultCardFileName, wrapTextByWidth } from '../src/game/resultCard.ts';
import type { DiaryEntry } from '../src/game/diaryStorage.ts';

const entry: DiaryEntry = {
  id: '12345678-abcd',
  completedAt: '2026-08-25T12:00:00.000Z',
  coreMessage: '휴지심은 비었지만 당신은 조금 찼다.',
  isGolden: false,
  missionCount: 1,
  missionTitles: ['기지개 한 번 길게'],
};

test('card filename is stable and ends with png', () => {
  assert.equal(getResultCardFileName(entry), 'sim-bwatta-20260825-12345678.png');
});

test('share message contains result, reward and optional link', () => {
  const message = buildShareMessage(entry, 'https://example.com/share');

  assert.match(message, /1개의 작은 일/);
  assert.match(message, /휴지심은 비었지만/);
  assert.match(message, /https:\/\/example.com\/share/);
});

test('text wrapping preserves all characters within measured width', () => {
  const lines = wrapTextByWidth('가나다라마바사', 3, (value) => value.length);

  assert.deepEqual(lines, ['가나다', '라마바', '사']);
  assert.equal(lines.join(''), '가나다라마바사');
});
