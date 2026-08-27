export const ROLL_VISUAL_CONFIG = {
  // 롤 본체와 아래로 풀린 휴지의 공통 폭.
  paperWidthPx: 206,
  // 시작할 때 새 두루마리 휴지의 외경.
  fullRollDiameterPx: 153,
  // 절취선부터 다음 절취선까지 한 칸의 간격.
  paperPanelHeightPx: 73,
  // 0~100% 동안 화면을 지나가는 휴지 칸 수. 높을수록 절취선이 더 빠르게 넘어간다.
  visualPanelPasses: 18,
  // 0~100% 동안 오른쪽 단면이 도는 횟수. 휴지 칸 이동량과 독립적으로 조절한다.
  visualRollTurns: 7,
  // 빠른 스와이프에서 절취선 뒤에 남는 잔상의 최대 불투명도. 0이면 잔상을 끈다.
  motionTrailMaxOpacity: 0.22,
  // 종이를 모두 풀었을 때 남는 휴지심의 외경.
  coreDiameterPx: 88,
  // 휴지심 가운데 구멍의 세로 직경. 외경과 별도로 조절한다.
  coreHoleDiameterPx: 41,
  // 1~100. 50은 기존 조작량, 100은 약 2배 민감, 1은 약 절반 민감.
  swipeWeight: 55,
  // 1~100. 50은 기존 속도 가속, 높을수록 빠른 한 번의 스와이프가 더 많이 풀린다.
  swipeAcceleration: 87,
  // 0~100. 황금 휴지심의 생성 확률, 전체를 100으로 두고 계산
  goldenCoreChancePercent: 13,
  // 첫 완료 이후 돌발 휴지 칸이 등장할 확률. 직전 등장 판 다음에는 쿨다운이 우선한다.
  surprisePanelChancePercent: 35,
  // 돌발 휴지 칸 등장 뒤 반드시 쉬는 완료 판 수.
  surprisePanelCooldownRounds: 1,
  // 왼쪽 단면 반타원이 가로로 들어오는 깊이. 오른쪽 단면 폭 46px의 절반이 기본값이다.
  leftEndCurveDepthPx: 23,
  // Width of the visible right-side ellipse. The hanging sheet ends at its left tangent.
  rollEndWidthPx: 46,
  // 0도는 축 높이의 정면 접점. 양수는 풀린 휴지 시작점을 롤 위쪽으로 이동시킨다.
  paperStartAngleDegrees: 0,
  // 100% 도달 후 휴지가 분리되어 결과 팝업이 뜨기까지의 시간.
  paperReleaseDurationMs: 900,
  // 분리된 휴지가 아래로 떨어지는 거리.
  paperReleaseDropPx: 260,
  // 이 진행률부터 흰 종이층이 점차 사라져 휴지심이 드러난다.
  paperFadeStartProgress: 88,
} as const;

export function getGoldenCoreProbability(percent = ROLL_VISUAL_CONFIG.goldenCoreChancePercent) {
  return Math.min(100, Math.max(0, percent)) / 100;
}
