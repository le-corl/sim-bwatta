import { getWebAppUrl, IS_DEVELOPMENT, IS_WEB_PWA } from '../platform/runtime.ts';
import type { DiaryEntry } from './diaryStorage';

export type GeneratedResultCard = {
  base64: string;
  dataUrl: string;
  fileName: string;
};

export type ResultActionOutcome = 'saved' | 'downloaded' | 'shared' | 'copied';

const CARD_WIDTH = 1_080;
const CARD_HEIGHT = 1_350;

export function wrapTextByWidth(text: string, maxWidth: number, measure: (value: string) => number) {
  const lines: string[] = [];
  let currentLine = '';

  for (const character of text) {
    const candidate = currentLine + character;

    if (currentLine !== '' && measure(candidate) > maxWidth) {
      lines.push(currentLine.trim());
      currentLine = character.trimStart();
    } else {
      currentLine = candidate;
    }
  }

  if (currentLine.trim() !== '') {
    lines.push(currentLine.trim());
  }

  return lines;
}

export function getResultCardFileName(entry: DiaryEntry) {
  const date = entry.completedAt.slice(0, 10).replaceAll('-', '');
  return `sim-bwatta-${date}-${entry.id.slice(0, 8)}.png`;
}

export function buildShareMessage(entry: DiaryEntry, shareLink?: string) {
  const reward = entry.isGolden ? '황금 휴지심' : '휴지심';
  const lines = [
    `심봤다!에서 ${entry.missionCount}개의 작은 일을 끝내고 ${reward}을 발견했어요.`,
    `“${entry.coreMessage}”`,
  ];

  if (shareLink !== undefined) {
    lines.push(shareLink);
  }

  return lines.join('\n');
}

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function fillCenteredLines(context: CanvasRenderingContext2D, lines: string[], centerX: number, startY: number, lineHeight: number) {
  lines.forEach((line, index) => context.fillText(line, centerX, startY + index * lineHeight));
}

function drawResultCore(context: CanvasRenderingContext2D, entry: DiaryEntry) {
  const centerX = CARD_WIDTH / 2;
  const topY = 400;
  const width = 400;
  const height = 520;
  const topRadiusY = 50;
  const bottomRadiusY = 52;
  const ellipseControl = 0.552_284_8;
  const left = centerX - width / 2;
  const right = centerX + width / 2;
  const bottom = topY + height;
  const borderColor = entry.isGolden ? '#ce9517' : '#8e5f3c';

  context.save();

  context.beginPath();
  context.ellipse(centerX, bottom + 7, width * 0.46, 22, 0, 0, Math.PI * 2);
  context.fillStyle = 'rgba(70, 48, 31, 0.13)';
  context.fill();

  const bodyGradient = context.createLinearGradient(left, 0, right, 0);
  bodyGradient.addColorStop(0, entry.isGolden ? '#f3c74c' : '#c99568');
  bodyGradient.addColorStop(0.52, entry.isGolden ? '#efbd36' : '#bd8657');
  bodyGradient.addColorStop(1, entry.isGolden ? '#dba729' : '#a96f47');

  context.beginPath();
  context.moveTo(left, topY);
  context.lineTo(right, topY);
  context.lineTo(right, bottom - bottomRadiusY);
  context.bezierCurveTo(
    right,
    bottom - bottomRadiusY + ellipseControl * bottomRadiusY,
    centerX + ellipseControl * (width / 2),
    bottom,
    centerX,
    bottom,
  );
  context.bezierCurveTo(
    centerX - ellipseControl * (width / 2),
    bottom,
    left,
    bottom - bottomRadiusY + ellipseControl * bottomRadiusY,
    left,
    bottom - bottomRadiusY,
  );
  context.closePath();
  context.fillStyle = bodyGradient;
  context.strokeStyle = borderColor;
  context.lineWidth = 12;
  context.fill();
  context.stroke();

  context.beginPath();
  context.ellipse(centerX, topY, width / 2, topRadiusY, 0, 0, Math.PI * 2);
  context.fillStyle = entry.isGolden ? '#e8b83f' : '#c39068';
  context.fill();
  context.stroke();

  context.beginPath();
  context.moveTo(left - 8, topY + 158);
  context.bezierCurveTo(left + 76, topY + 310, right - 118, topY + 392, right + 8, topY + 342);
  context.strokeStyle = entry.isGolden ? '#94650a' : '#865737';
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.stroke();

  context.fillStyle = entry.isGolden ? '#5a3b05' : '#fff7ec';
  context.font = '900 42px Pretendard, sans-serif';
  const messageLines = wrapTextByWidth(entry.coreMessage, 305, (value) => context.measureText(value).width).slice(0, 3);
  const messageCenterY = topY + 260;
  const messageStartY = messageCenterY - ((messageLines.length - 1) * 56) / 2;
  fillCenteredLines(context, messageLines, centerX, messageStartY, 56);

  context.restore();
}

function formatCardDate(completedAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(completedAt));
}

export async function createResultCard(entry: DiaryEntry): Promise<GeneratedResultCard> {
  await document.fonts?.ready;

  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;

  const context = canvas.getContext('2d');
  if (context === null) {
    throw new Error('이미지 캔버스를 만들 수 없어요.');
  }

  const background = context.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  background.addColorStop(0, entry.isGolden ? '#fff5c8' : '#fffaf0');
  background.addColorStop(1, entry.isGolden ? '#f4cf63' : '#eadfce');
  context.fillStyle = background;
  context.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

  context.fillStyle = entry.isGolden ? 'rgba(255,255,255,0.54)' : 'rgba(255,255,255,0.64)';
  roundedRect(context, 72, 72, 936, 1_206, 58);
  context.fill();

  context.textAlign = 'center';
  context.fillStyle = '#8a6e4d';
  context.font = '800 30px Pretendard, sans-serif';
  context.fillText('작고 하찮은 성취 보관함', CARD_WIDTH / 2, 160);

  context.fillStyle = '#332b24';
  context.font = '900 82px Pretendard, sans-serif';
  context.fillText('심봤다!', CARD_WIDTH / 2, 265);

  context.fillStyle = '#867568';
  context.font = '700 30px Pretendard, sans-serif';
  context.fillText(formatCardDate(entry.completedAt), CARD_WIDTH / 2, 330);

  drawResultCore(context, entry);

  context.fillStyle = '#332b24';
  context.font = '900 50px Pretendard, sans-serif';
  context.fillText(entry.isGolden ? '황금 휴지심 발견!' : '휴지심 발견!', CARD_WIDTH / 2, 1_010);

  context.fillStyle = '#796a5d';
  context.font = '700 30px Pretendard, sans-serif';
  context.fillText(`${entry.missionCount}개 행동 미션 완료`, CARD_WIDTH / 2, 1_060);

  context.fillStyle = '#f4eee5';
  roundedRect(context, 150, 1_090, 780, 110, 32);
  context.fill();

  context.fillStyle = '#5f5146';
  context.font = '750 32px Pretendard, sans-serif';
  const missionLines = wrapTextByWidth(entry.missionTitles.join(' · '), 680, (value) => context.measureText(value).width).slice(0, 2);
  const missionStartY = 1_150 - ((missionLines.length - 1) * 42) / 2;
  fillCenteredLines(context, missionLines, CARD_WIDTH / 2, missionStartY, 42);

  context.fillStyle = '#9a8878';
  context.font = '700 25px Pretendard, sans-serif';
  context.fillText('휴지를 낭비하고, 작은 일을 해냈다.', CARD_WIDTH / 2, 1_240);

  const dataUrl = canvas.toDataURL('image/png');

  return {
    base64: dataUrl.slice(dataUrl.indexOf(',') + 1),
    dataUrl,
    fileName: getResultCardFileName(entry),
  };
}

function downloadResultCard(card: GeneratedResultCard) {
  const binary = window.atob(card.base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const objectUrl = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = card.fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
}

export async function saveResultCard(entry: DiaryEntry): Promise<ResultActionOutcome> {
  const card = await createResultCard(entry);

  if (IS_WEB_PWA || IS_DEVELOPMENT) {
    downloadResultCard(card);
    return 'downloaded';
  }

  const { File: TossFile } = await import('@apps-in-toss/web-framework');
  if (!TossFile.saveBase64.isSupported()) {
    throw new Error('현재 토스 앱에서는 이미지 저장을 지원하지 않아요.');
  }

  await TossFile.saveBase64({
    data: card.base64,
    fileName: card.fileName,
    mimeType: 'image/png',
  });

  return 'saved';
}

export async function shareResult(entry: DiaryEntry): Promise<ResultActionOutcome> {
  if (IS_WEB_PWA) {
    const shareLink = getWebAppUrl();

    if (typeof navigator.share === 'function') {
      await navigator.share({
        title: '심봤다',
        text: buildShareMessage(entry),
        url: shareLink,
      });
      return 'shared';
    }

    await navigator.clipboard.writeText(buildShareMessage(entry, shareLink));
    return 'copied';
  }

  if (IS_DEVELOPMENT) {
    await navigator.clipboard.writeText(buildShareMessage(entry));
    return 'copied';
  }

  const { Share } = await import('@apps-in-toss/web-framework');
  const shareLink = await Share.createLink({ path: 'intoss://sim-bwatta' });
  await Share.sendMessage({ message: buildShareMessage(entry, shareLink) });
  return 'shared';
}
