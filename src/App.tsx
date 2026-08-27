import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

import { clearDiary, loadDiary, saveDiaryEntry, type DiaryEntry } from './game/diaryStorage';
import { logGameEvent } from './game/analytics';
import { CORE_MESSAGES } from './game/coreMessages';
import { formatMissionTime, getMissionSecondsLeft, MISSION_DURATION_SECONDS } from './game/missionTimer';
import { MISSIONS, type Mission } from './game/missions';
import { formatRemainingDuration, getRefillState } from './game/refillSchedule';
import { saveResultCard, shareResult, type ResultActionOutcome } from './game/resultCard';
import { calculatePullSample, clampForwardProgress, getRollDiameterScale, getRollVisualState } from './game/rollPhysics';
import { getGoldenCoreProbability, ROLL_VISUAL_CONFIG } from './game/rollVisualConfig';
import { createSurprisePanelPlan, type SurprisePanelPlan } from './game/surprisePanels';
import { syncGameUserIdentity } from './game/userIdentity';

type Screen = 'main' | 'play';
type Phase = 'rolling' | 'mission' | 'finishing' | 'result';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type DetailAction = 'save' | 'share' | null;

type RoundPlan = {
  id: string;
  isGolden: boolean;
  missions: Mission[];
  checkpoints: number[];
  coreMessage: string;
  surprisePanel: SurprisePanelPlan | null;
};

type PointerTracker = {
  id: number;
  lastY: number;
  lastTime: number;
} | null;

const TOTAL_PULL_UNITS = 4_800;

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function createRoundId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createRoundPlan(completedEntries: readonly DiaryEntry[] = []): RoundPlan {
  const isGolden = Math.random() < getGoldenCoreProbability();
  const shuffledMissions = [...MISSIONS].sort(() => Math.random() - 0.5);

  return {
    id: createRoundId(),
    isGolden,
    missions: shuffledMissions.slice(0, isGolden ? 2 : 1),
    checkpoints: isGolden ? [36, 68] : [52],
    coreMessage: pickRandom(CORE_MESSAGES),
    surprisePanel: createSurprisePanelPlan(completedEntries.map((entry) => entry.hadSurprise === true)),
  };
}

function formatDiaryDate(completedAt: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(completedAt));
}

function formatRefillAvailableTime(availableAtMs: number, nowMs: number) {
  const availableAt = new Date(availableAtMs);
  const now = new Date(nowMs);
  const isSameDate = availableAt.getFullYear() === now.getFullYear()
    && availableAt.getMonth() === now.getMonth()
    && availableAt.getDate() === now.getDate();

  return new Intl.DateTimeFormat('ko-KR', isSameDate
    ? { hour: 'numeric', minute: '2-digit' }
    : { month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(availableAt);
}

export function App() {
  const [screen, setScreen] = useState<Screen>('main');
  const [round, setRound] = useState(createRoundPlan);
  const [phase, setPhase] = useState<Phase>('rolling');
  const [progress, setProgress] = useState(0);
  const [completedMissions, setCompletedMissions] = useState(0);
  const [swipeSpeed, setSwipeSpeed] = useState(0);
  const [missionSecondsLeft, setMissionSecondsLeft] = useState(MISSION_DURATION_SECONDS);
  const [hasActiveRun, setHasActiveRun] = useState(false);
  const [diary, setDiary] = useState<DiaryEntry[]>([]);
  const [isDiaryLoading, setIsDiaryLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [detailAction, setDetailAction] = useState<DetailAction>(null);
  const [detailFeedback, setDetailFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [completedEntry, setCompletedEntry] = useState<DiaryEntry | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [testResetFeedback, setTestResetFeedback] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now);

  const pointer = useRef<PointerTracker>(null);
  const progressRef = useRef(0);
  const phaseRef = useRef<Phase>('rolling');
  const completedMissionsRef = useRef(0);
  const speedResetTimer = useRef<number | null>(null);
  const finishTimer = useRef<number | null>(null);
  const savingRoundIds = useRef(new Set<string>());
  const loggedRefillImpressions = useRef(new Set<string>());
  const loggedRefillReturns = useRef(new Set<string>());

  useEffect(() => {
    void syncGameUserIdentity();
  }, []);

  useEffect(() => {
    let isCurrent = true;

    void loadDiary()
      .then((entries) => {
        if (isCurrent) {
          setDiary(entries);
        }
      })
      .catch(() => {
        if (isCurrent) {
          setDiary([]);
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsDiaryLoading(false);
        }
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (screen !== 'main') {
      return;
    }

    setNowMs(Date.now());
    const timer = window.setInterval(() => setNowMs(Date.now()), 1_000);

    return () => window.clearInterval(timer);
  }, [screen]);

  const changePhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const stopSpeedIndicator = useCallback(() => {
    if (speedResetTimer.current !== null) {
      window.clearTimeout(speedResetTimer.current);
    }

    speedResetTimer.current = window.setTimeout(() => setSwipeSpeed(0), 180);
  }, []);

  const clearFinishTimer = useCallback(() => {
    if (finishTimer.current !== null) {
      window.clearTimeout(finishTimer.current);
      finishTimer.current = null;
    }
  }, []);

  useEffect(() => () => {
    if (speedResetTimer.current !== null) {
      window.clearTimeout(speedResetTimer.current);
    }
    clearFinishTimer();
  }, [clearFinishTimer]);

  useEffect(() => {
    if (phase !== 'mission') {
      return;
    }

    const endTime = Date.now() + MISSION_DURATION_SECONDS * 1_000;
    const updateTimer = () => setMissionSecondsLeft(getMissionSecondsLeft(endTime, Date.now()));

    setMissionSecondsLeft(MISSION_DURATION_SECONDS);
    const timer = window.setInterval(updateTimer, 250);

    return () => window.clearInterval(timer);
  }, [completedMissions, phase]);

  const persistCompletedRound = useCallback(async (entry: DiaryEntry) => {
    if (savingRoundIds.current.has(entry.id)) {
      return;
    }

    savingRoundIds.current.add(entry.id);
    setSaveStatus('saving');

    try {
      const entries = await saveDiaryEntry(entry);
      const completedAtMs = Date.parse(entry.completedAt);
      const completedRefillState = getRefillState(entries, completedAtMs);
      setDiary(entries);
      setSaveStatus('saved');
      setHasActiveRun(false);
      setNowMs(Date.now());
      void logGameEvent('roll_complete', {
        daily_completed_count: completedRefillState.completedCount,
        completed_product_days: completedRefillState.completedProductDayCount,
        cooldown_minutes: completedRefillState.cooldownMinutes,
        cooldown_stage: completedRefillState.stage,
        is_golden: entry.isGolden,
        had_surprise: entry.hadSurprise === true,
        mission_count: entry.missionCount,
      });
    } catch {
      savingRoundIds.current.delete(entry.id);
      setSaveStatus('error');
    }
  }, []);

  const completeRound = useCallback(() => {
    if (phaseRef.current !== 'finishing') {
      return;
    }

    const entry: DiaryEntry = {
      id: round.id,
      completedAt: new Date().toISOString(),
      coreMessage: round.coreMessage,
      isGolden: round.isGolden,
      missionCount: round.missions.length,
      missionTitles: round.missions.map((mission) => mission.title),
      hadSurprise: round.surprisePanel !== null,
    };

    pointer.current = null;
    setSwipeSpeed(0);
    setCompletedEntry(entry);
    changePhase('result');
    void persistCompletedRound(entry);
  }, [changePhase, persistCompletedRound, round]);

  const beginFinishSequence = useCallback(() => {
    if (phaseRef.current !== 'rolling') {
      return;
    }

    pointer.current = null;
    setSwipeSpeed(0);
    changePhase('finishing');
    clearFinishTimer();
    finishTimer.current = window.setTimeout(() => {
      finishTimer.current = null;
      completeRound();
    }, ROLL_VISUAL_CONFIG.paperReleaseDurationMs);
  }, [changePhase, clearFinishTimer, completeRound]);

  const advanceRoll = useCallback(
    (pullUnits: number, velocity: number) => {
      if (phaseRef.current !== 'rolling' || pullUnits <= 0) {
        return;
      }

      const currentProgress = progressRef.current;
      const nextCheckpoint = round.checkpoints[completedMissionsRef.current];
      const requestedProgress = currentProgress + (pullUnits / TOTAL_PULL_UNITS) * 100;
      const stopAt = nextCheckpoint ?? 100;
      const nextProgress = clampForwardProgress(currentProgress, requestedProgress - currentProgress, stopAt);

      progressRef.current = nextProgress;
      setProgress(nextProgress);
      setSwipeSpeed(velocity);
      stopSpeedIndicator();

      if (nextCheckpoint !== undefined && nextProgress >= nextCheckpoint) {
        pointer.current = null;
        setSwipeSpeed(0);
        changePhase('mission');
        return;
      }

      if (nextProgress >= 100) {
        beginFinishSequence();
      }
    },
    [beginFinishSequence, changePhase, round.checkpoints, stopSpeedIndicator],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'rolling') {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    pointer.current = {
      id: event.pointerId,
      lastY: event.clientY,
      lastTime: event.timeStamp,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const tracker = pointer.current;
    if (tracker === null || tracker.id !== event.pointerId || phaseRef.current !== 'rolling') {
      return;
    }

    const deltaY = event.clientY - tracker.lastY;
    const deltaTime = event.timeStamp - tracker.lastTime;

    tracker.lastY = event.clientY;
    tracker.lastTime = event.timeStamp;

    const sample = calculatePullSample(deltaY, deltaTime);
    advanceRoll(sample.pullUnits, sample.velocity);
  };

  const releasePointer = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer.current?.id !== event.pointerId) {
      return;
    }

    pointer.current = null;
    stopSpeedIndicator();
  };

  const completeMission = () => {
    const nextCount = completedMissionsRef.current + 1;
    completedMissionsRef.current = nextCount;
    setCompletedMissions(nextCount);
    changePhase('rolling');
  };

  const resetPlayState = (nextRound: RoundPlan) => {
    clearFinishTimer();
    setRound(nextRound);
    progressRef.current = 0;
    completedMissionsRef.current = 0;
    setProgress(0);
    setCompletedMissions(0);
    setSwipeSpeed(0);
    setCompletedEntry(null);
    setSaveStatus('idle');
    changePhase('rolling');
  };

  const enterPlay = () => {
    if (isDiaryLoading) {
      return;
    }

    if (!hasActiveRun) {
      const currentNowMs = Date.now();
      const currentRefillState = getRefillState(diary, currentNowMs);

      if (currentRefillState.isLocked) {
        setNowMs(currentNowMs);
        return;
      }

      if (currentRefillState.availableAtMs !== null && currentRefillState.lastCompletionId !== null) {
        const returnKey = `${currentRefillState.lastCompletionId}:${currentRefillState.availableAtMs}`;

        if (loggedRefillImpressions.current.has(returnKey) && !loggedRefillReturns.current.has(returnKey)) {
          loggedRefillReturns.current.add(returnKey);
          void logGameEvent('refill_return', {
            cooldown_minutes: currentRefillState.cooldownMinutes,
            cooldown_stage: currentRefillState.stage,
            daily_completed_count: currentRefillState.completedCount,
            seconds_after_unlock: Math.max(0, Math.floor((currentNowMs - currentRefillState.availableAtMs) / 1_000)),
          });
        }
      }

      void logGameEvent('roll_start', {
        daily_roll_number: currentRefillState.nextRoundNumber,
        completed_product_days: currentRefillState.completedProductDayCount,
        previous_cooldown_minutes: currentRefillState.cooldownMinutes,
        previous_cooldown_stage: currentRefillState.stage,
      });
      resetPlayState(createRoundPlan(diary));
      setHasActiveRun(true);
    }

    setTestResetFeedback(null);
    setScreen('play');
  };

  const resetTestData = async () => {
    if (!import.meta.env.DEV || isDiaryLoading) {
      return;
    }

    try {
      await clearDiary();
      resetPlayState(createRoundPlan([]));
      savingRoundIds.current.clear();
      loggedRefillImpressions.current.clear();
      loggedRefillReturns.current.clear();
      setDiary([]);
      setHasActiveRun(false);
      setSelectedEntry(null);
      setNowMs(Date.now());
      setTestResetFeedback('초기화 완료 · 다음 판은 최초 판이에요.');
    } catch {
      setTestResetFeedback('초기화하지 못했어요.');
    }
  };

  const openDiaryEntry = (entry: DiaryEntry) => {
    setSelectedEntry(entry);
    setDetailFeedback(null);
  };

  const closeDiaryEntry = () => {
    setSelectedEntry(null);
    setDetailFeedback(null);
  };

  const getOutcomeMessage = (outcome: ResultActionOutcome) => {
    if (outcome === 'saved') {
      return '결과 카드를 사진으로 저장했어요.';
    }

    if (outcome === 'downloaded') {
      return '결과 카드 PNG를 내려받았어요.';
    }

    if (outcome === 'copied') {
      return '공유 문구를 복사했어요.';
    }

    return '공유 화면을 열었어요.';
  };

  const runDetailAction = async (action: Exclude<DetailAction, null>) => {
    if (selectedEntry === null || detailAction !== null) {
      return;
    }

    setDetailAction(action);
    setDetailFeedback(null);

    try {
      const outcome = action === 'save' ? await saveResultCard(selectedEntry) : await shareResult(selectedEntry);
      setDetailFeedback({ message: getOutcomeMessage(outcome), isError: false });
    } catch {
      setDetailFeedback({
        message: action === 'save' ? '이미지를 저장하지 못했어요. 다시 시도해 주세요.' : '결과를 공유하지 못했어요. 다시 시도해 주세요.',
        isError: true,
      });
    } finally {
      setDetailAction(null);
    }
  };

  const goldenCount = diary.filter((entry) => entry.isGolden).length;
  const refillState = getRefillState(diary, nowMs);
  const isPlayLocked = !hasActiveRun && refillState.isLocked;

  useEffect(() => {
    if (screen !== 'main' || isDiaryLoading || !isPlayLocked || refillState.availableAtMs === null || refillState.lastCompletionId === null) {
      return;
    }

    const impressionKey = `${refillState.lastCompletionId}:${refillState.availableAtMs}`;

    if (loggedRefillImpressions.current.has(impressionKey)) {
      return;
    }

    loggedRefillImpressions.current.add(impressionKey);
    void logGameEvent('refill_locked', {
      cooldown_minutes: refillState.cooldownMinutes,
      cooldown_stage: refillState.stage,
      daily_completed_count: refillState.completedCount,
      completed_product_days: refillState.completedProductDayCount,
    });
  }, [isDiaryLoading, isPlayLocked, refillState.availableAtMs, refillState.completedCount, refillState.completedProductDayCount, refillState.cooldownMinutes, refillState.lastCompletionId, refillState.stage, screen]);

  if (screen === 'main') {
    return (
      <main className={`app-shell main-screen ${isPlayLocked ? 'is-refilling' : ''}`}>
        <header className="main-header">
          <p className="eyebrow">작고 하찮은 성취 보관함</p>
          <h1>심봤다!</h1>
          <p>버린 휴지 끝에서, 해낸 일을 발견해요.</p>
        </header>

        <section className="diary-summary" aria-label="휴지심 수집 통계">
          <div>
            <span className="summary-label">
              <i className="summary-core" aria-hidden="true" />
              발견한 휴지심
            </span>
            <strong>{diary.length}</strong>
          </div>
          <div>
            <span className="summary-label">
              <i className="summary-core is-golden" aria-hidden="true" />
              황금 휴지심
            </span>
            <strong>{goldenCount}</strong>
          </div>
        </section>

        <section className="diary-section" aria-labelledby="diary-title">
          <div className="section-heading">
            <h2 id="diary-title">휴지심 보관함</h2>
            <span>최신순</span>
          </div>
          <p className="storage-note">보관함 기록은 이 기기에만 저장돼요.</p>
          {import.meta.env.DEV && (
            <div className="dev-reset-row">
              <button className="dev-reset-button" type="button" disabled={isDiaryLoading} onClick={() => void resetTestData()}>
                PC 테스트 데이터 초기화
              </button>
              {testResetFeedback !== null && <small role="status">{testResetFeedback}</small>}
            </div>
          )}

          {isDiaryLoading ? (
            <div className="diary-empty">보관함을 여는 중…</div>
          ) : diary.length === 0 ? (
            <div className="diary-empty">
              <div className="empty-core" aria-hidden="true" />
              <strong>아직 발견한 휴지심이 없어요</strong>
              <p>휴지 한 롤을 끝까지 풀면 첫 기록이 생겨요.</p>
            </div>
          ) : (
            <div className="diary-list">
              {diary.map((entry) => (
                <button className={`diary-entry ${entry.isGolden ? 'is-golden' : ''}`} key={entry.id} type="button" onClick={() => openDiaryEntry(entry)}>
                  <span className="diary-core" aria-hidden="true" />
                  <span className="diary-entry-copy">
                    <small>{formatDiaryDate(entry.completedAt)}</small>
                    <strong>{entry.coreMessage}</strong>
                    <em>{entry.missionCount}개 행동 미션 완료</em>
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        <footer className={`main-footer ${isPlayLocked ? 'is-refilling' : ''}`}>
          <button className="primary-cta" type="button" disabled={isDiaryLoading || isPlayLocked} onClick={enterPlay}>
            {isDiaryLoading ? (
              '기록 확인 중…'
            ) : hasActiveRun ? (
              '플레이 계속하기'
            ) : isPlayLocked && refillState.availableAtMs !== null ? (
              <>
                <span className="refill-cta-title">두루마리 휴지를 리필하고 있어요</span>
                <span className="refill-cta-timer">
                  {formatRefillAvailableTime(refillState.availableAtMs, nowMs)}에 다시 봐요 · {formatRemainingDuration(refillState.remainingMs)}
                </span>
              </>
            ) : (
              '새 휴지 풀기'
            )}
          </button>
        </footer>

        {selectedEntry !== null && (
          <div className="overlay diary-overlay" role="dialog" aria-modal="true" aria-labelledby="diary-detail-title" onClick={closeDiaryEntry}>
            <section className={`diary-detail ${selectedEntry.isGolden ? 'is-golden' : ''}`} onClick={(event) => event.stopPropagation()}>
              <span className="sheet-handle" aria-hidden="true" />
              <span className="card-kicker">{formatDiaryDate(selectedEntry.completedAt)}</span>
              <div className="result-core" aria-hidden="true">
                <span>{selectedEntry.coreMessage}</span>
              </div>
              <h2 id="diary-detail-title">{selectedEntry.isGolden ? '황금 휴지심' : '발견한 휴지심'}</h2>
              <p>{selectedEntry.missionTitles.join(' · ')}</p>
              <small className="share-note">PNG는 기기에 저장하고, 공유 버튼은 결과 문구와 앱 링크를 보내요.</small>
              <div className="detail-actions">
                <button className="secondary-action" type="button" disabled={detailAction !== null} onClick={() => void runDetailAction('save')}>
                  {detailAction === 'save' ? '만드는 중…' : '이미지 저장'}
                </button>
                <button type="button" disabled={detailAction !== null} onClick={() => void runDetailAction('share')}>
                  {detailAction === 'share' ? '준비 중…' : '결과 공유'}
                </button>
              </div>
              {detailFeedback !== null && (
                <p className={`detail-feedback ${detailFeedback.isError ? 'is-error' : ''}`} role="status">
                  {detailFeedback.message}
                </p>
              )}
              <button className="close-detail" type="button" onClick={closeDiaryEntry}>닫기</button>
            </section>
          </div>
        )}
      </main>
    );
  }

  const currentMission = round.missions[completedMissions];
  const speedLabel = phase === 'finishing' ? '툭!' : swipeSpeed > 1.6 ? '휙!' : swipeSpeed > 0.65 ? '슝—' : swipeSpeed > 0 ? '사각…' : '아래로 당겨요';
  const rollScale = getRollDiameterScale(progress);
  const rollDiameter = ROLL_VISUAL_CONFIG.fullRollDiameterPx * rollScale;
  const rollTop = 88 - rollDiameter / 2;
  const { sheetLength, guideLength, sheetTop, paperOffset, faceRotationDegrees, paperOpacity } = getRollVisualState(progress);
  const rollPatternOffset = paperOffset + rollTop;
  const paperMotionRange = ROLL_VISUAL_CONFIG.paperPanelHeightPx * ROLL_VISUAL_CONFIG.visualPanelPasses;
  const panelOriginOffset = ((sheetTop % ROLL_VISUAL_CONFIG.paperPanelHeightPx) + ROLL_VISUAL_CONFIG.paperPanelHeightPx) % ROLL_VISUAL_CONFIG.paperPanelHeightPx;
  const surprisePanelAnchor = round.surprisePanel === null
    ? -ROLL_VISUAL_CONFIG.paperPanelHeightPx * 2
    : paperMotionRange - round.surprisePanel.panelIndex * ROLL_VISUAL_CONFIG.paperPanelHeightPx + panelOriginOffset;
  const spinDuration = Math.max(70, 230 - swipeSpeed * 65);
  const motionTrailOpacity = Math.min(
    ROLL_VISUAL_CONFIG.motionTrailMaxOpacity,
    Math.max(0, swipeSpeed / 1.6) * ROLL_VISUAL_CONFIG.motionTrailMaxOpacity,
  );
  const missionTimerProgress = ((MISSION_DURATION_SECONDS - missionSecondsLeft) / MISSION_DURATION_SECONDS) * 100;

  const visualVariables = {
    '--roll-progress': `${progress}%`,
    '--roll-diameter': `${rollDiameter}px`,
    '--roll-top': `${rollTop}px`,
    '--sheet-length': `${sheetLength}px`,
    '--guide-length': `${guideLength}px`,
    '--sheet-top': `${sheetTop}px`,
    '--roll-pattern-offset': `${rollPatternOffset}px`,
    '--paper-offset': `${paperOffset}px`,
    '--paper-motion-range': `${paperMotionRange}px`,
    '--roll-rotation': `${faceRotationDegrees}deg`,
    '--paper-opacity': paperOpacity,
    '--paper-width': `${ROLL_VISUAL_CONFIG.paperWidthPx}px`,
    '--paper-panel-height': `${ROLL_VISUAL_CONFIG.paperPanelHeightPx}px`,
    '--core-hole-diameter': `${ROLL_VISUAL_CONFIG.coreHoleDiameterPx}px`,
    '--left-end-curve-depth': `${ROLL_VISUAL_CONFIG.leftEndCurveDepthPx}px`,
    '--roll-end-width': `${ROLL_VISUAL_CONFIG.rollEndWidthPx}px`,
    '--paper-release-duration': `${ROLL_VISUAL_CONFIG.paperReleaseDurationMs}ms`,
    '--paper-release-drop': `${ROLL_VISUAL_CONFIG.paperReleaseDropPx}px`,
    '--spin-duration': `${spinDuration}ms`,
    '--motion-trail-opacity': motionTrailOpacity,
    '--surprise-panel-anchor': `${surprisePanelAnchor}px`,
    '--surprise-panel-tilt': `${round.surprisePanel?.content.tiltDegrees ?? 0}deg`,
  } as CSSProperties;

  return (
    <main className="app-shell play-screen">
      <header className="top-bar">
        <div>
          <p className="eyebrow">하찮은 행동 미션</p>
          <h1>심봤다!</h1>
        </div>
        <button className="nav-button" type="button" disabled={phase === 'finishing'} onClick={() => setScreen('main')}>
          보관함
        </button>
      </header>

      <section className="progress-panel" aria-label={`휴지 진행률 ${Math.round(progress)}퍼센트`}>
        <div className="progress-copy">
          <span>낭비한 휴지</span>
          <strong>{Math.round(progress)}%</strong>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </section>

      <section
        className={`pull-zone ${phase !== 'rolling' ? 'is-paused' : ''} ${phase === 'finishing' ? 'is-finishing' : ''}`}
        data-testid="pull-zone"
        data-progress={progress.toFixed(2)}
        data-surprise-panel={round.surprisePanel?.content.id ?? ''}
        data-surprise-panel-index={round.surprisePanel?.panelIndex ?? ''}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={releasePointer}
        onPointerCancel={releasePointer}
        style={visualVariables}
      >
        <div className="holder" aria-hidden="true">
          <div className="wall-mount" />
          <div className="holder-arm" />
          <div className="paper-roll">
            <div className="paper-texture" />
          </div>
          <div className="paper-sheet">
            <div className="paper-motion-track">
              {round.surprisePanel !== null && (
                <div className={`surprise-panel is-${round.surprisePanel.content.kind}`} data-testid="surprise-panel">
                  {round.surprisePanel.content.text === undefined
                    ? <span className="surprise-doodle" />
                    : <span>{round.surprisePanel.content.text}</span>}
                </div>
              )}
            </div>
          </div>
          <div className="paper-guide">
            <span>↓</span>
            <span>아래로</span>
          </div>
          <div className="roll-end">
            <span className="roll-paper-face" />
          </div>
          <div className={`core-burst ${round.isGolden ? 'is-golden' : ''}`} />
          <div className="axle-front" />
        </div>

        <div className="gesture-hint" aria-live="polite">
          <strong>{speedLabel}</strong>
          <span>{phase === 'finishing' ? '마지막 휴지가 떨어졌어요' : '대각선도 괜찮아요 · 위로 올려도 되감기지 않아요'}</span>
        </div>
      </section>

      {phase === 'mission' && currentMission !== undefined && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="mission-title">
          <section className="mission-card">
            <span className="card-kicker">
              행동 미션 {completedMissions + 1}/{round.missions.length}
            </span>
            <h2 id="mission-title">{currentMission.title}</h2>
            <p>{currentMission.detail}</p>
            <div className="mission-timer" data-testid="mission-timer" aria-live="polite">
              <div className="mission-time-copy">
                <span>가이드 타이머</span>
                <strong>{missionSecondsLeft > 0 ? formatMissionTime(missionSecondsLeft) : '충분해요'}</strong>
              </div>
              <div className="mission-time-track">
                <div className="mission-time-fill" style={{ width: `${missionTimerProgress}%` }} />
              </div>
              <small>끝냈다면 시간이 남아도 바로 완료해도 돼요.</small>
            </div>
            <button type="button" onClick={completeMission}>
              완료했어요, 계속 풀기
            </button>
          </section>
        </div>
      )}

      {phase === 'result' && completedEntry !== null && (
        <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
          <section className={`result-card ${round.isGolden ? 'is-golden' : ''}`}>
            <span className="card-kicker">{round.isGolden ? '특별 판 완료' : '한 롤 완료'}</span>
            <div className="result-core" aria-hidden="true">
              <span>{round.coreMessage}</span>
            </div>
            <h2 id="result-title">{round.isGolden ? '황금 휴지심!' : '휴지심 발견!'}</h2>
            <p>
              {saveStatus === 'error'
                ? '보관함에 저장하지 못했어요. 다시 시도해 주세요.'
                : round.isGolden
                  ? '두 번 해낸 사람만 만나는 조금 유난스러운 휴지심이에요.'
                  : '오늘 해낸 작은 일을 보관함에 남겼어요.'}
            </p>
            {saveStatus === 'error' ? (
              <button type="button" onClick={() => void persistCompletedRound(completedEntry)}>
                저장 다시 시도
              </button>
            ) : (
              <button type="button" disabled={saveStatus !== 'saved'} onClick={() => setScreen('main')}>
                {saveStatus === 'saved' ? '보관함으로 돌아가기' : '보관함에 저장 중…'}
              </button>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
